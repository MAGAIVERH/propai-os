"use client";

import { CalendarCheck, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ModuleHeader } from "@/components/module-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";
import { useVisitsQuery } from "@/modules/visits/hooks/use-visits";

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  return "Unable to load visits. Check that the API is running.";
}

function DateBadge({ iso }: { iso: string }) {
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  return (
    <div className="bg-primary/10 text-primary flex size-14 shrink-0 flex-col items-center justify-center rounded-xl">
      <span className="text-[10px] font-semibold tracking-wide uppercase">{month}</span>
      <span className="text-xl leading-none font-bold tabular-nums">{d.getDate()}</span>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function VisitsPageContent() {
  const { data, isPending, isError, error, refetch, isFetching } = useVisitsQuery();

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  const visits = data?.visits ?? [];

  return (
    <div className="space-y-6">
      <ModuleHeader
        label="CRM"
        title="Visits"
        description="Property showings scheduled with your buyers, newest first."
      />

      {!isPending && !isError ? (
        <p className="text-muted-foreground text-sm">
          {visits.length} {visits.length === 1 ? "showing" : "showings"} scheduled
        </p>
      ) : null}

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

      {!isPending && !isError && visits.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No visits scheduled"
          description="When you schedule a showing from a lead, it will appear here."
        />
      ) : null}

      {!isPending && !isError && visits.length > 0 ? (
        <ul className="space-y-3">
          {visits.map((visit) => (
            <li
              key={visit.id}
              className="border-border bg-card flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <DateBadge iso={visit.createdAt} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold">
                    {initials(visit.leadName)}
                  </span>
                  <Link
                    href={`/leads/${visit.leadId}`}
                    className="hover:text-primary truncate font-semibold"
                  >
                    {visit.leadName}
                  </Link>
                </div>
                <p className="text-muted-foreground mt-1.5 text-sm">{visit.content}</p>
                {visit.propertyId && visit.propertyTitle ? (
                  <Link
                    href={`/properties/${visit.propertyId}`}
                    className="text-muted-foreground hover:text-foreground mt-1.5 inline-flex items-center gap-1 text-xs"
                  >
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {visit.propertyTitle}
                  </Link>
                ) : null}
              </div>

              <Link
                href={`/leads/${visit.leadId}`}
                aria-label="Open lead"
                className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
