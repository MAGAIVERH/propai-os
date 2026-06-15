import {
  leadResponseSchema,
  type LeadResponse,
  type UpdateLeadInput,
} from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function updateLead(
  id: string,
  input: UpdateLeadInput,
): Promise<LeadResponse> {
  const response = await apiFetch(`/v1/leads/${id}`, {
    method: "PATCH",
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
