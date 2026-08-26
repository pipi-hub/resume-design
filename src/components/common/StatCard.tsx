import { Card, CardContent } from "@/components/ui/card";
import { InfoHint } from "./InfoHint";

export function StatCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {hint ? <InfoHint text={hint} /> : null}
        </div>
        <p className="mt-2 font-display text-3xl font-bold">{value}</p>
        {trend ? <p className="mt-1 text-xs text-success">{trend}</p> : null}
      </CardContent>
    </Card>
  );
}
