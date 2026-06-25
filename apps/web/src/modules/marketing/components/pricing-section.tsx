import { Check } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { PRICING } from "../content";

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 data-animate className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p data-animate className="text-muted-foreground mt-4 text-lg">
            Start free. Upgrade to Pro when your team is ready to scale.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              data-animate
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                plan.highlighted
                  ? "border-primary bg-card shadow-lg"
                  : "border-border/60 bg-card/40",
              )}
            >
              {plan.highlighted ? (
                <span className="bg-primary text-primary-foreground absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-medium">
                  Most popular
                </span>
              ) : null}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/ {plan.cadence}</span>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="text-primary mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.cta.href}
                className={cn(
                  buttonVariants({
                    variant: plan.highlighted ? "default" : "outline",
                    size: "lg",
                  }),
                  "mt-8 w-full",
                )}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
