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

export async function fetchPrices(): Promise<PriceData> {
  // Step 1: Scrape all retailers
  const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke('scrape-prices', {
    body: {},
  });

  if (scrapeError) throw new Error(scrapeError.message);
  if (!scrapeResult?.success) throw new Error(scrapeResult?.error || 'Scraping failed');

  const retailerStatuses = scrapeResult.results.map((r: any) => ({
    name: r.retailer,
    success: r.success,
    error: r.error,
  }));

  // Step 2: Parse with AI
  const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-prices', {
    body: { scrapedData: scrapeResult.results },
  });

  if (parseError) throw new Error(parseError.message);
  if (!parseResult?.success) throw new Error(parseResult?.error || 'Parsing failed');

  return {
    products: parseResult.data.products || [],
    scrapedAt: new Date().toISOString(),
    retailerStatuses,
  };
}
