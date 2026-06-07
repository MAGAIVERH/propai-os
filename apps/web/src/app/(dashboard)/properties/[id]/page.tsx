import Link from "next/link";
import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/module-header";
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

  try {
    const [property, images] = await Promise.all([
      getPropertyById(id),
      getPropertyImages(id),
    ]);

    const addressLabel = formatPropertyAddress(property);

    return (
      <div className="space-y-6">
        <ModuleHeader
          label="Module"
          title={property.title}
          description={addressLabel}
        />

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Summary
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {formatPriceUsdCents(property.priceUsdCents)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getPropertyTypeLabel(property.type)} ·{" "}
                {getRentOrSaleLabel(property.rentOrSale)} · {property.sqFt}{" "}
                sq ft · {property.bedrooms} bed · {property.bathrooms} bath
              </p>
            </div>
            <PropertyStatusBadge
              status={property.status}
              label={getPropertyStatusLabel(property.status)}
            />
          </div>

          {property.description ? (
            <p className="mt-6 text-sm leading-7 text-muted-foreground">
              {property.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              className="rounded-xl"
              render={<Link href={`/properties/${property.id}/edit`} />}
            >
              Edit property
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              render={<Link href="/properties" />}
            >
              Back to list
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
              Map
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              Location
            </h2>
          </div>
          <PropertyMap
            latitude={property.latitude}
            longitude={property.longitude}
            addressLabel={addressLabel}
          />
        </section>

        <PropertyDetailMedia propertyId={property.id} initialImages={images} />
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
