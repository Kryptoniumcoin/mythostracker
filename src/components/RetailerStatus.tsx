import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface RetailerStatusProps {
  statuses: { name: string; success: boolean; error?: string }[];
}

export function RetailerStatus({ statuses }: RetailerStatusProps) {
  if (!statuses.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <Badge
          key={s.name}
          variant={s.success ? "default" : "destructive"}
          className="flex items-center gap-1 text-xs"
        >
          {s.success ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {s.name}
        </Badge>
      ))}
    </div>
  );
}
