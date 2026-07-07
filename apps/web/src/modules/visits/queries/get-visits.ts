import { visitListResponseSchema, type VisitListResponse } from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function getVisits(): Promise<VisitListResponse> {
  const response = await apiFetch("/v1/visits");

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = visitListResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError("Invalid visits response.", 500, "Internal Server Error");
  }

  return parsed.data;
}
