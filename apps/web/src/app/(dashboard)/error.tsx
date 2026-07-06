"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Error boundary for the authenticated dashboard. Catches render errors in any
 * dashboard segment and offers a retry without a full page reload.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-xl">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
        We couldn&apos;t load this section. This is usually temporary — please try
        again. If the problem persists, contact support.
      </p>
      <Button className="mt-6" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </div>
  );
}
