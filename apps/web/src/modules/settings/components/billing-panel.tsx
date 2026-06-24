"use client";

import { PLAN_LIMITS, PRO_PRICE_USD_PER_MONTH } from "@propai/shared";
import { Check, ExternalLink, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";

import { openPortal, startCheckout } from "../queries/settings-api";
import { useBilling } from "../hooks/use-settings";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, (used / limit) * 100);
  const over = limit !== null && used >= limit;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "font-medium text-red-500" : "font-medium"}>
          {used}
          {limit === null ? " / ∞" : ` / ${limit}`}
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${over ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${limit === null ? 8 : pct}%` }}
        />
      </div>
    </div>
  );
}

export function BillingPanel() {
  const billing = useBilling();
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

  async function upgrade() {
    setBusy("checkout");
    try {
      const url = await startCheckout();
      window.location.href = url;
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Could not start checkout.";
      toast.error(message);
      setBusy(null);
    }
  }

  async function manage() {
    setBusy("portal");
    try {
      const url = await openPortal();
      window.location.href = url;
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Could not open the billing portal.";
      toast.error(message);
      setBusy(null);
    }
  }

  if (billing.isPending) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (billing.isError || !billing.data) {
    return <p className="text-sm text-red-500">Could not load billing information.</p>;
  }

  const b = billing.data;
  const isPro = b.plan === "pro";

  return (
    <div className="space-y-6">
      {(b.overListingLimit || b.overAgentLimit) && !isPro && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-500">You&apos;ve reached your Free plan limit.</p>
          <p className="text-muted-foreground mt-1">
            Upgrade to Pro to add unlimited listings and team members.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Current plan
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isPro ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </CardTitle>
          {b.subscriptionStatus !== "inactive" && (
            <span className="text-muted-foreground text-xs">{b.subscriptionStatus}</span>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <UsageBar
            label="Active listings"
            used={b.usage.activeListings}
            limit={b.limits.activeListings}
          />
          <UsageBar label="Team members" used={b.usage.agents} limit={b.limits.agents} />

          <div className="flex flex-wrap gap-3 pt-2">
            {!isPro && (
              <Button onClick={upgrade} disabled={busy !== null || !b.billingEnabled}>
                <Zap className="size-4" />
                {busy === "checkout" ? "Redirecting…" : "Upgrade to Pro"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={manage}
              disabled={busy !== null || !b.billingEnabled}
            >
              <ExternalLink className="size-4" />
              {busy === "portal" ? "Opening…" : "Manage billing"}
            </Button>
          </div>
          {!b.billingEnabled && (
            <p className="text-muted-foreground text-xs">
              Billing is not configured in this environment (set Stripe keys to enable checkout).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pro — ${PRO_PRICE_USD_PER_MONTH}/mo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {[
              "Unlimited active listings",
              "Unlimited team members",
              "Priority support",
              `Everything in Free (up to ${PLAN_LIMITS.free.activeListings} listings, ${PLAN_LIMITS.free.agents} agents)`,
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="text-primary size-4" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
