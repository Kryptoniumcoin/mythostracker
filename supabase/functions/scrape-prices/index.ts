const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RETAILERS = ['BabyBreza.me', 'Amazon AE', 'Mumzworld', 'Noon', 'Centerpoint', 'Babyshop'] as const;

interface ProductEntry {
  name: string;
  key: string;
  urls: Record<string, string | null>;
}

const PRODUCT_CATALOG: ProductEntry[] = [
  {
    name: 'Formula Pro Advanced (White)',
    key: 'formula-pro-advanced-white',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/formula-pro-advanced',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Formula-Advanced-Automatic/dp/B00CWXWV8M',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-pro-advanced-formula-dispenser-tc-frp0046',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-new-and-improved-formula-pro-advanced-formula-dispenser-machine-automatically-mix-a-warm-formula-bottle-instantly-easily-make-bottle-with-automatic-powder-blending-white/N47872656A/p/',
      'Centerpoint': 'https://www.centrepointstores.com/ae/en/buy-baby-brezza-pro-advanced-baby-formula-dispenser/p/164358424',
      'Babyshop': 'https://www.babyshopstores.com/ae/en/buy-baby-brezza-pro-advanced-baby-formula-dispenser/p/164358424',
    },
  },
  {
    name: 'Formula Pro Advanced (Black)',
    key: 'formula-pro-advanced-black',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/formula-pro-advanced-premium-black',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Improved-Advanced-Dispenser/dp/B0C61N2XG4',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-formula-pro-advanced-machine-premium-black-19468963-frp0131',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-new-and-improved-formula-pro-advanced-formula-dispenser-machine-automatically-mix-a-warm-formula-bottle-instantly-easily-make-bottle-with-automatic-powder-blending-black/Z1EA9EF4B1122C7B25435Z/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Formula Pro Advanced WiFi',
    key: 'formula-pro-advanced-wifi',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/formula-pro-advanced-wifi-formula-dispenser',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Formula-Advanced-Dispenser/dp/B09WZGV1HD',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-formula-pro-advanced-wifi-mobile-app-connected-black-19468963-frp0066',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-formula-pro-advanced-wifi-formula-dispenser-automatically-mix-a-warm-formula-bottle-from-your-phone-instantly-easily-make-bottle-with-automatic-powder-blending-machine-black/Z9F4B58F850D0BD8D5724Z/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Formula Pro Mini',
    key: 'formula-pro-mini',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/formula-pro-mini',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Formula-Machine-Portable/dp/B0B4X54TJT',
      'Mumzworld': null,
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-formula-pro-mini-baby-formula-mixer-machine-fits-small-spaces-and-is-portable-for-travel-bottle-makers-makes-the-perfect-bottle-for-your-infant-on-the-go-white/Z4A407BE0317F00AC3046Z/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Bottle Washer Pro (Black)',
    key: 'bottle-washer-pro-black',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/bottle-washer-pro-all-in-one-washer-sterilizer-dryer-premium-black',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Bottle-Washer-All/dp/B0FP2Y2LJN',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-pro-bottle-washer-black-19468963-brz0190',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-bottle-washer-pro-black/ZC5CFEBC049A6B02F6AB6Z/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Bottle Washer Pro (White)',
    key: 'bottle-washer-pro-white',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/bottle-washer-pro',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Bottle-Washer-Pro/dp/B0CT3R5B9J',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-pro-automatic-bottle-washer-sterilizer-dryer-black-white-exclusive',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-bottle-washer-pro-baby-bottle-washer-sterilizer-dryer-all-in-one-machine-cleans-bottles-pump-parts-sippy-cups-replaces-hand-washing-bottle-brushes-and-drying-racks/ZA2DE0114D329FC1FF946Z/p/',
      'Centerpoint': 'https://www.centrepointstores.com/ae/en/buy-baby-brezza-electric-sterilizer-and-bottle-washer/p/166467465',
      'Babyshop': 'https://www.babyshopstores.com/ae/en/buy-baby-brezza-electric-sterilizer-and-bottle-washer/p/166467465',
    },
  },
  {
    name: 'Sterilizer & Dryer Advanced (White)',
    key: 'sterilizer-dryer-advanced-white',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/sterilizer-dryer-advanced',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Bottle-Sterilizer-Advanced/dp/B0B9T265BW',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-one-step-baby-bottle-sterilizer-and-dryer-advanced-1040311',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-bottle-sterilizer-and-dryer-advanced-electric-steam-sterilization-machine-universal-sterilizing-for-all-bottles-plastic-glass-pacifiers-breast-pump-parts-hepa-filtration-white/N49686763A/p/',
      'Centerpoint': 'https://www.centrepointstores.com/ae/en/buy-baby-brezza-sterilizerdryer-one-step/p/164816824',
      'Babyshop': 'https://www.babyshopstores.com/ae/en/buy-baby-brezza-food-maker-deluxe-one-step/p/164358425',
    },
  },
  {
    name: 'Sterilizer & Dryer Advanced (Black)',
    key: 'sterilizer-dryer-advanced-black',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/steriliser-dryer-advanced-black',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Bottle-Sterilizer-Advanced/dp/B0DGXQ9ZK1',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-one-step-baby-bottle-sterilizer-and-dryer-advanced-premium-black-19468963-brz0172',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-bottle-sterilizer-and-dryer-advanced-electric-steam-sterilization-machine-universal-sterilizing-for-all-bottles-plastic-glass-pacifiers-breast-pump-parts-hepa-filtration-black/Z8AF2134EC5B265D0FF1FZ/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Superfast Sterilizer & Dryer',
    key: 'sterilizer-dryer-superfast',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/superfast-sterilizer-dryer-only-10-minutes-to-sterilize-dry',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Minute-Bottle-Sterilizer/dp/B0CR6MRT9D',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-super-fast-sterilizer-dryer-white',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-10-minute-baby-bottle-sterilizer-dryer-superfast-electric-steam-sterilization-universal-sterilizing-for-all-bottles-pacifiers-breast-pump-parts/ZBDCF031BC3E873475AB2Z/p/',
      'Centerpoint': 'https://www.centrepointstores.com/ae/en/buy-baby-brezza-super-fast-sterilizer-dryer/p/165672288',
      'Babyshop': 'https://www.babyshopstores.com/ae/en/buy-baby-brezza-super-fast-sterilizer-dryer/p/165672288',
    },
  },
  {
    name: 'One Step Sterilizer & Dryer (Dome)',
    key: 'sterilizer-dryer-dome',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/one-step%E2%84%A2-baby-bottle-sterilizer-and-dryer-electric-steam-sterilizer',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Bottle-Sterilizer-Machine/dp/B0F28D25JZ',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-baby-bottle-sterilizer-and-dryer-machine-white-19468963-brz0098',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-baby-bottle-sterilizer-and-dryer-machine-electric-steam-sterilization-universal-fit-pacifiers-glass-plastic-and-newborn-feeding-bottles/Z98100166FC566AA32316Z/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Portable Bottle Warmer',
    key: 'portable-bottle-warmer',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/portable-bottle-warmer',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Portable-Warmer-Breastmilk/dp/B0DPL81FJM',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-superfast-portable-bottle-warmer-black-19468963-brz0179',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-superfast-portable-baby-bottle-warmer-67-faster-travel-breastmilk-warmer-and-formula-warmer-safe-even-heating-up-to-9oz-no-adapters-black/ZBD429B0266449FF4D59AZ/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Safe + Smart Bottle Warmer',
    key: 'bottle-warmer-safe-smart',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/safe-smart-baby-bottle-warmer',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Bottle-Breastmilk-Defroster/dp/B09H17F8F3',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-safe-smart-bottle-warmer-1040312',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-smart-baby-bottle-warmer-breastmilk-warmer-defroster-only-brand-with-different-temperatures-for-breastmilk-formula-universal-fit-for-all-bottles-milk-bags-bluetooth-control/N49686765A/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'Instant Warmer',
    key: 'instant-warmer',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/instant-warmer',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Instant-Warmer-Temperatures/dp/B081BMMW5F',
      'Mumzworld': null,
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-instant-baby-bottle-warmer-fast-water-warmer-instantly-dispenses-24-7-in-3-temperatures-white/N49686766A/p/',
      'Centerpoint': null,
      'Babyshop': null,
    },
  },
  {
    name: 'One Step Food Maker Deluxe',
    key: 'food-maker-deluxe',
    urls: {
      'BabyBreza.me': 'https://babybrezza.me/products/one-step-food-maker-deluxe',
      'Amazon AE': 'https://www.amazon.ae/Baby-Brezza-Step-Maker-Deluxe/dp/B00CWXWWM2',
      'Mumzworld': 'https://www.mumzworld.com/en/baby-brezza-one-step-food-maker-set',
      'Noon': 'https://www.noon.com/uae-en/baby-brezza-one-step-baby-food-maker-deluxe-auto-shut-off-dishwasher-safe-cooker-and-blender-to-steam-puree-organic-food-for-infants-toddlers-set-of-3-pouches-3-funnels/N47872655A/p/',
      'Centerpoint': 'https://www.centrepointstores.com/ae/en/buy-baby-brezza-food-maker-deluxe-one-step/p/164358425',
      'Babyshop': 'https://www.babyshopstores.com/ae/en/buy-baby-brezza-food-maker-deluxe-one-step/p/164358425',
    },
  },
];

// Scrape a single URL using Firecrawl
async function scrapeUrl(url: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return (data.data?.markdown || data.markdown || '').slice(0, 4000);
    }
    console.error(`Scrape failed for ${url}:`, data.error);
    return null;
  } catch (e) {
    console.error(`Scrape error for ${url}:`, e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build list of all URLs to scrape
    const scrapeJobs: { productKey: string; retailer: string; url: string }[] = [];
    for (const product of PRODUCT_CATALOG) {
      for (const [retailer, url] of Object.entries(product.urls)) {
        if (url) {
          scrapeJobs.push({ productKey: product.key, retailer, url });
        }
      }
    }

    console.log(`Scraping ${scrapeJobs.length} individual product pages...`);

    // Scrape in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    const scrapeResults: { productKey: string; retailer: string; content: string | null }[] = [];

    for (let i = 0; i < scrapeJobs.length; i += BATCH_SIZE) {
      const batch = scrapeJobs.slice(i, i + BATCH_SIZE);
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(scrapeJobs.length / BATCH_SIZE)}: scraping ${batch.map(j => j.retailer).join(', ')}`);

      const batchResults = await Promise.all(
        batch.map(async (job) => {
          const content = await scrapeUrl(job.url, FIRECRAWL_API_KEY);
          return { productKey: job.productKey, retailer: job.retailer, content };
        })
      );
      scrapeResults.push(...batchResults);
    }

    // Group scraped content by retailer for AI parsing
    const retailerContent: Record<string, { productKey: string; content: string }[]> = {};
    for (const result of scrapeResults) {
      if (result.content) {
        if (!retailerContent[result.retailer]) {
          retailerContent[result.retailer] = [];
        }
        retailerContent[result.retailer].push({
          productKey: result.productKey,
          content: result.content,
        });
      }
    }

    // Build response with catalog info
    const retailerStatuses = RETAILERS.map(name => {
      const items = retailerContent[name] || [];
      return {
        name,
        success: items.length > 0,
        scrapedCount: items.length,
        error: items.length === 0 ? 'No products scraped' : undefined,
      };
    });

    return new Response(JSON.stringify({
      success: true,
      catalog: PRODUCT_CATALOG.map(p => ({ name: p.name, key: p.key })),
      retailerContent,
      retailerStatuses,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('scrape-prices error:', e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
