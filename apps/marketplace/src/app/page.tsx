import type { PropertyResponse } from "@propai/shared";
import Link from "next/link";

import { fetchPublicProperties } from "@/lib/api";
import { getDefaultTenantId } from "@/lib/env";

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

function PropertyCard({ property }: { property: PropertyResponse }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-[#141414] transition-colors hover:border-primary"
    >
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] px-4">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {TYPE_LABEL[property.type] ?? property.type}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <p className="line-clamp-1 font-semibold group-hover:text-primary">{property.title}</p>
        <p className="text-xs text-muted-foreground">
          {property.city}, {property.state} · {property.zipCode}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{property.bedrooms} bd</span>
          <span>·</span>
          <span>{property.bathrooms} ba</span>
          {property.sqFt && (
            <>
              <span>·</span>
              <span>{property.sqFt.toLocaleString()} sqft</span>
            </>
          )}
        </div>
        <p className="mt-1 text-base font-bold text-primary">
          {formatPrice(property.priceUsdCents, property.rentOrSale)}
        </p>
      </div>
    </Link>
  );
}

function NoTenantPlaceholder() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Marketplace</p>
      <h1 className="text-3xl font-bold tracking-tight">PropAI OS</h1>
      <p className="text-sm text-muted-foreground">
        Set <code className="rounded bg-white/5 px-1 py-0.5 text-xs">NEXT_PUBLIC_MARKETPLACE_TENANT_ID</code> in{" "}
        <code className="rounded bg-white/5 px-1 py-0.5 text-xs">apps/marketplace/.env</code> to display listings.
      </p>
    </main>
  );
}

export default async function MarketplaceHome() {
  const tenantId = getDefaultTenantId();

  if (!tenantId) {
    return <NoTenantPlaceholder />;
  }

  let properties: PropertyResponse[] = [];
  let nextCursor: string | null = null;
  let fetchError: string | null = null;

  try {
    const result = await fetchPublicProperties(tenantId, { limit: "20" });
    properties = result.properties;
    nextCursor = result.nextCursor;
  } catch {
    fetchError = "Unable to load listings. Please try again later.";
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="mb-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-primary">Browse Listings</p>
        <h1 className="text-2xl font-bold tracking-tight">Available Properties</h1>
      </div>

      {fetchError ? (
        <p className="text-sm text-red-400">{fetchError}</p>
      ) : properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active listings at this time.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {nextCursor && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Showing first 20 listings.
        </p>
      )}
    </main>
  );
}
