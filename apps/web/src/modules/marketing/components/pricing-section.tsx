import { Check } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PRICING } from "../content";

/**
 * Pricing — a light starter plan beside an elevated, navy-filled Pro plan, the
 * premium SaaS pattern. Symmetric, calm, with a reassurance footnote.
 */
export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p data-animate className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            Pricing
          </p>
          <h2 data-animate className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p data-animate className="text-muted-foreground mt-4 text-lg">
            Start free. Upgrade to Pro when your team is ready to scale.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
          {PRICING.map((plan) => {
            const pro = plan.highlighted;
            return (
              <div
                key={plan.name}
                data-animate
                className={cn(
                  "relative flex flex-col rounded-3xl p-8 sm:p-10",
                  pro
                    ? "bg-primary text-primary-foreground shadow-xl"
                    : "border-border bg-card border",
                )}
              >
                {pro ? (
                  <span className="absolute -top-3 right-8 rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-950 shadow-sm">
                    Most popular
                  </span>
                ) : null}

                <h3 className={cn("text-base font-semibold", pro ? "text-white/80" : "text-muted-foreground")}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tracking-tight tabular-nums">
                    {plan.price}
                  </span>
                  <span className={cn("text-sm", pro ? "text-white/70" : "text-muted-foreground")}>
                    / {plan.cadence}
                  </span>
                </div>
                <p className={cn("mt-3 text-sm", pro ? "text-white/75" : "text-muted-foreground")}>
                  {plan.description}
                </p>

                <ul className="mt-8 flex-1 space-y-3.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={cn("mt-0.5 size-4 shrink-0", pro ? "text-white" : "text-primary")}
                        aria-hidden="true"
                      />
                      <span className={pro ? "text-white/90" : undefined}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.cta.href}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "mt-10 w-full rounded-full",
                    pro
                      ? "bg-white text-neutral-950 hover:bg-white/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {plan.cta.label}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground mt-8 text-center text-sm">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
