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

    // Configurable AI endpoint - supports OpenClaw, OpenRouter, Ollama, LiteLLM, etc.
    // Defaults to OpenRouter if AI_BASE_URL is not set
    const AI_BASE_URL = Deno.env.get('AI_BASE_URL') || 'https://openrouter.ai/api/v1';
    const AI_MODEL = Deno.env.get('AI_MODEL') || 'qwen/qwen3.6-plus:free';
    const AI_API_KEY = Deno.env.get('AI_API_KEY') || Deno.env.get('OPENROUTER_API_KEY') || '';

    if (!AI_API_KEY && !AI_BASE_URL.includes('localhost')) {
      return new Response(JSON.stringify({ success: false, error: 'AI API key not configured. Set AI_API_KEY env var.' }), {
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

    // Build auth headers - skip Authorization if no key (local mode)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (AI_API_KEY) {
      headers['Authorization'] = `Bearer ${AI_API_KEY}`;
    }

    const endpoint = `${AI_BASE_URL.replace(/\/$/, '')}/chat/completions`;

    // Retry with exponential backoff for rate limits
    let response: Response | null = null;
    const MAX_RETRIES = 4;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: AI_MODEL,
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
      console.error('AI API error:', response?.status, errText);
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
