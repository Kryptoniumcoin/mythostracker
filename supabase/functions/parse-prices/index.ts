const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { retailerName, content } = await req.json();

    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
    if (!NVIDIA_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'NVIDIA API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!content || !retailerName) {
      return new Response(JSON.stringify({ success: false, error: 'retailerName and content required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Keep content short to reduce AI processing time
    const truncated = content.slice(0, 4000);

    const prompt = `Extract ALL Baby Brezza products with prices from this ${retailerName} page content. Return JSON only:
{"products":[{"name":"Product Name","price":123.45,"currency":"AED"}]}
Rules: numeric prices only, use AED if currency unclear, convert USD prices noting original currency.
Content:
${truncated}`;

    console.log(`Calling NVIDIA API for ${retailerName}...`);
    
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.5-122b-a10b',
        messages: [
          { role: 'system', content: 'Extract prices. Return valid JSON only. No markdown, no explanations.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.1,
        stream: false,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('NVIDIA API error:', response.status, errText);
      return new Response(JSON.stringify({ success: false, error: `AI error: ${response.status}` }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    console.log(`AI response for ${retailerName}:`, aiContent.slice(0, 200));

    // Extract JSON
    let jsonStr = aiContent;
    const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];

    try {
      const parsed = JSON.parse(jsonStr);
      return new Response(JSON.stringify({ success: true, retailer: retailerName, data: parsed }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      console.error('Failed to parse:', aiContent.slice(0, 500));
      return new Response(JSON.stringify({ success: false, error: 'Failed to parse AI response', retailer: retailerName }), {
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
