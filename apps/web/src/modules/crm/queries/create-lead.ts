import { leadResponseSchema, type CreateLeadInput, type LeadResponse } from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function createLead(input: CreateLeadInput): Promise<LeadResponse> {
  const response = await apiFetch("/v1/leads", {
    method: "POST",
    json: input,
  });

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
