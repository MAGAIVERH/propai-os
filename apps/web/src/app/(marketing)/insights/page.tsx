import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { SubpageHero } from "@/modules/marketing/components/subpage-hero";
import { BLOG } from "@/modules/marketing/content";

export const metadata: Metadata = {
  title: "Insights — PropAI",
  description:
    "Notes on AI, listings, and running a modern real estate brokerage — research and product thinking from the PropAI team.",
};

export default function InsightsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Insights"
        title="Guidance for a smarter market"
        description="Research and product thinking on AI, listings, and running a modern brokerage."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <ul className="grid gap-6 md:grid-cols-3">
            {BLOG.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/insights/${post.slug}`}
                  className="group border-border bg-card block h-full overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.src}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wide uppercase">
                      <span className="text-primary font-semibold">{post.category}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={post.date}>{post.readableDate}</time>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold tracking-tight text-balance">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                    <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
                      Read more
                      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
