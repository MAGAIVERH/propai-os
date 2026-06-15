import {
  leadActivityResponseSchema,
  type CreateLeadActivityInput,
  type LeadActivityResponse,
} from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function createLeadActivity(
  leadId: string,
  input: CreateLeadActivityInput,
): Promise<LeadActivityResponse> {
  const response = await apiFetch(`/v1/leads/${leadId}/activities`, {
    method: "POST",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body = await response.json() as { activity: unknown };
  const parsed = leadActivityResponseSchema.safeParse(body.activity);

  if (!parsed.success) {
    throw new ApiClientError("Invalid activity response.", 500, "Internal Server Error");
  }

  return parsed.data;
}
