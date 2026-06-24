"use client";

import type { PropertyResponse } from "@propai/shared";
import { useState } from "react";

import { PropertyCard } from "@/components/property-card";

type ListingGridProps = {
  tenantId: string;
  initialProperties: PropertyResponse[];
  initialNextCursor: string | null;
  /** API-shaped filters (cents, codes) to replay on subsequent pages. */
  apiQuery: Record<string, string>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export function ListingGrid({
  tenantId,
  initialProperties,
  initialNextCursor,
  apiQuery,
}: ListingGridProps) {
  const [properties, setProperties] = useState(initialProperties);
  const [cursor, setCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${API_URL}/public/properties`);
      url.searchParams.set("tenantId", tenantId);
      for (const [key, value] of Object.entries(apiQuery)) {
        if (value) url.searchParams.set(key, value);
      }
      url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(String(res.status));

      const data = (await res.json()) as {
        properties: PropertyResponse[];
        nextCursor: string | null;
      };
      setProperties((prev) => [...prev, ...data.properties]);
      setCursor(data.nextCursor);
    } catch {
      setError("Couldn't load more listings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-card border-border bg-card/40 border border-dashed px-6 py-16 text-center">
        <p className="font-medium">No listings match your filters</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Try widening your price range or clearing some filters.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      {error && <p className="mt-6 text-center text-sm text-red-400">{error}</p>}

      {cursor && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="border-border hover:bg-muted rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
