"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowUpRight, Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { buttonVariants } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

import { LISTINGS } from "../content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Featured property grid — the core of an agency landing. Borrows the reference
 * sites' motion: cards reveal in a stagger as the grid enters view, each photo
 * parallaxes within its frame on scroll, and lifts with a soft shadow on hover.
 * The price rides on the image as a glass chip for a premium, editorial feel.
 * Static and fully legible under reduced motion.
 */
export function FeaturedListings() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;

      // Staggered reveal of the cards (findrealestate.com rhythm).
      gsap.from("[data-listing]", {
        y: 48,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: "[data-listing-grid]", start: "top 78%" },
      });

      // Parallax each photo within its frame (elyse-residence effect).
      gsap.utils.toArray<HTMLElement>("[data-listing-img]").forEach((img) => {
        gsap.fromTo(
          img,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <section ref={ref} id="listings" className="scroll-mt-20 py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p data-animate className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
              Featured homes
            </p>
            <h2 data-animate className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              A curated selection of exceptional properties
            </h2>
          </div>
          <Link
            href="/listings"
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0 rounded-full")}
          >
            View all listings
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <ul data-listing-grid className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {LISTINGS.map((listing) => (
            <li key={listing.title} data-listing>
              <Link
                href={`/listings/${listing.slug}`}
                className="group border-border bg-card block overflow-hidden rounded-2xl border shadow-sm transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div data-listing-img className="absolute inset-x-0 -inset-y-[8%]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={listing.src}
                      alt={`${listing.title} in ${listing.location}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Bottom wash so the price chip stays legible. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent"
                  />

                  {listing.status ? (
                    <span className="bg-background/95 text-foreground absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-sm">
                      {listing.status}
                    </span>
                  ) : null}

                  <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-1.5 text-base font-semibold text-neutral-950 tabular-nums shadow-md backdrop-blur-sm">
                    {listing.price}
                  </span>
                </div>

                <div className="p-6">
                  <h3 className="flex items-start justify-between gap-3 text-lg font-semibold tracking-tight">
                    {listing.title}
                    <ArrowUpRight
                      className="text-muted-foreground mt-0.5 size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-sm">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {listing.location}
                  </p>
                  <dl className="text-muted-foreground border-border mt-5 flex items-center gap-5 border-t pt-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <BedDouble className="size-4" aria-hidden="true" />
                      <dd>{listing.beds} bd</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bath className="size-4" aria-hidden="true" />
                      <dd>{listing.baths} ba</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize className="size-4" aria-hidden="true" />
                      <dd>{listing.sqft}</dd>
                    </div>
                  </dl>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
