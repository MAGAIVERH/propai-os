import { apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function moveLeadStage(leadId: string, stageId: string): Promise<void> {
  const response = await apiFetch(`/v1/leads/${leadId}/stage`, {
    method: "PATCH",
    json: { stageId },
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}
