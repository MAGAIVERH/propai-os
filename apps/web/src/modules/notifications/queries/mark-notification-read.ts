import { apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function markNotificationRead(id: string): Promise<void> {
  const response = await apiFetch(`/v1/notifications/${id}/read`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const response = await apiFetch("/v1/notifications/read-all", {
    method: "POST",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}
