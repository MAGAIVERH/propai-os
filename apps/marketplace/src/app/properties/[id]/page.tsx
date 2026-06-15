import { notFound } from "next/navigation";

import { InterestForm } from "@/components/interest-form";
import { fetchPublicProperty } from "@/lib/api";

type Props = {
  params: Promise<{ id: string }>;
};

const TYPE_LABEL: Record<string, string> = {
  single_family: "Single Family",
  condo: "Condo",
  townhouse: "Townhouse",
  multi_family: "Multi-Family",
};

function formatPrice(cents: number, rentOrSale: string): string {
  const dollars = cents / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
  return rentOrSale === "rent" ? `${formatted}/mo` : formatted;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = await fetchPublicProperty(id);

  if (!property) {
    notFound();
  }

  const address = [
    property.addressLine1,
    property.addressLine2,
    `${property.city}, ${property.state} ${property.zipCode}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-6">
        <a href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to listings
        </a>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a]">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {TYPE_LABEL[property.type] ?? property.type}
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">{property.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{address}</p>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-xl font-bold text-primary">
                {formatPrice(property.priceUsdCents, property.rentOrSale)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Beds</p>
              <p className="text-xl font-bold">{property.bedrooms}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Baths</p>
              <p className="text-xl font-bold">{property.bathrooms}</p>
            </div>
            {property.sqFt && (
              <div>
                <p className="text-xs text-muted-foreground">Sq Ft</p>
                <p className="text-xl font-bold">{property.sqFt.toLocaleString()}</p>
              </div>
            )}
            {property.yearBuilt && (
              <div>
                <p className="text-xs text-muted-foreground">Year Built</p>
                <p className="text-xl font-bold">{property.yearBuilt}</p>
              </div>
            )}
          </div>

          {property.description && (
            <div>
              <p className="mb-2 text-sm font-medium">Description</p>
              <p className="text-sm leading-7 text-muted-foreground">{property.description}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <InterestForm
            tenantId={property.tenantId}
            propertyId={property.id}
            propertyTitle={property.title}
          />
        </div>
      </div>
    </main>
  );
}
