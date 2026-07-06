import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ScrollFillText } from "./scroll-fill-text";

import { STATEMENT } from "../content";

/**
 * The editorial "statement" beat right after the hero — findrealestate.com's
 * signature scroll-fill moment. A short accent rule frames it, a confident
 * headline anchors it, and the supporting sentence fills in word-by-word as it
 * scrolls through. Client-facing copy, light Gallery-Minimal skin.
 */
export function StatementSection() {
  return (
    <section className="scroll-mt-20 py-32 sm:py-44">
      <div className="mx-auto w-full max-w-4xl px-6 text-center">
        <span aria-hidden="true" className="bg-primary/40 mx-auto block h-px w-12" />
        <p className="text-primary mt-7 text-sm font-semibold tracking-[0.25em] uppercase">
          {STATEMENT.eyebrow}
        </p>
        <h2 className="mt-6 text-[clamp(2.5rem,6.5vw,5rem)] leading-[1.0] font-semibold tracking-tight text-balance">
          {STATEMENT.leadIn}{" "}
          <span className="text-primary italic">{STATEMENT.emphasis}</span>
        </h2>
        <ScrollFillText
          as="p"
          text={STATEMENT.body}
          className="mx-auto mt-10 max-w-2xl text-[clamp(1.125rem,2.2vw,1.5rem)] leading-relaxed text-pretty"
        />
        <Link
          href="#listings"
          className="text-foreground hover:text-primary mt-10 inline-flex items-center gap-2 text-sm font-semibold tracking-wide transition-colors"
        >
          <span className="border-foreground/30 border-b pb-0.5">Explore our listings</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
