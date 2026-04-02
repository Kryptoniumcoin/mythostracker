import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Product } from "@/lib/api";

const RETAILER_COLORS: Record<string, string> = {
  "BabyBreza.me": "#0077CC",
  "Amazon AE": "#FF9900",
  "Mumzworld": "#E91E8C",
  "Noon": "#FFD700",
  "Centerpoint": "#4CAF50",
  "Babyshop": "#9C27B0",
};

const RETAILERS = Object.keys(RETAILER_COLORS);

export function PriceChart({ products }: { products: Product[] }) {
  if (!products.length) return null;

  // Show top 8 products max for chart readability
  const chartData = products.slice(0, 8).map((product) => {
    const entry: Record<string, any> = {
      name: product.name.length > 30 ? product.name.slice(0, 30) + "…" : product.name,
    };
    RETAILERS.forEach((r) => {
      const p = product.prices[r];
      entry[r] = p?.available && p?.price ? p.price : null;
    });
    return entry;
  });

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            angle={-35} 
            textAnchor="end" 
            height={100}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            label={{ value: "Price (AED)", angle: -90, position: "insideLeft", style: { fill: "hsl(var(--muted-foreground))" } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--card-foreground))"
            }} 
          />
          <Legend wrapperStyle={{ paddingTop: "10px" }} />
          {RETAILERS.map((r) => (
            <Bar key={r} dataKey={r} fill={RETAILER_COLORS[r]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
