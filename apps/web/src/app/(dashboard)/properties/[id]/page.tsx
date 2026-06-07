import Link from "next/link";
import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/module-header";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api-client";
import { PropertyStatusBadge } from "@/modules/properties/components/property-status-badge";
import {
  formatPriceUsdCents,
  getPropertyStatusLabel,
  getPropertyTypeLabel,
  getRentOrSaleLabel,
} from "@/modules/properties/lib/format-property";
import { getPropertyById } from "@/modules/properties/queries/get-property-by-id";

type PropertyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  try {
    const property = await getPropertyById(id);

    return (
      <div className="space-y-6">
        <ModuleHeader
          label="Módulo"
          title={property.title}
          description={`${property.addressLine1}, ${property.city}, ${property.state} ${property.zipCode}`}
        />

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                Resumo
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {formatPriceUsdCents(property.priceUsdCents)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getPropertyTypeLabel(property.type)} ·{" "}
                {getRentOrSaleLabel(property.rentOrSale)} · {property.sqFt}{" "}
                sq ft · {property.bedrooms} quartos · {property.bathrooms}{" "}
                banheiros
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
            <Button className="rounded-xl" render={<Link href={`/properties/${property.id}/edit`} />}>
              Editar imóvel
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              render={<Link href="/properties" />}
            >
              Voltar para a lista
            </Button>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
