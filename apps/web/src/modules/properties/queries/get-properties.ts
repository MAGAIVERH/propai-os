import { propertyListResponseSchema } from "@propai/shared";

import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";
import { mapPropertyToListItem } from "@/modules/properties/lib/format-property";
import type { PropertiesListResult } from "@/modules/properties/types/property";
import type { PropertyListQuery } from "@/modules/properties/schemas/property-list";

function buildPropertiesSearchParams(
  query: PropertyListQuery | undefined,
): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.cursor) {
    params.set("cursor", query.cursor);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.type) {
    params.set("type", query.type);
  }

  if (query.city) {
    params.set("city", query.city);
  }

  if (query.state) {
    params.set("state", query.state);
  }

  if (query.minPriceUsdCents !== undefined) {
    params.set("minPriceUsdCents", String(query.minPriceUsdCents));
  }

  if (query.maxPriceUsdCents !== undefined) {
    params.set("maxPriceUsdCents", String(query.maxPriceUsdCents));
  }

  const serialized = params.toString();

  return serialized.length > 0 ? `?${serialized}` : "";
}

export async function getProperties(
  query?: PropertyListQuery,
): Promise<PropertiesListResult> {
  const search = buildPropertiesSearchParams(query);
  const response = await apiFetch(`/v1/properties${search}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = propertyListResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid properties list response.",
      500,
      "Internal Server Error",
    );
  }

  return {
    items: parsed.data.items.map(mapPropertyToListItem),
    nextCursor: parsed.data.nextCursor,
  };
}
