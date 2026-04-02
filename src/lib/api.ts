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

  // Step 2: Parse each retailer individually (to avoid edge function timeout)
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

  // Step 3: Merge products across retailers
  const productMap = new Map<string, Product>();

  for (const [retailer, products] of Object.entries(allRetailerProducts)) {
    for (const p of products) {
      const key = normalizeProductName(p.name);
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: p.name,
          prices: {},
        });
      }
      const product = productMap.get(key)!;
      product.prices[retailer] = {
        price: p.price,
        currency: p.currency || 'AED',
        available: true,
      };
    }
  }

  return {
    products: Array.from(productMap.values()),
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
