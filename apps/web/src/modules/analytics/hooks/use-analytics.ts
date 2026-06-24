"use client";

import type { AnalyticsRange } from "@propai/shared";
import { useQuery } from "@tanstack/react-query";

import { getAgents, getFunnel, getOverview, getViews } from "../queries/get-analytics";

export const ANALYTICS_QUERY_KEY = ["analytics"] as const;

export function useAnalyticsOverview(range: AnalyticsRange) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, "overview", range],
    queryFn: () => getOverview(range),
  });
}

export function useAnalyticsFunnel(range: AnalyticsRange) {
  return useQuery({
    // range is included so the chart re-fetches with the selector, even though
    // the funnel reflects current pipeline state.
    queryKey: [...ANALYTICS_QUERY_KEY, "funnel", range],
    queryFn: () => getFunnel(),
  });
}

export function useAnalyticsAgents(range: AnalyticsRange) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, "agents", range],
    queryFn: () => getAgents(),
  });
}

export function useAnalyticsViews(range: AnalyticsRange) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, "views", range],
    queryFn: () => getViews(range),
  });
}
