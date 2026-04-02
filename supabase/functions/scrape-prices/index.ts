import { corsHeaders } from '@supabase/supabase-js/cors'

const RETAILERS = [
  { name: "Amazon AE", url: "https://www.amazon.ae/s?k=baby+brezza", domain: "amazon.ae" },
  { name: "Mumzworld", url: "https://www.mumzworld.com/en/catalogsearch/result/?q=baby+brezza", domain: "mumzworld.com" },
  { name: "Noon", url: "https://www.noon.com/uae-en/search/?q=baby+brezza", domain: "noon.com" },
  { name: "Centerpoint", url: "https://www.centrepoint.com/ae/en/search?q=baby+brezza", domain: "centrepoint.com" },
  { name: "Babyshop", url: "https://www.babyshop.com/ae/en/search?q=baby+brezza", domain: "babyshop.com" },
  { name: "BabyBreza.me", url: "https://babybrezza.me/collections/all", domain: "babybrezza.me" },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { retailer } = await req.json();
    
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const target = retailer 
      ? RETAILERS.find(r => r.name === retailer) 
      : null;
    
    const retailersToScrape = target ? [target] : RETAILERS;
    const results = [];

    for (const r of retailersToScrape) {
      try {
        console.log(`Scraping ${r.name}: ${r.url}`);
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: r.url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          results.push({
            retailer: r.name,
            domain: r.domain,
            content: (data.data?.markdown || data.markdown || '').slice(0, 8000),
            success: true,
          });
        } else {
          console.error(`Failed to scrape ${r.name}:`, data);
          results.push({ retailer: r.name, domain: r.domain, success: false, error: data.error || 'Scrape failed' });
        }
      } catch (e) {
        console.error(`Error scraping ${r.name}:`, e);
        results.push({ retailer: r.name, domain: r.domain, success: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('scrape-prices error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
