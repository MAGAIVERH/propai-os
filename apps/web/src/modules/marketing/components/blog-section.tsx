import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { BLOG } from "../content";

/**
 * Insights — a symmetric three-card grid. Illustrative content for this demo.
 */
export function BlogSection() {
  return (
    <section className="py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p data-animate className="text-primary text-sm font-semibold tracking-wide">
            Insights
          </p>
          <h2
            data-animate
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Guidance for a smarter market
          </h2>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {BLOG.map((post) => (
            <li key={post.title} data-animate>
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
                  <time
                    dateTime={post.date}
                    className="text-muted-foreground text-xs tracking-wide uppercase"
                  >
                    {post.readableDate}
                  </time>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-balance">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                  <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium">
                    Read more
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <Link
            href="/insights"
            className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          >
            Read all insights
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
