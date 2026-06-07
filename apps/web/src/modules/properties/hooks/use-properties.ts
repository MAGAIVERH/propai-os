"use client";

import { useQuery } from "@tanstack/react-query";

import { getProperties } from "@/modules/properties/queries/get-properties";
import type { PropertyListQuery } from "@/modules/properties/schemas/property-list";

export const PROPERTIES_QUERY_KEY = ["properties", "list"] as const;

export function usePropertiesQuery(query?: PropertyListQuery) {
  return useQuery({
    queryKey: [...PROPERTIES_QUERY_KEY, query ?? {}],
    queryFn: () => getProperties(query),
  });
}
