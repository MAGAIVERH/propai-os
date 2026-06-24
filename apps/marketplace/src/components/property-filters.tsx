"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const TYPE_OPTIONS = [
  { value: "", label: "Any type" },
  { value: "single_family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family" },
];

const BEDS_OPTIONS = [
  { value: "", label: "Any beds" },
  { value: "1", label: "1+ beds" },
  { value: "2", label: "2+ beds" },
  { value: "3", label: "3+ beds" },
  { value: "4", label: "4+ beds" },
];

const RENT_OR_SALE_OPTIONS = [
  { value: "", label: "Buy or rent" },
  { value: "sale", label: "For sale" },
  { value: "rent", label: "For rent" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring";

type FilterState = {
  city: string;
  state: string;
  type: string;
  rentOrSale: string;
  beds: string;
  minPrice: string;
  maxPrice: string;
};

function readState(params: URLSearchParams): FilterState {
  return {
    city: params.get("city") ?? "",
    state: params.get("state") ?? "",
    type: params.get("type") ?? "",
    rentOrSale: params.get("rentOrSale") ?? "",
    beds: params.get("beds") ?? "",
    minPrice: params.get("minPrice") ?? "",
    maxPrice: params.get("maxPrice") ?? "",
  };
}

/**
 * Filters bound to the URL. The listing page reads the same params on the
 * server, so deep links like `/properties?city=Austin&beds=2` are shareable
 * and SEO-friendly.
 */
export function PropertyFilters({ basePath = "/properties" }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const [state, setState] = useState<FilterState>(() => readState(new URLSearchParams(paramsKey)));

  // Re-sync local form state when the URL changes (back/forward, reset, deep
  // links). The render-time pattern avoids a cascading-render effect.
  const [prevKey, setPrevKey] = useState(paramsKey);
  if (paramsKey !== prevKey) {
    setPrevKey(paramsKey);
    setState(readState(new URLSearchParams(paramsKey)));
  }

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (state.city.trim()) params.set("city", state.city.trim());
    if (state.state.trim()) params.set("state", state.state.trim().toUpperCase());
    if (state.type) params.set("type", state.type);
    if (state.rentOrSale) params.set("rentOrSale", state.rentOrSale);
    if (state.beds) params.set("beds", state.beds);
    if (state.minPrice.trim()) params.set("minPrice", state.minPrice.trim());
    if (state.maxPrice.trim()) params.set("maxPrice", state.maxPrice.trim());
    router.push(`${basePath}?${params.toString()}`);
  }

  function reset() {
    router.push(basePath);
  }

  const hasFilters = Object.values(state).some((v) => v !== "");

  return (
    <form onSubmit={apply} className="rounded-card border-border bg-card border p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">City</span>
          <input
            className={inputClass}
            value={state.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Austin"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">State</span>
          <input
            className={inputClass}
            value={state.state}
            onChange={(e) => set("state", e.target.value)}
            placeholder="TX"
            maxLength={2}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Listing</span>
          <select
            className={inputClass}
            value={state.rentOrSale}
            onChange={(e) => set("rentOrSale", e.target.value)}
          >
            {RENT_OR_SALE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Type</span>
          <select
            className={inputClass}
            value={state.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Bedrooms</span>
          <select
            className={inputClass}
            value={state.beds}
            onChange={(e) => set("beds", e.target.value)}
          >
            {BEDS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Min price ($)</span>
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            min={0}
            value={state.minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Max price ($)</span>
          <input
            className={inputClass}
            type="number"
            inputMode="numeric"
            min={0}
            value={state.maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
            placeholder="1,000,000"
          />
        </label>
      </div>

      <button
        type="submit"
        className="bg-primary text-primary-foreground mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Apply filters
      </button>
    </form>
  );
}
