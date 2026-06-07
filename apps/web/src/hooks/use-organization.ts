"use client";

import { useQuery } from "@tanstack/react-query";

import { getOrganizationMe } from "@/lib/organization-client";

export const ORGANIZATION_QUERY_KEY = ["organization", "me"] as const;

export function useOrganizationQuery() {
  return useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: getOrganizationMe,
  });
}
