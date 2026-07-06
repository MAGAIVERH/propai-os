import type { Metadata } from "next";
import { ArrowLeft, Bath, BedDouble, Check, MapPin, Maximize } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RequestTourButton } from "@/modules/account/components/request-tour-button";
import { getListing, LISTINGS } from "@/modules/marketing/content";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return LISTINGS.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListing(slug);
  if (!listing) return { title: "Listing not found — PropAI" };
  return {
    title: `${listing.title} — ${listing.location} | PropAI`,
    description: listing.description,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const listing = getListing(slug);
  if (!listing) notFound();

  const gallery = [listing.src, ...(listing.gallery ?? [])];

  return (
    <div className="pt-24 pb-20 sm:pt-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Link
          href="/listings"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All listings
        </Link>

        {/* Gallery */}
        <div className="mt-6 grid gap-3 sm:grid-cols-[1.6fr_1fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            <span className="absolute top-4 left-4 flex gap-2">
              {listing.status ? (
                <span className="bg-background/95 text-foreground rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                  {listing.status}
                </span>
              ) : null}
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold shadow-sm">
                {listing.kind ?? "For sale"}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
            {gallery.slice(1, 4).map((src, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-[16/10]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${listing.title} — view ${i + 2}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Header + specs + body */}
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <MapPin className="size-4" aria-hidden="true" />
              {listing.location}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {listing.title}
            </h1>
            <p className="text-primary mt-3 text-2xl font-semibold tabular-nums">
              {listing.price}
            </p>

            <dl className="text-foreground border-border mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-y py-5 text-sm">
              <div className="flex items-center gap-2">
                <BedDouble className="text-muted-foreground size-5" aria-hidden="true" />
                <dd>
                  <span className="font-semibold">{listing.beds}</span> beds
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="text-muted-foreground size-5" aria-hidden="true" />
                <dd>
                  <span className="font-semibold">{listing.baths}</span> baths
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="text-muted-foreground size-5" aria-hidden="true" />
                <dd>
                  <span className="font-semibold">{listing.sqft}</span>
                </dd>
              </div>
            </dl>

            {listing.description ? (
              <p className="text-muted-foreground mt-8 text-lg leading-relaxed text-pretty">
                {listing.description}
              </p>
            ) : null}

            {listing.features?.length ? (
              <div className="mt-10">
                <h2 className="text-lg font-semibold tracking-tight">Features</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {listing.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Enquiry card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border-border bg-card rounded-3xl border p-6 shadow-sm">
              <p className="text-lg font-semibold tracking-tight">
                Interested in this home?
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Request a private tour or ask a question. One of our agents will be
                in touch, no pressure.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <RequestTourButton listingTitle={listing.title} />
                <Link
                  href="/listings"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full rounded-full",
                  )}
                >
                  Browse more homes
                </Link>
              </div>
              <p className="text-muted-foreground/80 mt-6 text-xs leading-relaxed">
                Illustrative listing for this portfolio demo. Real homes are added by
                brokerages on PropAI.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
