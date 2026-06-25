import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
  retrying?: boolean;
};

/**
 * Inline error state for data-fetching panels (e.g. the API is unreachable).
 * Shows a friendly message and an optional retry action.
 */
export function ErrorState({
  title = "Couldn't load this data",
  description,
  onRetry,
  retrying,
}: ErrorStateProps) {
  return (
    <section className="border-destructive/30 bg-card flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
      <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-xl">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-foreground mt-4 text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">{description}</p>
      {onRetry ? (
        <Button className="mt-6" variant="outline" onClick={onRetry} disabled={retrying}>
          {retrying ? "Retrying…" : "Try again"}
        </Button>
      ) : null}
    </section>
  );
}
