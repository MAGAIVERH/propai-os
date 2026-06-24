import type {
  PropertyResponse,
  PublicPropertyDetailResponse,
  SearchSort,
  SemanticSearchResponse,
} from "@propai/shared";

import { getApiUrl } from "./env";

export type PublicPropertyListResult = {
  properties: PropertyResponse[];
  nextCursor: string | null;
};

export type PropertyListFilters = {
  city?: string;
  state?: string;
  type?: string;
  rentOrSale?: string;
  beds?: string;
  minPriceUsdCents?: string;
  maxPriceUsdCents?: string;
  limit?: string;
  cursor?: string;
};

function appendFilters(url: URL, filters?: PropertyListFilters): void {
  if (!filters) return;
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
}

export async function fetchPublicProperties(
  tenantId: string,
  filters?: PropertyListFilters,
): Promise<PublicPropertyListResult> {
  const url = new URL(`${getApiUrl()}/public/properties`);
  url.searchParams.set("tenantId", tenantId);
  appendFilters(url, filters);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Failed to fetch properties: ${res.status}`);
  }

  return res.json() as Promise<PublicPropertyListResult>;
}

export async function fetchPublicPropertyDetail(
  id: string,
): Promise<PublicPropertyDetailResponse | null> {
  const url = `${getApiUrl()}/public/properties/${id}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Failed to fetch property: ${res.status}`);
  }

  return res.json() as Promise<PublicPropertyDetailResponse>;
}

export type SemanticSearchOutcome =
  | { status: "ok"; data: SemanticSearchResponse }
  | { status: "unavailable" }
  | { status: "error" };

export async function fetchSemanticSearch(
  tenantId: string,
  q: string,
  options?: { sort?: SearchSort; filters?: PropertyListFilters },
): Promise<SemanticSearchOutcome> {
  const url = new URL(`${getApiUrl()}/search/semantic`);
  url.searchParams.set("tenantId", tenantId);
  url.searchParams.set("q", q);
  if (options?.sort) url.searchParams.set("sort", options.sort);
  appendFilters(url, options?.filters);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (res.status === 503) {
      return { status: "unavailable" };
    }

    if (!res.ok) {
      return { status: "error" };
    }

    const data = (await res.json()) as SemanticSearchResponse;
    return { status: "ok", data };
  } catch {
    return { status: "error" };
  }
}
