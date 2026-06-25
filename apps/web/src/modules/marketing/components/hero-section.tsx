import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HERO } from "../content";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative gradient backdrop */}
      <div
        aria-hidden="true"
        data-hero-glow
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 mx-auto h-[480px] max-w-4xl rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)] blur-2xl"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <span
            data-animate
            className="border-border/60 bg-muted/40 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {HERO.eyebrow}
          </span>

          <h1
            data-animate
            className="font-heading mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl"
          >
            {HERO.title}
          </h1>

          <p data-animate className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg text-pretty">
            {HERO.subtitle}
          </p>

          <div data-animate className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href={HERO.primaryCta.href} />}>
              {HERO.primaryCta.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Link
              href={HERO.secondaryCta.href}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {HERO.secondaryCta.label}
            </Link>
          </div>
        </div>

        <dl
          data-animate
          className="border-border/60 bg-card/40 mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-3"
        >
          {HERO.stats.map((stat) => (
            <div key={stat.label} className="bg-card/60 px-6 py-5 text-center">
              <dt className="text-2xl font-bold tracking-tight">{stat.value}</dt>
              <dd className="text-muted-foreground mt-1 text-sm">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
