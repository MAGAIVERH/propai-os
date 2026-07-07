import { Bath, BedDouble, Home, Maximize } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api-client";
import { PropertyDetailMedia } from "@/modules/properties/components/property-detail-media";
import { PropertyMap } from "@/modules/properties/components/property-map";
import { PropertyStatusBadge } from "@/modules/properties/components/property-status-badge";
import {
  formatPriceUsdCents,
  getPropertyStatusLabel,
  getPropertyTypeLabel,
  getRentOrSaleLabel,
} from "@/modules/properties/lib/format-property";
import { getPropertyById } from "@/modules/properties/queries/get-property-by-id";
import { getPropertyImages } from "@/modules/properties/queries/get-property-images";

type PropertyDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatPropertyAddress(property: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
}): string {
  const line2 = property.addressLine2?.trim();
  const street = line2
    ? `${property.addressLine1}, ${line2}`
    : property.addressLine1;

  return `${street}, ${property.city}, ${property.state} ${property.zipCode}`;
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  let property: Awaited<ReturnType<typeof getPropertyById>>;
  let images: Awaited<ReturnType<typeof getPropertyImages>>;

  try {
    [property, images] = await Promise.all([
      getPropertyById(id),
      getPropertyImages(id),
    ]);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const addressLabel = formatPropertyAddress(property);

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.title}
        description={addressLabel}
        back={{ label: "Properties", href: "/properties" }}
        actions={
          <Button className="rounded-lg" render={<Link href={`/properties/${property.id}/edit`} />}>
            Edit property
          </Button>
        }
      />

      <section className="border-border bg-card rounded-2xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-primary text-3xl font-semibold tracking-tight tabular-nums">
              {formatPriceUsdCents(property.priceUsdCents)}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {getRentOrSaleLabel(property.rentOrSale)} · {getPropertyTypeLabel(property.type)}
            </p>
          </div>
          <PropertyStatusBadge
            status={property.status}
            label={getPropertyStatusLabel(property.status)}
          />
        </div>

        <dl className="border-border mt-6 grid grid-cols-2 gap-5 border-t pt-6 sm:grid-cols-4">
          <SpecItem icon={BedDouble} label="Bedrooms" value={String(property.bedrooms)} />
          <SpecItem icon={Bath} label="Bathrooms" value={String(property.bathrooms)} />
          <SpecItem icon={Maximize} label="Square feet" value={`${property.sqFt.toLocaleString()}`} />
          <SpecItem icon={Home} label="Type" value={getPropertyTypeLabel(property.type)} />
        </dl>

        {property.description ? (
          <p className="text-muted-foreground mt-6 text-sm leading-relaxed text-pretty">
            {property.description}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Location</h2>
        <PropertyMap
          latitude={property.latitude}
          longitude={property.longitude}
          addressLabel={addressLabel}
        />
      </section>

      <PropertyDetailMedia propertyId={property.id} initialImages={images} />
    </div>
  );
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-primary/10 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="truncate text-sm font-semibold">{value}</dd>
      </div>
    </div>
  );
}
