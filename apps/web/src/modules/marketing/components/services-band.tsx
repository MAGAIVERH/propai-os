"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { BROKERAGE_SERVICES } from "../content";

/**
 * Brokerage services as an interactive rail. Cards scroll horizontally (snap +
 * arrow controls); on hover the whole rail dims and the focused card lifts and
 * scales forward, taking the spotlight. Symmetric, light Gallery-Minimal skin.
 * Fully usable without JS — it's a plain horizontal scroller underneath.
 */
export function ServicesBand() {
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges]);

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    // Advance by roughly one card width.
    const amount = Math.min(el.clientWidth * 0.8, 380);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section id="services" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
              Services
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              However you move, we move with you
            </h2>
          </div>

          {/* Rail controls (hidden until they can do something). */}
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label="Previous services"
              className="border-border text-foreground hover:bg-muted inline-flex size-11 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label="Next services"
              className="border-border text-foreground hover:bg-muted inline-flex size-11 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* The rail — full-bleed so cards can scroll past the container edge. The
          left padding aligns the first card with the section heading above, and
          scroll-padding makes cards snap to that same line; a small right padding
          lets the last card fill to the edge with no leftover gap. */}
      <ul
        ref={railRef}
        style={
          { "--gutter": "calc(max(0px, (100vw - 72rem) / 2) + 1.5rem)" } as React.CSSProperties
        }
        className="group/rail mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pt-2 pr-6 pb-6 pl-[var(--gutter)] scroll-pl-[var(--gutter)] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {BROKERAGE_SERVICES.map((service) => (
          <li
            key={service.label}
            className="w-[80%] shrink-0 snap-start sm:w-[360px]"
          >
            <Link
              href={service.href}
              className={cn(
                "group border-border bg-card relative flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-500 ease-out",
                "group-hover/rail:opacity-55 hover:z-10 hover:!opacity-100 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-2xl",
              )}
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.src}
                  alt={service.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
                <span className="bg-background/95 text-foreground absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase shadow-sm">
                  {service.label}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="flex items-start justify-between gap-3 text-xl font-semibold tracking-tight">
                  {service.title}
                  <ArrowUpRight
                    className="text-muted-foreground size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </h3>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
