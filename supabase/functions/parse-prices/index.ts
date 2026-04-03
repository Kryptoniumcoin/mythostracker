const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractAndParseJson(raw: string): { products: { name: string; price: number; currency?: string }[] } {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  // Remove <think>...</think> blocks from reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  if (jsonStart === -1) throw new Error('No JSON found');

  const isArray = cleaned[jsonStart] === '[';
  const closeChar = isArray ? ']' : '}';
  const jsonEnd = cleaned.lastIndexOf(closeChar);

  if (jsonEnd <= jsonStart) {
    cleaned = cleaned.substring(jsonStart);
    cleaned = cleaned.replace(/,\s*\{[^}]*$/, '');
    const openBrackets = (cleaned.match(/\[/g) || []).length - (cleaned.match(/\]/g) || []).length;
    const openBraces = (cleaned.match(/\{/g) || []).length - (cleaned.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces; i++) cleaned += '}';
    for (let i = 0; i < openBrackets; i++) cleaned += ']';
  } else {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  cleaned = cleaned
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .replace(/[\x00-\x1F\x7F]/g, '');

  const parsed = JSON.parse(cleaned);

  if (Array.isArray(parsed)) return { products: parsed };
  if (parsed.products && Array.isArray(parsed.products)) return parsed;
  return { products: [] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { retailerName, content } = await req.json();

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

    const truncated = content.slice(0, 6000);

    const prompt = `Extract ALL Baby Brezza products with prices from this ${retailerName} page content. Return JSON only:
{"products":[{"name":"Product Name","price":123.45,"currency":"AED"}]}
Rules: numeric prices only, use AED as currency. Return ONLY the JSON object, no markdown, no explanation.
Content:
${truncated}`;

    console.log(`Calling OpenRouter API for ${retailerName}...`);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-32b:free',
        messages: [
          { role: 'system', content: 'Extract Baby Brezza product prices. Return valid JSON only. No markdown, no explanations.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter API error:', response.status, errText);
      return new Response(JSON.stringify({ success: true, retailer: retailerName, data: { products: [] } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    console.log(`AI response for ${retailerName}:`, aiContent.slice(0, 300));

    try {
      const parsed = extractAndParseJson(aiContent);
      console.log(`Parsed ${parsed.products.length} products for ${retailerName}`);
      return new Response(JSON.stringify({ success: true, retailer: retailerName, data: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      console.error('Failed to parse:', aiContent.slice(0, 500), 'Error:', e.message);
      return new Response(JSON.stringify({ success: true, retailer: retailerName, data: { products: [] } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('parse-prices error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
