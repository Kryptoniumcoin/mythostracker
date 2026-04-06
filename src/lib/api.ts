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

const RETAILERS = ['BabyBreza.me', 'Amazon AE', 'Mumzworld', 'Noon', 'Centerpoint', 'Babyshop'];

export async function fetchPrices(
  onProgress?: (msg: string) => void
): Promise<PriceData> {
  const log = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  // Step 1: Scrape all individual product pages
  log("Scraping individual product pages...");
  const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke('scrape-prices', {
    body: {},
  });

  if (scrapeError) throw new Error(scrapeError.message);
  if (!scrapeResult?.success) throw new Error(scrapeResult?.error || 'Scraping failed');

  const retailerStatuses = scrapeResult.retailerStatuses;
  const catalog: { name: string; key: string }[] = scrapeResult.catalog;
  const retailerContent: Record<string, { productKey: string; content: string }[]> = scrapeResult.retailerContent;

  const successCount = retailerStatuses.filter((r: any) => r.success).length;
  log(`Scraped ${successCount} retailers. Extracting prices with AI...`);

  // Step 2: Parse each product page with AI to extract price
  const productMap = new Map<string, Product>();
  for (const item of catalog) {
    productMap.set(item.key, {
      name: item.name,
      prices: {},
    });
  }

  // Build all parse jobs
  const parseJobs: { productKey: string; retailer: string; content: string }[] = [];
  for (const [retailer, items] of Object.entries(retailerContent)) {
    for (const item of items) {
      parseJobs.push({ productKey: item.productKey, retailer, content: item.content });
    }
  }

  log(`Parsing ${parseJobs.length} product pages with AI...`);

  // Process in batches of 2 with delays to avoid rate limits on free model
  const BATCH_SIZE = 2;
  let completed = 0;

  for (let i = 0; i < parseJobs.length; i += BATCH_SIZE) {
    const batch = parseJobs.slice(i, i + BATCH_SIZE);

    // Add delay between batches to respect rate limits
    if (i > 0) {
      await new Promise(r => setTimeout(r, 2000));
    }

    const results = await Promise.all(
      batch.map(async (job) => {
        try {
          const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-prices', {
            body: { productKey: job.productKey, retailerName: job.retailer, content: job.content },
          });

          if (parseError) {
            console.error(`Parse error for ${job.productKey}@${job.retailer}:`, parseError);
            return null;
          }

          if (parseResult?.success && parseResult?.data) {
            return {
              productKey: job.productKey,
              retailer: job.retailer,
              price: parseResult.data.price,
              currency: parseResult.data.currency || 'AED',
            };
          }
        } catch (e) {
          console.error(`Failed to parse ${job.productKey}@${job.retailer}:`, e);
        }
        return null;
      })
    );

    for (const result of results) {
      if (result && result.price > 0) {
        const product = productMap.get(result.productKey);
        if (product) {
          product.prices[result.retailer] = {
            price: result.price,
            currency: result.currency,
            available: true,
          };
        }
      }
    }

    completed += batch.length;
    log(`Parsed ${completed}/${parseJobs.length} product pages...`);
  }

  // Sort: products with more retailer matches first
  const sortedProducts = Array.from(productMap.values())
    .filter(p => Object.keys(p.prices).length > 0)
    .sort((a, b) => Object.keys(b.prices).length - Object.keys(a.prices).length);

  log(`Done! Found prices for ${sortedProducts.length} products.`);

  return {
    products: sortedProducts,
    scrapedAt: new Date().toISOString(),
    retailerStatuses,
  };
}
