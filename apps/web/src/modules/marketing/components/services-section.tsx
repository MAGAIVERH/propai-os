import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SERVICES } from "../content";
import { ScrollFillText } from "./scroll-fill-text";

/**
 * Dark services band with giant single-word labels and a scroll-filled closing
 * line — our take on findrealestate.com's Buy / Sell / Rent section.
 */
export function ServicesSection() {
  return (
    <section className="bg-neutral-950 py-24 text-neutral-100 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="text-sm font-medium tracking-wide text-neutral-400">
          {SERVICES.label}
        </p>

        <div className="mt-10">
          {SERVICES.pillars.map((pillar) => (
            <div
              key={pillar.number}
              className="grid items-center gap-6 border-t border-white/10 py-10 md:grid-cols-[auto_1fr_auto]"
            >
              <span className="flex size-9 items-center justify-center rounded-full border border-white/20 text-xs tabular-nums">
                {pillar.number}
              </span>
              <p className="max-w-md text-base leading-relaxed text-neutral-300">
                {pillar.description}
              </p>
              <span className="font-display text-6xl leading-none font-light tracking-tight sm:text-8xl">
                {pillar.word}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl">
          <ScrollFillText
            as="p"
            text={SERVICES.closing}
            className="text-2xl leading-snug font-medium tracking-tight text-balance text-white sm:text-3xl"
          />
          <Link
            href={SERVICES.cta.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "mt-8 rounded-full border-white/30 bg-transparent text-white hover:bg-white hover:text-neutral-950",
            )}
          >
            {SERVICES.cta.label}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
