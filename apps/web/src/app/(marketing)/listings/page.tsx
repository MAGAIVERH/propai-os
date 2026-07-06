import type { Metadata } from "next";
import { ArrowUpRight, Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import Link from "next/link";

import { SubpageHero } from "@/modules/marketing/components/subpage-hero";
import { LISTINGS } from "@/modules/marketing/content";

export const metadata: Metadata = {
  title: "Listings — PropAI",
  description:
    "Browse a curated collection of exceptional homes for sale and for rent across the country's most coveted markets.",
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ market?: string }>;
}) {
  const { market } = await searchParams;

  return (
    <>
      <SubpageHero
        eyebrow="Listings"
        title="A curated collection of exceptional homes"
        description={
          market
            ? `Showing our featured collection${market ? `, with picks near ${market}` : ""}. New homes are added as our agents bring them to market.`
            : "Every home here is hand-picked and represented by an agent who knows it well. Imagery is illustrative for this preview."
        }
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="text-muted-foreground text-sm">
            {LISTINGS.length} homes available
          </p>

          <ul className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {LISTINGS.map((listing) => (
              <li key={listing.slug}>
                <Link
                  href={`/listings/${listing.slug}`}
                  className="group border-border bg-card block overflow-hidden rounded-2xl border shadow-sm transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={listing.src}
                      alt={`${listing.title} in ${listing.location}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent"
                    />
                    <span className="absolute top-4 left-4 flex gap-2">
                      {listing.status ? (
                        <span className="bg-background/95 text-foreground rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-sm backdrop-blur-sm">
                          {listing.status}
                        </span>
                      ) : null}
                      {listing.kind === "For rent" ? (
                        <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-sm">
                          For rent
                        </span>
                      ) : null}
                    </span>
                    <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-4 py-1.5 text-base font-semibold text-neutral-950 tabular-nums shadow-md backdrop-blur-sm">
                      {listing.price}
                    </span>
                  </div>

                  <div className="p-6">
                    <h2 className="flex items-start justify-between gap-3 text-lg font-semibold tracking-tight">
                      {listing.title}
                      <ArrowUpRight
                        className="text-muted-foreground group-hover:text-foreground mt-0.5 size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </h2>
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
    </>
  );
}
