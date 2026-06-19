import {
  notificationListResponseSchema,
  type NotificationListResponse,
} from "@propai/shared";

import { ApiClientError, apiFetch, parseApiErrorResponse } from "@/lib/api-client";

export async function getNotifications(): Promise<NotificationListResponse> {
  const response = await apiFetch("/v1/notifications?limit=20");

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body: unknown = await response.json();
  const parsed = notificationListResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiClientError(
      "Invalid notifications response.",
      500,
      "Internal Server Error",
    );
  }

  return parsed.data;
}
