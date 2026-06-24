import type { Metadata } from "next";
import Link from "next/link";

import { SearchBar } from "@/components/search-bar";
import { SearchResultCard } from "@/components/search-result-card";
import { SortSelect } from "@/components/sort-select";
import { fetchSemanticSearch } from "@/lib/api";
import { getDefaultTenantId } from "@/lib/env";
import type { SearchSort } from "@propai/shared";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const VALID_SORTS: SearchSort[] = ["relevance", "price_asc", "newest"];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const q = first((await searchParams).q);
  return {
    title: q ? `Search: ${q}` : "AI Property Search",
    description:
      "Describe your ideal home in plain English and let PropAI's AI find matching US listings.",
  };
}

const EXAMPLE_QUERIES = [
  "Quiet area near parks, pet friendly, under $500k",
  "Modern condo with home office downtown",
  "Family home with a big backyard and garage",
  "Walkable neighborhood close to good schools",
];

function EmptyState() {
  return (
    <div className="rounded-card border-border bg-card/40 border border-dashed px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">Search in your own words</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        Our AI understands lifestyle, not just filters. Start with one of these:
      </p>
      <div className="mx-auto mt-5 flex max-w-xl flex-wrap justify-center gap-2">
        {EXAMPLE_QUERIES.map((q) => (
          <Link
            key={q}
            href={`/search?q=${encodeURIComponent(q)}`}
            className="border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground rounded-full border px-3 py-1.5 text-xs transition-colors"
          >
            {q}
          </Link>
        ))}
      </div>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="rounded-card border-border bg-card border px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">AI search is warming up</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        Semantic search isn&apos;t enabled in this environment right now. You can still browse the
        full catalog with classic filters.
      </p>
      <Link
        href="/properties"
        className="bg-primary text-primary-foreground mt-5 inline-block rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Browse all listings
      </Link>
    </div>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q)?.trim() ?? "";
  const sortParam = first(params.sort);
  const sort: SearchSort = VALID_SORTS.includes(sortParam as SearchSort)
    ? (sortParam as SearchSort)
    : "relevance";

  const tenantId = getDefaultTenantId();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <p className="text-primary mb-1 text-sm font-medium tracking-[0.18em] uppercase">AI Search</p>
      <h1 className="text-2xl font-bold tracking-tight">Find homes by describing them</h1>

      <div className="mt-6 max-w-3xl">
        <SearchBar defaultValue={q} autoFocus={!q} />
      </div>

      <div className="mt-10">
        {!tenantId ? (
          <p className="text-muted-foreground text-sm">Marketplace tenant is not configured.</p>
        ) : !q ? (
          <EmptyState />
        ) : (
          <SearchResults tenantId={tenantId} q={q} sort={sort} />
        )}
      </div>
    </main>
  );
}

async function SearchResults({
  tenantId,
  q,
  sort,
}: {
  tenantId: string;
  q: string;
  sort: SearchSort;
}) {
  const outcome = await fetchSemanticSearch(tenantId, q, { sort });

  if (outcome.status === "unavailable") {
    return <UnavailableState />;
  }

  if (outcome.status === "error") {
    return (
      <p className="text-sm text-red-400">
        Something went wrong running that search. Please try again.
      </p>
    );
  }

  const { items } = outcome.data;

  if (items.length === 0) {
    return (
      <div className="rounded-card border-border bg-card/40 border border-dashed px-6 py-14 text-center">
        <h2 className="text-lg font-semibold">No matches for “{q}”</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          Try describing the home differently, or{" "}
          <Link href="/properties" className="text-primary hover:underline">
            browse all listings
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {items.length} {items.length === 1 ? "match" : "matches"} for{" "}
          <span className="text-foreground">“{q}”</span>
        </p>
        <SortSelect />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <SearchResultCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
