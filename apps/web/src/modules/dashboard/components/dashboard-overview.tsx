"use client";

import { useGSAP } from "@gsap/react";
import type { AnalyticsRange } from "@propai/shared";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarCheck,
  Clock,
  Eye,
  KanbanSquare,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { StatCard } from "@/components/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSessionQuery } from "@/hooks/use-session";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import {
  useAnalyticsFunnel,
  useAnalyticsOverview,
  useAnalyticsViews,
} from "@/modules/analytics/hooks/use-analytics";
import { FunnelChart } from "@/modules/analytics/components/funnel-chart";
import { ViewsChart } from "@/modules/analytics/components/views-chart";
import { getLeads } from "@/modules/crm/queries/get-leads";
import { OnboardingChecklist } from "@/modules/settings/components/onboarding-checklist";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
];

const RANGE_LABEL: Record<AnalyticsRange, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
};

const QUICK_ACTIONS = [
  { label: "Add property", href: "/properties/new", icon: Plus, accent: "primary" as const },
  { label: "Pipeline", href: "/leads", icon: KanbanSquare, accent: "emerald" as const },
  { label: "Listings", href: "/properties", icon: Building2, accent: "sky" as const },
  { label: "Analytics", href: "/analytics", icon: BarChart3, accent: "violet" as const },
];

const ACTION_TILE: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600",
  sky: "bg-sky-500/10 text-sky-600",
  violet: "bg-violet-500/10 text-violet-600",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function today(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function scoreTone(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 text-emerald-600";
  if (score >= 40) return "bg-amber-500/10 text-amber-600";
  return "bg-muted text-muted-foreground";
}

export function DashboardOverview() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const session = useSessionQuery();
  const overview = useAnalyticsOverview(range);
  const funnel = useAnalyticsFunnel(range);
  const views = useAnalyticsViews(range);
  const leadsQuery = useQuery({ queryKey: ["leads", "recent"], queryFn: getLeads });

  const o = overview.data;
  const firstName = session.data?.user?.name?.split(" ")[0] ?? "there";

  const recentLeads = [...(leadsQuery.data?.leads ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const percent = (n: number) => `${Math.round(n * 100)}%`;

  useGSAP(
    () => {
      if (reduced) return;
      gsap.from("[data-kpi]", {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.07,
        ease: "power2.out",
      });
      gsap.from("[data-panel]", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.15,
        ease: "power2.out",
      });
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return (
    <div ref={rootRef} className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">{today()}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting()}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r.value} value={r.value}>
                  {r.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Link
            href="/properties/new"
            className={cn(buttonVariants({ size: "sm" }), "rounded-lg")}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add property
          </Link>
        </div>
      </div>

      <OnboardingChecklist />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={o ? String(o.totalLeads) : "0"}
          icon={Users}
          accent="primary"
          loading={overview.isPending}
          delta={o ? { value: `${o.newLeads} new`, positive: o.newLeads > 0 } : undefined}
        />
        <StatCard
          label="Conversion rate"
          value={o ? percent(o.conversionRate) : "0%"}
          icon={TrendingUp}
          accent="emerald"
          loading={overview.isPending}
          hint="Leads won / total"
        />
        <StatCard
          label="Active listings"
          value={o ? String(o.activeListings) : "0"}
          icon={Building2}
          accent="sky"
          loading={overview.isPending}
          hint="Published now"
          href="/properties"
        />
        <StatCard
          label="Property views"
          value={o ? o.propertyViews.toLocaleString() : "0"}
          icon={Eye}
          accent="violet"
          loading={overview.isPending}
          hint={RANGE_LABEL[range]}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card data-panel>
          <CardHeader>
            <CardTitle>Pipeline funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {funnel.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <FunnelChart stages={funnel.data?.stages ?? []} animate={!reduced} />
            )}
          </CardContent>
        </Card>

        <Card data-panel>
          <CardHeader>
            <CardTitle>
              Property views{" "}
              <span className="text-muted-foreground text-sm font-normal">
                · {RANGE_LABEL[range]}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {views.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ViewsChart points={views.data?.points ?? []} animate={!reduced} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads + side panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card data-panel className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Recent leads</CardTitle>
              <Link
                href="/leads"
                className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                View pipeline
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {leadsQuery.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No leads yet. New marketplace and pipeline leads will appear here.
              </p>
            ) : (
              <ul className="divide-border/70 divide-y">
                {recentLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors"
                    >
                      <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {(lead.firstName[0] ?? "") + (lead.lastName[0] ?? "")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {lead.source ?? lead.email}
                        </p>
                      </div>
                      {lead.aiScore !== null ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                            scoreTone(lead.aiScore),
                          )}
                        >
                          {lead.aiScore}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground w-14 shrink-0 text-right text-xs">
                        {timeAgo(lead.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card data-panel>
            <CardHeader>
              <CardTitle>This period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MiniStat
                icon={CalendarCheck}
                label="Visits this week"
                value={o ? String(o.visitsThisWeek) : "—"}
                loading={overview.isPending}
              />
              <MiniStat
                icon={Clock}
                label="Avg. days to close"
                value={o?.avgDaysToClose != null ? String(o.avgDaysToClose) : "—"}
                loading={overview.isPending}
              />
            </CardContent>
          </Card>

          <Card data-panel>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="border-border/70 hover:border-border hover:bg-muted/40 flex flex-col gap-2 rounded-xl border p-3 transition-colors"
                >
                  <span
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-lg",
                      ACTION_TILE[action.accent],
                    )}
                  >
                    <action.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-muted text-muted-foreground inline-flex size-9 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        {loading ? (
          <Skeleton className="mt-1 h-5 w-10" />
        ) : (
          <p className="text-lg font-semibold tabular-nums">{value}</p>
        )}
      </div>
    </div>
  );
}
