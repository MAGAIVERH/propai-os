import { leadListResponseSchema, type LeadListResponse } from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function getLeads(): Promise<LeadListResponse> {
  const response = await apiFetch("/v1/leads?limit=100");

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = leadListResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError("Invalid leads response.", 500, "Internal Server Error");
  }

  return parsed.data;
}
