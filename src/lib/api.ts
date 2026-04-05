import { supabase } from '@/integrations/supabase/client';

export interface RetailerPrice {
  price: number | null;
  currency: string;
  available: boolean;
}

export interface Product {
  name: string;
  prices: Record<string, RetailerPrice>;
}

export interface PriceData {
  products: Product[];
  scrapedAt: string;
  retailerStatuses: { name: string; success: boolean; error?: string }[];
}

interface ScrapedRetailer {
  retailer: string;
  domain: string;
  content: string;
  success: boolean;
  error?: string;
}

interface ParsedProduct {
  name: string;
  price: number;
  currency?: string;
}

// Known Baby Brezza product keywords for fuzzy matching
const PRODUCT_KEYWORDS: { key: string; keywords: string[] }[] = [
  // Formula line — order matters: most specific first
  { key: 'formula-pro-advanced-wifi', keywords: ['formula', 'pro', 'advanced', 'wifi'] },
  { key: 'formula-pro-advanced-black', keywords: ['formula', 'pro', 'advanced', 'black'] },
  { key: 'formula-pro-advanced-black', keywords: ['formula', 'pro', 'advanced', 'premium'] },
  { key: 'formula-pro-advanced-white', keywords: ['formula', 'pro', 'advanced', 'white'] },
  { key: 'formula-pro-advanced-white', keywords: ['formula', 'pro', 'advanced'] },
  { key: 'formula-pro-mini', keywords: ['formula', 'pro', 'mini'] },
  { key: 'formula-pro-mini', keywords: ['formula', 'machine', 'portable'] },

  // Bottle Washer
  { key: 'bottle-washer-pro-black', keywords: ['bottle', 'washer', 'pro', 'black'] },
  { key: 'bottle-washer-pro-white', keywords: ['bottle', 'washer', 'pro', 'white'] },
  { key: 'bottle-washer-pro-white', keywords: ['bottle', 'washer', 'pro'] },
  { key: 'bottle-washer-pro-white', keywords: ['washer', 'steriliz', 'dryer', 'all'] },

  // Sterilizer & Dryer
  { key: 'sterilizer-dryer-advanced-black', keywords: ['steriliz', 'dryer', 'advanced', 'black'] },
  { key: 'sterilizer-dryer-advanced-black', keywords: ['steriliser', 'dryer', 'advanced', 'black'] },
  { key: 'sterilizer-dryer-advanced-white', keywords: ['steriliz', 'dryer', 'advanced', 'white'] },
  { key: 'sterilizer-dryer-advanced-white', keywords: ['steriliz', 'dryer', 'advanced'] },
  { key: 'sterilizer-dryer-advanced-white', keywords: ['steriliser', 'dryer', 'advanced'] },
  { key: 'sterilizer-dryer-superfast', keywords: ['superfast', 'steriliz'] },
  { key: 'sterilizer-dryer-superfast', keywords: ['super', 'fast', 'steriliz'] },
  { key: 'sterilizer-dryer-superfast', keywords: ['10', 'minute', 'steriliz'] },
  { key: 'sterilizer-dryer-dome', keywords: ['steriliz', 'dryer', 'dome'] },
  { key: 'sterilizer-dryer-dome', keywords: ['one', 'step', 'steriliz', 'dryer'] },
  { key: 'sterilizer-dryer-dome', keywords: ['steriliz', 'dryer', 'electric', 'steam'] },

  // Warmers
  { key: 'portable-bottle-warmer', keywords: ['portable', 'bottle', 'warmer'] },
  { key: 'portable-bottle-warmer', keywords: ['portable', 'warmer'] },
  { key: 'bottle-warmer-safe-smart', keywords: ['safe', 'smart', 'warmer'] },
  { key: 'bottle-warmer-safe-smart', keywords: ['smart', 'bottle', 'warmer', 'bluetooth'] },
  { key: 'bottle-warmer-safe-smart', keywords: ['smart', 'bottle', 'warmer', 'defroster'] },
  { key: 'instant-warmer', keywords: ['instant', 'warmer'] },
  { key: 'instant-warmer', keywords: ['instant', 'water', 'warmer'] },

  // Food
  { key: 'food-maker-deluxe', keywords: ['food', 'maker', 'deluxe'] },
  { key: 'food-maker-deluxe', keywords: ['food', 'maker'] },

  // Accessories
  { key: 'descaler-tablets', keywords: ['descal', 'tablet'] },
  { key: 'gift-card', keywords: ['gift', 'card'] },
];

const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  'formula-pro-advanced-wifi': 'Formula Pro Advanced WiFi',
  'formula-pro-advanced-white': 'Formula Pro Advanced (White)',
  'formula-pro-advanced-black': 'Formula Pro Advanced (Black)',
  'formula-pro-mini': 'Formula Pro Mini',
  'bottle-washer-pro-black': 'Bottle Washer Pro (Black)',
  'bottle-washer-pro-white': 'Bottle Washer Pro (White)',
  'sterilizer-dryer-advanced-white': 'Sterilizer & Dryer Advanced (White)',
  'sterilizer-dryer-advanced-black': 'Sterilizer & Dryer Advanced (Black)',
  'sterilizer-dryer-superfast': 'Superfast Sterilizer & Dryer',
  'sterilizer-dryer-dome': 'One Step Sterilizer & Dryer (Dome)',
  'portable-bottle-warmer': 'Portable Bottle Warmer',
  'bottle-warmer-safe-smart': 'Safe + Smart Bottle Warmer',
  'instant-warmer': 'Instant Warmer',
  'food-maker-deluxe': 'One Step Food Maker Deluxe',
  'descaler-tablets': 'Universal Descaler Tablets',
  'gift-card': 'Gift Card',
};

function matchProductKey(name: string): string | null {
  const lower = name.toLowerCase();

  // Sort by number of keywords descending so more specific matches win
  for (const { key, keywords } of PRODUCT_KEYWORDS) {
    const allMatch = keywords.every(kw => lower.includes(kw));
    if (allMatch) return key;
  }

  return null;
}

export async function fetchPrices(
  onProgress?: (msg: string) => void
): Promise<PriceData> {
  const log = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  // Step 1: Scrape all retailers
  log("Scraping retailer websites...");
  const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke('scrape-prices', {
    body: {},
  });

  if (scrapeError) throw new Error(scrapeError.message);
  if (!scrapeResult?.success) throw new Error(scrapeResult?.error || 'Scraping failed');

  const retailerStatuses = scrapeResult.results.map((r: ScrapedRetailer) => ({
    name: r.retailer,
    success: r.success,
    error: r.error,
  }));

  const successfulScrapes = scrapeResult.results.filter((r: ScrapedRetailer) => r.success);
  log(`Scraped ${successfulScrapes.length} retailers successfully.`);

  // Step 2: Parse each retailer individually
  const allRetailerProducts: Record<string, ParsedProduct[]> = {};

  for (const scrape of successfulScrapes) {
    try {
      log(`Analyzing ${scrape.retailer} with AI...`);
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-prices', {
        body: { retailerName: scrape.retailer, content: scrape.content },
      });

      if (parseError) {
        console.error(`Parse error for ${scrape.retailer}:`, parseError);
        continue;
      }
      if (parseResult?.success && parseResult?.data?.products) {
        allRetailerProducts[scrape.retailer] = parseResult.data.products;
        log(`Found ${parseResult.data.products.length} products from ${scrape.retailer}`);
      }
    } catch (e) {
      console.error(`Failed to parse ${scrape.retailer}:`, e);
    }
  }

  // Step 3: Merge products across retailers using fuzzy keyword matching
  const productMap = new Map<string, Product>();

  for (const [retailer, products] of Object.entries(allRetailerProducts)) {
    for (const p of products) {
      const matchedKey = matchProductKey(p.name);
      const key = matchedKey || normalizeProductName(p.name);
      const displayName = matchedKey
        ? PRODUCT_DISPLAY_NAMES[matchedKey] || p.name
        : p.name;

      if (!productMap.has(key)) {
        productMap.set(key, {
          name: displayName,
          prices: {},
        });
      }
      const product = productMap.get(key)!;
      // If this retailer already has a price for this product, keep the first one
      if (!product.prices[retailer]) {
        product.prices[retailer] = {
          price: p.price,
          currency: p.currency || 'AED',
          available: true,
        };
      }
    }
  }

  // Sort: products with more retailer matches first
  const sortedProducts = Array.from(productMap.values()).sort(
    (a, b) => Object.keys(b.prices).length - Object.keys(a.prices).length
  );

  return {
    products: sortedProducts,
    scrapedAt: new Date().toISOString(),
    retailerStatuses,
  };
}

function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/baby\s*brezza\s*/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
