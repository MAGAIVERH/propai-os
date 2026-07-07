"use client";

import { useQuery } from "@tanstack/react-query";

import { getVisits } from "@/modules/visits/queries/get-visits";

export const VISITS_QUERY_KEY = ["visits"] as const;

export function useVisitsQuery() {
  return useQuery({
    queryKey: VISITS_QUERY_KEY,
    queryFn: getVisits,
  });
}
