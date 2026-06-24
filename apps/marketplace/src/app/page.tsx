import type { PropertyResponse } from "@propai/shared";
import Link from "next/link";

import { PropertyCard } from "@/components/property-card";
import { SearchBar } from "@/components/search-bar";
import { fetchPublicProperties } from "@/lib/api";
import { getDefaultTenantId } from "@/lib/env";

function NoTenantPlaceholder() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-24">
      <p className="text-primary text-sm font-medium tracking-[0.18em] uppercase">Marketplace</p>
      <h1 className="text-3xl font-bold tracking-tight">PropAI OS</h1>
      <p className="text-muted-foreground text-sm">
        Set{" "}
        <code className="bg-muted rounded px-1 py-0.5 text-xs">
          NEXT_PUBLIC_MARKETPLACE_TENANT_ID
        </code>{" "}
        in <code className="bg-muted rounded px-1 py-0.5 text-xs">apps/marketplace/.env</code> to
        display listings.
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
  let fetchError = false;

  try {
    const result = await fetchPublicProperties(tenantId, { limit: "6" });
    properties = result.properties;
  } catch {
    fetchError = true;
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-border relative overflow-hidden border-b">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto w-full max-w-4xl px-5 py-20 text-center sm:py-28">
          <span className="border-border bg-card/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            <span className="bg-primary size-1.5 rounded-full" />
            AI-native property search
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Find your next home, <span className="text-primary">in plain English.</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-base text-pretty">
            Skip the rigid filters. Describe the lifestyle you want and let our AI surface the right
            US listings for you.
          </p>
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-primary mb-1 text-sm font-medium tracking-[0.18em] uppercase">
              Featured
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Latest listings</h2>
          </div>
          <Link
            href="/properties"
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            View all
          </Link>
        </div>

        {fetchError ? (
          <p className="text-sm text-red-400">Unable to load listings. Please try again later.</p>
        ) : properties.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active listings at this time.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
