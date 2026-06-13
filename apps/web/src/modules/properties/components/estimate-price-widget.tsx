"use client";

import { useTransition } from "react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { estimatePropertyPrice } from "@/modules/properties/queries/estimate-property-price";
import type { EstimatePriceRequest, EstimatePriceResponse } from "@propai/shared";

type EstimatePriceWidgetProps = {
  params: Omit<EstimatePriceRequest, "excludePropertyId"> & {
    excludePropertyId?: string;
  };
  canEstimate: boolean;
  onApplyPrice: (usd: number) => void;
};

type WidgetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: EstimatePriceResponse }
  | { status: "error"; message: string };

function formatUsd(usd: number): string {
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function EstimatePriceWidget({
  params,
  canEstimate,
  onApplyPrice,
}: EstimatePriceWidgetProps) {
  const [state, setState] = useState<WidgetState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  function handleEstimate() {
    startTransition(async () => {
      setState({ status: "loading" });

      try {
        const result = await estimatePropertyPrice(params);
        setState({ status: "success", result });
      } catch {
        setState({
          status: "error",
          message: "Could not generate an estimate. Please try again.",
        });
      }
    });
  }

  const isLoading = state.status === "loading" || isPending;

  return (
    <div className="mt-4">
      <Card className="rounded-xl border-dashed border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-foreground">
            AI Price Estimator
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {state.status === "idle" && (
            <p className="text-sm text-muted-foreground">
              Fill in city, state, type, bedrooms, and square footage above to
              get an AI-powered price estimate based on comparable listings.
            </p>
          )}

          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          )}

          {!isLoading && state.status === "success" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Estimated range</p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {formatUsd(state.result.minUsd)} – {formatUsd(state.result.maxUsd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Midpoint: {formatUsd(state.result.midpointUsd)}
                  {state.result.comparablesCount > 0
                    ? ` · based on ${state.result.comparablesCount} comparable${state.result.comparablesCount !== 1 ? "s" : ""}`
                    : " · no comparables in portfolio"}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                {state.result.reasoning}
              </p>

              <Alert className="rounded-xl border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                  Estimate only — not an appraisal.
                </AlertDescription>
              </Alert>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => onApplyPrice(state.result.midpointUsd)}
              >
                Apply {formatUsd(state.result.midpointUsd)}
              </Button>
            </div>
          )}

          {!isLoading && state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          {!isLoading && (
            <Button
              type="button"
              variant={state.status === "success" ? "ghost" : "outline"}
              size="sm"
              className="rounded-xl"
              disabled={!canEstimate}
              onClick={handleEstimate}
            >
              {state.status === "success" ? "Re-estimate" : "Estimate price"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
