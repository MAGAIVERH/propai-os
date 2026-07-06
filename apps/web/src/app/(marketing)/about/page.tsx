import type { Metadata } from "next";
import { ArrowRight, Compass, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SubpageHero } from "@/modules/marketing/components/subpage-hero";
import { STATS } from "@/modules/marketing/content";

export const metadata: Metadata = {
  title: "About — PropAI",
  description:
    "PropAI pairs expert agents with intelligent technology to make buying, selling, and running a brokerage feel clear and calm.",
};

const VALUES = [
  {
    icon: HeartHandshake,
    title: "People first",
    description:
      "Behind every move is a person and a decision that matters. Technology should make room for that, not replace it.",
  },
  {
    icon: Compass,
    title: "Clarity over clutter",
    description:
      "One calm place for listings, search, and clients. We remove steps instead of adding tools.",
  },
  {
    icon: Sparkles,
    title: "Useful intelligence",
    description:
      "AI earns its place only when it saves real time — drafting listings, ranking search, scoring leads.",
  },
  {
    icon: ShieldCheck,
    title: "Trust by design",
    description:
      "Every brokerage's data is isolated at the database layer. Privacy is a default, not a setting.",
  },
];

export default function AboutPage() {
  return (
    <>
      <SubpageHero
        eyebrow="About us"
        title="Real estate, reimagined around people"
        description="We pair expert agents with intelligent technology, so finding, buying, and selling a home feels clear, calm, and genuinely yours."
      />

      {/* Mission */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/listings/listing-02.jpg"
              alt="An aerial view of a residential neighborhood at dusk"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A brokerage and a platform, working as one
            </h2>
            <div className="text-muted-foreground mt-6 space-y-4 text-lg leading-relaxed">
              <p>
                PropAI began with a simple frustration: great agents were spending
                their days fighting five disconnected tools instead of helping
                clients. We set out to build the operating system we wished existed.
              </p>
              <p>
                Today that means a curated marketplace, AI-assisted listings,
                plain-English search, and a real-time CRM — all in one place, so
                every lead is live the moment it arrives and nothing falls through
                the cracks.
              </p>
            </div>
            <Link
              href="/contact"
              className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-full")}
            >
              Talk to our team
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-border bg-muted/40 border-y py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <dl className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  {stat.value}
                </dt>
                <dd className="text-muted-foreground mt-2 text-sm">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
              What we value
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              The principles behind the product
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="border-border bg-card rounded-2xl border p-6 shadow-sm"
              >
                <span className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-full">
                  <value.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {value.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fair-housing / disclosure note is already in the footer. */}
    </>
  );
}
