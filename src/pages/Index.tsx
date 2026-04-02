import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceTable } from "@/components/PriceTable";
import { PriceChart } from "@/components/PriceChart";
import { RetailerStatus } from "@/components/RetailerStatus";
import { fetchPrices, type PriceData } from "@/lib/api";
import { Loader2, RefreshCw, BarChart3, Table2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPrices();
      setData(result);
      toast({
        title: "Scan Complete",
        description: `Found ${result.products.length} products across ${result.retailerStatuses.filter(r => r.success).length} retailers.`,
      });
    } catch (e: any) {
      setError(e.message);
      toast({
        title: "Scan Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Baby Brezza Price Monitor</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Compare prices across Middle East retailers
              </p>
            </div>
            <div className="flex items-center gap-3">
              {data?.scrapedAt && (
                <span className="text-xs text-muted-foreground">
                  Last scan: {new Date(data.scrapedAt).toLocaleString()}
                </span>
              )}
              <Button onClick={handleScan} disabled={loading} size="default">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Scan Prices
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Retailer Status */}
        {data?.retailerStatuses && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Retailer Status</CardTitle>
            </CardHeader>
            <CardContent>
              <RetailerStatus statuses={data.retailerStatuses} />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium text-foreground">Scanning retailers...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This may take 1-2 minutes as we scrape multiple sites and analyze with AI.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!loading && data?.products && (
          <Tabs defaultValue="table">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="chart" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Chart
                </TabsTrigger>
              </TabsList>
              <span className="text-sm text-muted-foreground">
                {data.products.length} product{data.products.length !== 1 ? "s" : ""} found
              </span>
            </div>

            <TabsContent value="table">
              <Card>
                <CardContent className="p-0">
                  <PriceTable products={data.products} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Price Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <PriceChart products={data.products} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty state */}
        {!loading && !data && !error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center">
                <p className="font-medium text-foreground">No data yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Scan Prices" to scrape Baby Brezza prices from retailers across the Middle East.
                </p>
              </div>
              <Button onClick={handleScan} size="lg" className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Scanning
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-price-down" />
            Lower than BabyBreza.me
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-price-up" />
            Higher than BabyBreza.me
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-price-same" />
            Same price
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
