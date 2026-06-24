import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InterestForm } from "@/components/interest-form";
import { LeafletMap } from "@/components/leaflet-map";
import { PropertyGallery } from "@/components/property-gallery";
import { ViewBeacon } from "@/components/view-beacon";
import { fetchPublicPropertyDetail } from "@/lib/api";
import { featureLabel, formatAddress, formatPrice, propertyTypeLabel } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await fetchPublicPropertyDetail(id);

  if (!detail) {
    return { title: "Property not found" };
  }

  const { property } = detail;
  const price = formatPrice(property.priceUsdCents, property.rentOrSale);
  const title = `${property.title} — ${price}`;
  const description =
    property.description?.slice(0, 155) ??
    `${property.bedrooms} bed, ${property.bathrooms} bath ${propertyTypeLabel(
      property.type,
    )} in ${property.city}, ${property.state}. ${price}.`;
  const ogImage = detail.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/properties/${property.id}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border bg-card rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await fetchPublicPropertyDetail(id);

  if (!detail) {
    notFound();
  }

  const { property, images, features } = detail;
  const address = formatAddress(property);
  const price = formatPrice(property.priceUsdCents, property.rentOrSale);
  const hasGeo = property.latitude !== null && property.longitude !== null;

  // schema.org RealEstateListing for rich search/social previews.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description ?? undefined,
    url: `/properties/${property.id}`,
    image: images.map((img) => img.url),
    datePosted: property.createdAt,
    offers: {
      "@type": "Offer",
      price: (property.priceUsdCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.addressLine1,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zipCode,
      addressCountry: "US",
    },
    numberOfBedrooms: property.bedrooms,
    numberOfBathroomsTotal: Number(property.bathrooms),
    floorSize: property.sqFt
      ? { "@type": "QuantitativeValue", value: property.sqFt, unitCode: "FTK" }
      : undefined,
  };

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <ViewBeacon propertyId={property.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-muted-foreground mb-6 text-xs">
        <Link href="/properties" className="hover:text-foreground">
          ← Back to listings
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <PropertyGallery
            images={images}
            title={property.title}
            typeLabel={propertyTypeLabel(property.type)}
          />

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
                {propertyTypeLabel(property.type)}
              </span>
              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-medium">
                {property.rentOrSale === "rent" ? "For Rent" : "For Sale"}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{property.title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{address}</p>
            <p className="text-primary mt-4 text-3xl font-bold">{price}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="Bedrooms" value={property.bedrooms} />
            <Fact label="Bathrooms" value={property.bathrooms} />
            {property.sqFt ? <Fact label="Sq Ft" value={property.sqFt.toLocaleString()} /> : null}
            {property.yearBuilt ? <Fact label="Year Built" value={property.yearBuilt} /> : null}
          </div>

          {property.description && (
            <section>
              <h2 className="mb-2 text-lg font-semibold">About this home</h2>
              <p className="text-muted-foreground leading-7 text-pretty whitespace-pre-line">
                {property.description}
              </p>
            </section>
          )}

          {features.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Features</h2>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <span
                    key={f.key}
                    className="border-border bg-card rounded-lg border px-3 py-1.5 text-sm"
                  >
                    {featureLabel(f.key)}
                    {f.value && f.value.toLowerCase() !== "yes" ? `: ${f.value}` : ""}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-lg font-semibold">Location</h2>
            {hasGeo ? (
              <LeafletMap
                points={[
                  {
                    id: property.id,
                    lat: Number(property.latitude),
                    lng: Number(property.longitude),
                    title: property.title,
                    priceLabel: price,
                  },
                ]}
                className="rounded-card border-border h-72 w-full overflow-hidden border"
                fallbackZoom={14}
              />
            ) : (
              <div className="rounded-card border-border text-muted-foreground flex h-40 items-center justify-center border border-dashed text-sm">
                Map location not available for this listing.
              </div>
            )}
            <p className="text-muted-foreground mt-2 text-xs">{address}</p>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <InterestForm
              tenantId={property.tenantId}
              propertyId={property.id}
              propertyTitle={property.title}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
