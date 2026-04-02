import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/api";

const RETAILERS = ["BabyBreza.me", "Amazon AE", "Mumzworld", "Noon", "Centerpoint", "Babyshop"];

function getPriceColor(price: number | null, referencePrice: number | null) {
  if (!price || !referencePrice) return "";
  if (price < referencePrice) return "text-price-down font-semibold";
  if (price > referencePrice) return "text-price-up font-semibold";
  return "text-price-same";
}

export function PriceTable({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products found. Click "Scan Prices" to start.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold min-w-[200px]">Product</TableHead>
            {RETAILERS.map((r) => (
              <TableHead key={r} className="text-center font-semibold min-w-[120px]">
                {r}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, idx) => {
            const refPrice = product.prices["BabyBreza.me"]?.price;
            return (
              <TableRow key={idx} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium text-sm">{product.name}</TableCell>
                {RETAILERS.map((retailer) => {
                  const p = product.prices[retailer];
                  if (!p || !p.available || p.price === null) {
                    return (
                      <TableCell key={retailer} className="text-center">
                        <Badge variant="outline" className="text-muted-foreground text-xs">N/A</Badge>
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={retailer} className={`text-center ${getPriceColor(p.price, refPrice)}`}>
                      {p.currency} {p.price.toFixed(2)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
