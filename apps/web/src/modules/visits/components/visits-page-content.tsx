"use client";

import type { VisitListItem } from "@propai/shared";
import { CalendarCheck, Clock, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useVisitsQuery } from "@/modules/visits/hooks/use-visits";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  return "Unable to load visits. Check that the API is running.";
}

function fmtTime(iso: string, tz: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    });
  } catch {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
}

function relative(iso: string): string {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

function DateBadge({ iso, muted }: { iso: string; muted?: boolean }) {
  const d = new Date(iso);
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl",
        muted ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
      )}
    >
      <span className="text-[10px] font-semibold tracking-wide uppercase">
        {d.toLocaleDateString("en-US", { month: "short" })}
      </span>
      <span className="text-xl leading-none font-bold tabular-nums">{d.getDate()}</span>
    </div>
  );
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}

function VisitRow({ visit, past }: { visit: VisitListItem; past?: boolean }) {
  return (
    <li className="border-border bg-card flex items-center gap-3 rounded-2xl border p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-4">
      <DateBadge iso={visit.scheduledAt} muted={past} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-primary/10 text-primary inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold">
            {initials(visit.leadName)}
          </span>
          <Link href={`/leads/${visit.leadId}`} className="hover:text-primary truncate font-semibold">
            {visit.leadName}
          </Link>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Clock className="size-3.5" aria-hidden="true" />
            {fmtTime(visit.scheduledAt, visit.timezone)} · {relative(visit.scheduledAt)}
          </span>
        </div>
        {visit.propertyId && visit.propertyTitle ? (
          <Link
            href={`/properties/${visit.propertyId}`}
            className="text-muted-foreground hover:text-foreground mt-1.5 inline-flex items-center gap-1 text-xs"
          >
            <MapPin className="size-3.5" aria-hidden="true" />
            {visit.propertyTitle}
          </Link>
        ) : null}
        {visit.notes ? <p className="text-muted-foreground mt-1.5 text-sm">{visit.notes}</p> : null}
      </div>
      <Link
        href={`/leads/${visit.leadId}`}
        aria-label="Open lead"
        className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function VisitsPageContent() {
  const { data, isPending, isError, error, refetch, isFetching } = useVisitsQuery();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  // Snapshot "now" once at mount so the upcoming/past split is stable per render.
  const [now] = useState(() => Date.now());
  const all = data?.visits ?? [];
  const upcoming = all
    .filter((v) => new Date(v.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = all
    .filter((v) => new Date(v.scheduledAt).getTime() < now)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visits"
        description="Property showings scheduled with your buyers."
      />

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Couldn't load visits"
          description={getErrorMessage(error)}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      ) : null}

      {!isPending && !isError && all.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No visits scheduled"
          description="When you schedule a showing from a lead, it will appear here."
        />
      ) : null}

      {!isPending && !isError && upcoming.length > 0 ? (
        <section>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Upcoming · {upcoming.length}
          </h2>
          <ul className="space-y-3">
            {upcoming.map((v) => (
              <VisitRow key={v.id} visit={v} />
            ))}
          </ul>
        </section>
      ) : null}

      {!isPending && !isError && past.length > 0 ? (
        <section>
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Past · {past.length}
          </h2>
          <ul className="space-y-3">
            {past.map((v) => (
              <VisitRow key={v.id} visit={v} past />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
