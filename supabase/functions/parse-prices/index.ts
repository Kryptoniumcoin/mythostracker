const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractAndParseJson(raw: string): { price: number; currency?: string } | null {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) return null;

  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonEnd <= jsonStart) return null;

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1F\x7F]/g, '');

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.price === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { productKey, retailerName, content } = await req.json();

    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'OpenRouter API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!content || !retailerName) {
      return new Response(JSON.stringify({ success: false, error: 'retailerName and content required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const truncated = content.slice(0, 4000);

    const prompt = `Extract the main product price in AED from this ${retailerName} product page. Return JSON only:
{"price": 123.45, "currency": "AED"}
Rules:
- Return the current/sale price, not the original price if there's a discount
- Numeric price only (no commas, no currency symbols)
- If the product is out of stock or price not found, return {"price": 0, "currency": "AED"}
- Return ONLY the JSON object, no markdown, no explanation
Content:
${truncated}`;

    // Retry with exponential backoff for rate limits
    let response: Response | null = null;
    const MAX_RETRIES = 4;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3.6-plus:free',
          messages: [
            { role: 'system', content: 'Extract the product price. Return valid JSON only. No markdown, no explanations.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 256,
          temperature: 0.1,
        }),
      });

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt + 1) * 1000 + Math.random() * 1000;
        console.log(`Rate limited for ${productKey}@${retailerName}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      const errText = response ? await response.text() : 'No response';
      console.error('OpenRouter API error:', response?.status, errText);
      return new Response(JSON.stringify({ success: true, productKey, retailer: retailerName, data: { price: 0, currency: 'AED' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    console.log(`AI price for ${productKey}@${retailerName}:`, aiContent.slice(0, 200));

    const parsed = extractAndParseJson(aiContent);
    const result = parsed || { price: 0, currency: 'AED' };

    return new Response(JSON.stringify({ success: true, productKey, retailer: retailerName, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('parse-prices error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
