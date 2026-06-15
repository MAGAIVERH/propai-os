import type { PropertyResponse } from "@propai/shared";

import { getApiUrl } from "./env.js";

type PublicPropertyListResult = {
  properties: PropertyResponse[];
  nextCursor: string | null;
};

export async function fetchPublicProperties(
  tenantId: string,
  params?: Record<string, string>,
): Promise<PublicPropertyListResult> {
  const url = new URL(`${getApiUrl()}/public/properties`);
  url.searchParams.set("tenantId", tenantId);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Failed to fetch properties: ${res.status}`);
  }

  return res.json() as Promise<PublicPropertyListResult>;
}

export async function fetchPublicProperty(id: string): Promise<PropertyResponse | null> {
  const url = `${getApiUrl()}/public/properties/${id}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Failed to fetch property: ${res.status}`);
  }

  const body = await res.json() as { property: PropertyResponse };
  return body.property;
}
