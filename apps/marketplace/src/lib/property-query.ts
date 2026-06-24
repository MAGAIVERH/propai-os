import type { PropertyListFilters } from "@/lib/api";
import { propertyTypeLabel } from "@/lib/format";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function dollarsToCents(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return String(Math.round(n * 100));
}

/** Builds the API-shaped filter object (cents, uppercased state) from URL params. */
export function buildApiQuery(params: RawSearchParams, limit: string): PropertyListFilters {
  const query: PropertyListFilters = { limit };
  const city = first(params.city);
  const state = first(params.state);
  const type = first(params.type);
  const rentOrSale = first(params.rentOrSale);
  const beds = first(params.beds);
  const minPrice = dollarsToCents(first(params.minPrice));
  const maxPrice = dollarsToCents(first(params.maxPrice));

  if (city) query.city = city;
  if (state) query.state = state.toUpperCase();
  if (type) query.type = type;
  if (rentOrSale) query.rentOrSale = rentOrSale;
  if (beds) query.beds = beds;
  if (minPrice) query.minPriceUsdCents = minPrice;
  if (maxPrice) query.maxPriceUsdCents = maxPrice;

  return query;
}

export function describeFilters(params: RawSearchParams): string {
  const parts: string[] = [];
  const type = first(params.type);
  const beds = first(params.beds);
  const city = first(params.city);
  const state = first(params.state);
  const rentOrSale = first(params.rentOrSale);

  if (beds) parts.push(`${beds}+ bed`);
  if (type) parts.push(propertyTypeLabel(type));
  parts.push(
    rentOrSale === "rent" ? "rentals" : rentOrSale === "sale" ? "homes for sale" : "properties",
  );
  if (city || state) {
    parts.push(`in ${[city, state?.toUpperCase()].filter(Boolean).join(", ")}`);
  }

  return parts.join(" ");
}
