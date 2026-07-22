import { Building2, CircleDollarSign, Clock, Home } from "lucide-react";

import type { PropertyMetrics } from "@/modules/properties/lib/property-metrics";

type PropertiesMetricsProps = {
  metrics: PropertyMetrics;
};

type MetricCardProps = {
  label: string;
  value: number;
  icon: typeof Home;
};

function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value.toLocaleString("en-US")}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}

export function PropertiesMetrics({ metrics }: PropertiesMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <MetricCard label="Total" value={metrics.total} icon={Building2} />
      <MetricCard label="Active" value={metrics.active} icon={Home} />
      <MetricCard label="Pending" value={metrics.pending} icon={Clock} />
      <MetricCard label="Sold" value={metrics.sold} icon={CircleDollarSign} />
    </div>
  );
}
