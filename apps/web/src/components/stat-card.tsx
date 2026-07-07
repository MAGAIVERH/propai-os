import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Accent = "primary" | "emerald" | "amber" | "sky" | "violet";

const ACCENT_TILE: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
  sky: "bg-sky-500/10 text-sky-600",
  violet: "bg-violet-500/10 text-violet-600",
};

export type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: Accent;
  /** A small change chip, e.g. { value: "+12 new", positive: true }. */
  delta?: { value: string; positive?: boolean };
  /** A muted line under the value when there's no delta. */
  hint?: string;
  loading?: boolean;
  /** Makes the whole card a link and adds a hover lift. */
  href?: string;
};

/**
 * A premium KPI tile: tinted icon, uppercase label, large tabular value, and an
 * optional trend chip or hint. Used across the dashboard for headline metrics.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  delta,
  hint,
  loading,
  href,
}: StatCardProps) {
  const card = (
    <Card
      data-kpi
      className={cn(
        "gap-0 py-0 transition-all duration-300",
        href && "hover:ring-foreground/20 hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2.5 h-8 w-24" />
          ) : (
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
          {!loading && delta ? (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                delta.positive
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {delta.positive ? (
                <ArrowUpRight className="size-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="size-3" aria-hidden="true" />
              )}
              {delta.value}
            </span>
          ) : !loading && hint ? (
            <p className="text-muted-foreground mt-2 text-xs">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
            ACCENT_TILE[accent],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
