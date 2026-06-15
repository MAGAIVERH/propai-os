import { apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function deleteLead(id: string): Promise<void> {
  const response = await apiFetch(`/v1/leads/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}
