import type { Metadata } from "next";
import Link from "next/link";

import { ListingGrid } from "@/components/listing-grid";
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
  const description = describeFilters(params);
  const title = `Browse ${description}`;
  return {
    title,
    description: `Explore ${description} on the PropAI OS marketplace.`,
    alternates: { canonical: "/properties" },
  };
}

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const tenantId = getDefaultTenantId();
  const params = await searchParams;
  const apiQuery = buildApiQuery(params, "12");

  if (!tenantId) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
        <p className="text-muted-foreground text-sm">Marketplace tenant is not configured.</p>
      </main>
    );
  }

  let properties: Awaited<ReturnType<typeof fetchPublicProperties>>["properties"] = [];
  let nextCursor: string | null = null;
  let fetchError = false;

  try {
    const result = await fetchPublicProperties(tenantId, apiQuery);
    properties = result.properties;
    nextCursor = result.nextCursor;
  } catch {
    fetchError = true;
  }

  // Strip the SSR-only `limit` before handing filters to the client load-more.
  const { limit: _limit, ...clientQuery } = apiQuery;
  void _limit;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-primary mb-1 text-sm font-medium tracking-[0.18em] uppercase">
            Browse
          </p>
          <h1 className="text-2xl font-bold tracking-tight capitalize">
            {describeFilters(params)}
          </h1>
        </div>
        <Link
          href="/properties/map"
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" strokeLinejoin="round" />
            <path d="M9 3v15M15 6v15" />
          </svg>
          Map view
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <PropertyFilters />
        </aside>

        <section>
          {fetchError ? (
            <p className="text-sm text-red-400">Unable to load listings. Please try again later.</p>
          ) : (
            <ListingGrid
              tenantId={tenantId}
              initialProperties={properties}
              initialNextCursor={nextCursor}
              apiQuery={clientQuery as Record<string, string>}
            />
          )}
        </section>
      </div>
    </main>
  );
}
