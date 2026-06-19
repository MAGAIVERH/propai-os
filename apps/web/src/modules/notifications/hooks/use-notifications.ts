"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getNotifications } from "@/modules/notifications/queries/get-notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/queries/mark-notification-read";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
  });

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to mark notification as read."),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to mark notifications as read."),
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
