import {
  analyticsAgentsResponseSchema,
  analyticsFunnelResponseSchema,
  analyticsOverviewSchema,
  analyticsViewsResponseSchema,
  type AnalyticsAgentsResponse,
  type AnalyticsFunnelResponse,
  type AnalyticsOverview,
  type AnalyticsRange,
  type AnalyticsViewsResponse,
} from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

async function getJson<T>(
  path: string,
  parse: (body: unknown) => { success: boolean; data?: T },
): Promise<T> {
  const response = await apiFetch(path);
  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
  const body: unknown = await response.json();
  const parsed = parse(body);
  if (!parsed.success || parsed.data === undefined) {
    throw new ApiClientError("Invalid analytics response.", 500, "Internal Server Error");
  }
  return parsed.data;
}

export function getOverview(range: AnalyticsRange): Promise<AnalyticsOverview> {
  return getJson(`/v1/analytics/overview?range=${range}`, (b) =>
    analyticsOverviewSchema.safeParse(b),
  );
}

export function getFunnel(): Promise<AnalyticsFunnelResponse> {
  return getJson(`/v1/analytics/funnel`, (b) => analyticsFunnelResponseSchema.safeParse(b));
}

export function getAgents(): Promise<AnalyticsAgentsResponse> {
  return getJson(`/v1/analytics/agents`, (b) => analyticsAgentsResponseSchema.safeParse(b));
}

export function getViews(range: AnalyticsRange): Promise<AnalyticsViewsResponse> {
  return getJson(`/v1/analytics/views?range=${range}`, (b) =>
    analyticsViewsResponseSchema.safeParse(b),
  );
}

/** Downloads a CSV export through a credentialed fetch + blob. */
export async function downloadCsv(resource: "leads" | "properties"): Promise<void> {
  const response = await apiFetch(`/v1/analytics/export/${resource}?format=csv`);
  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${resource}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
