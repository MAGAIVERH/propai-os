import { leadActivityListResponseSchema, type LeadActivityListResponse } from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function getLeadActivities(leadId: string): Promise<LeadActivityListResponse> {
  const response = await apiFetch(`/v1/leads/${leadId}/activities`);

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = leadActivityListResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError("Invalid activities response.", 500, "Internal Server Error");
  }

  return parsed.data;
}
