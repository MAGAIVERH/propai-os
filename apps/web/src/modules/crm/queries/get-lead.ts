import { leadResponseSchema, type LeadResponse } from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function getLead(id: string): Promise<LeadResponse> {
  const response = await apiFetch(`/v1/leads/${id}`);

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body = await response.json() as { lead: unknown };
  const parsed = leadResponseSchema.safeParse(body.lead);

  if (!parsed.success) {
    throw new ApiClientError("Invalid lead response.", 500, "Internal Server Error");
  }

  return parsed.data;
}
