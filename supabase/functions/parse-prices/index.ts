import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { scrapedData } = await req.json();

    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
    if (!NVIDIA_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'NVIDIA API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const successfulScrapes = scrapedData.filter((s: any) => s.success);
    if (successfulScrapes.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No successful scrapes to parse' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `You are an expert at extracting product pricing data. Analyze the following scraped content from Baby Brezza retailer pages in the Middle East. Extract ALL Baby Brezza products with their names and prices (in AED or local currency).

For each retailer's content below, extract products and prices:

${successfulScrapes.map((s: any) => `--- ${s.retailer} (${s.domain}) ---\n${s.content}\n`).join('\n')}

Return a JSON object with this exact structure:
{
  "products": [
    {
      "name": "Product Name (normalized, e.g. 'Baby Brezza Formula Pro Advanced')",
      "prices": {
        "Retailer Name": { "price": 999.00, "currency": "AED", "available": true },
        ...
      }
    }
  ]
}

Rules:
- Normalize product names so the same product across retailers matches
- Use numeric prices only (no currency symbols)
- If a product is not found on a retailer, set available: false and price: null
- Include ALL Baby Brezza products found
- Group identical/similar products together
- Return ONLY the JSON, no other text`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.5-122b-a10b',
        messages: [
          { role: 'system', content: 'You are a price extraction assistant. Always respond with valid JSON only. No markdown, no explanations.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 8192,
        temperature: 0.3,
        top_p: 0.9,
        stream: false,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('NVIDIA API error:', response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limited. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: false, error: `AI API error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response (handle possible markdown wrapping)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    // Also try to find raw JSON object
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      jsonStr = objMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return new Response(JSON.stringify({ success: true, data: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseErr) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ success: false, error: 'Failed to parse AI response', raw: content.slice(0, 2000) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('parse-prices error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
