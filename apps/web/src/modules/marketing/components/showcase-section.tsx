import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ScrollFillText } from "./scroll-fill-text";

import { SHOWCASE } from "../content";

/**
 * Product showcase in findrealestate.com's "steps" rhythm: a sticky title on the
 * left while the steps scroll past on the right, each description filling in
 * word-by-word (the FIND signature). Pure CSS sticky — no GSAP pin — so it never
 * competes with the pinned hero. Degrades cleanly with no JS / reduced motion
 * (ScrollFillText renders fully legible, sticky simply releases).
 */
export function ShowcaseSection() {
  return (
    <section id="platform" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:gap-16">
        {/* Sticky left — the anchor headline. Centered on mobile so it reads as
            a proper section intro; left-aligned and sticky from lg up. */}
        <div className="text-center lg:sticky lg:top-28 lg:self-start lg:text-left">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            How it works
          </p>
          <h2 className="mt-5 text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] font-semibold tracking-tight text-balance">
            Your move, guided from first look to closing day
          </h2>
          <p className="text-muted-foreground mx-auto mt-6 max-w-md text-lg leading-relaxed text-pretty lg:mx-0">
            Whether you&rsquo;re buying or selling, the journey is the same: clear,
            guided, and built entirely around you.
          </p>
          <Link
            href="/contact"
            className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-full")}
          >
            Book a consultation
          </Link>
        </div>

        {/* Right — the steps, each filling in on scroll. */}
        <ol className="space-y-20 lg:space-y-28">
          {SHOWCASE.map((step, i) => (
            <li key={step.title} className="group">
              <div className="flex items-baseline gap-4">
                <span className="text-muted-foreground/50 text-sm font-semibold tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-primary text-sm font-semibold tracking-wide">
                  {step.eyebrow}
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {step.title}
              </h3>
              <ScrollFillText
                as="p"
                text={step.description}
                className="mt-4 max-w-lg text-lg leading-relaxed text-pretty"
              />
              <div className="mt-7 aspect-[16/10] overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.src}
                  alt={step.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
