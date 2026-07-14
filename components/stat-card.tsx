import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cn("py-0", className)}>
      <CardContent className="p-4">
        <div className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          {label}
        </div>
        <div className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</div>
        {children}
        {sub && <div className="text-muted-foreground mt-1.5 text-xs">{sub}</div>}
      </CardContent>
    </Card>
  );
}
