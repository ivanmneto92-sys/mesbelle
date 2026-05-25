import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  eyebrow: string;
  value: string;
  hint?: string;
  trend?: { value: string; up: boolean };
  icon?: LucideIcon;
  sparkline?: number[];
  accent?: "primary" | "success" | "warning" | "info";
}

const accentMap = {
  primary: { text: "text-primary", bg: "bg-primary/10", stroke: "hsl(var(--primary))" },
  success: { text: "text-success", bg: "bg-success/10", stroke: "hsl(var(--success))" },
  warning: { text: "text-warning", bg: "bg-warning/10", stroke: "hsl(var(--warning))" },
  info: { text: "text-info", bg: "bg-info/10", stroke: "hsl(var(--info))" },
} as const;

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 30 - ((v - min) / range) * 26 - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <polygon points={`0,30 ${points} 100,30`} fill={`url(#sg-${color})`} />
    </svg>
  );
}

export function KpiCard({ eyebrow, value, hint, trend, icon: Icon, sparkline, accent = "primary" }: KpiCardProps) {
  const a = accentMap[accent];
  return (
    <Card className="card-editorial p-5 overflow-hidden group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow">{eyebrow}</p>
          <p className="font-display text-[34px] leading-none mt-2 tracking-tight">{value}</p>
          {(trend || hint) && (
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              {trend && (
                <span className={`inline-flex items-center gap-1 font-medium ${trend.up ? "text-success" : "text-destructive"}`}>
                  {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend.value}
                </span>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${a.bg} ${a.text}`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      {sparkline && sparkline.length >= 2 && (
        <div className="mt-3 -mx-1">
          <Sparkline
            data={sparkline}
            color={trend ? (trend.up ? "hsl(var(--success))" : "hsl(var(--destructive))") : a.stroke}
          />
        </div>
      )}
    </Card>
  );
}
