"use client";

import { useGSAP } from "@gsap/react";
import type { AnalyticsRange } from "@propai/shared";
import gsap from "gsap";
import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { toast } from "sonner";

import {
  useAnalyticsAgents,
  useAnalyticsFunnel,
  useAnalyticsOverview,
  useAnalyticsViews,
} from "../hooks/use-analytics";
import { downloadCsv } from "../queries/get-analytics";
import { AgentLeaderboard } from "./agent-leaderboard";
import { FunnelChart } from "./funnel-chart";
import { ViewsChart } from "./views-chart";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function KpiCard({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: string;
  hint?: string;
  loading: boolean;
}) {
  return (
    <Card data-kpi className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        )}
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [exporting, setExporting] = useState<"leads" | "properties" | null>(null);
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const overview = useAnalyticsOverview(range);
  const funnel = useAnalyticsFunnel(range);
  const agents = useAnalyticsAgents(range);
  const views = useAnalyticsViews(range);

  // Smooth scroll on the long analytics page (Lenis).
  useEffect(() => {
    if (reduced) return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let active = true;

    void import("lenis").then(({ default: Lenis }) => {
      if (!active) return;
      lenis = new Lenis({ duration: 0.9 });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, [reduced]);

  // Animate KPI cards in on mount.
  useGSAP(
    () => {
      if (reduced) return;
      gsap.from("[data-kpi]", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        // Strip inline opacity/transform on finish so no KPI card is left stuck
        // mid-animation (faded / offset) after a re-render.
        clearProps: "opacity,transform",
      });
    },
    { scope: rootRef },
  );

  async function handleExport(resource: "leads" | "properties") {
    setExporting(resource);
    try {
      await downloadCsv(resource);
      toast.success(`Exported ${resource} to CSV`);
    } catch {
      toast.error(`Failed to export ${resource}`);
    } finally {
      setExporting(null);
    }
  }

  const o = overview.data;

  return (
    <div ref={rootRef} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
          <Button
            variant="outline"
            size="sm"
            disabled={exporting !== null}
            onClick={() => handleExport("leads")}
          >
            <Download className="size-4" />
            {exporting === "leads" ? "Exporting…" : "Leads CSV"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting !== null}
            onClick={() => handleExport("properties")}
          >
            <Download className="size-4" />
            {exporting === "properties" ? "Exporting…" : "Properties CSV"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total leads"
          value={o ? String(o.totalLeads) : "0"}
          hint={o ? `${o.newLeads} new this period` : undefined}
          loading={overview.isPending}
        />
        <KpiCard
          label="Conversion rate"
          value={o ? formatPercent(o.conversionRate) : "0%"}
          hint="Leads won / total"
          loading={overview.isPending}
        />
        <KpiCard
          label="Active listings"
          value={o ? String(o.activeListings) : "0"}
          loading={overview.isPending}
        />
        <KpiCard
          label="Visits this week"
          value={o ? String(o.visitsThisWeek) : "0"}
          loading={overview.isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnel.isPending ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <FunnelChart stages={funnel.data?.stages ?? []} animate={!reduced} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Property views{" "}
              <span className="text-muted-foreground text-sm font-normal">
                ({o?.propertyViews ?? 0} total)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {views.isPending ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <ViewsChart points={views.data?.points ?? []} animate={!reduced} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {agents.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <AgentLeaderboard agents={agents.data?.agents ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
