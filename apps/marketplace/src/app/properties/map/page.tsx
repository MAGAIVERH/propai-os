import type { Metadata } from "next";
import Link from "next/link";

import { MapExplorer } from "@/components/map-explorer";
import { PropertyFilters } from "@/components/property-filters";
import { fetchPublicProperties } from "@/lib/api";
import { getDefaultTenantId } from "@/lib/env";
import { buildApiQuery, describeFilters, type RawSearchParams } from "@/lib/property-query";

type SearchParams = Promise<RawSearchParams>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: `Map · ${describeFilters(params)}`,
    description: "Explore US property listings on an interactive clustered map.",
    alternates: { canonical: "/properties/map" },
  };
}

export default async function PropertiesMapPage({ searchParams }: { searchParams: SearchParams }) {
  const tenantId = getDefaultTenantId();
  const params = await searchParams;

  if (!tenantId) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <p className="text-muted-foreground text-sm">Marketplace tenant is not configured.</p>
      </main>
    );
  }

  // Pull a wide batch so the map shows the full picture for these filters.
  const apiQuery = buildApiQuery(params, "50");
  let properties: Awaited<ReturnType<typeof fetchPublicProperties>>["properties"] = [];
  let fetchError = false;

  try {
    const result = await fetchPublicProperties(tenantId, apiQuery);
    properties = result.properties;
  } catch {
    fetchError = true;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-primary mb-1 text-sm font-medium tracking-[0.18em] uppercase">Map</p>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {describeFilters(params)}
          </h1>
        </div>
        <Link
          href="/properties"
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
          List view
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <PropertyFilters basePath="/properties/map" />
        </aside>

        <section>
          {fetchError ? (
            <p className="text-sm text-red-400">Unable to load the map. Please try again later.</p>
          ) : (
            <MapExplorer properties={properties} />
          )}
        </section>
      </div>
    </main>
  );
}
