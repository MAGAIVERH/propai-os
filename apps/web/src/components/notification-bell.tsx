"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import type { NotificationResponse } from "@propai/shared";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/modules/notifications/hooks/use-notifications";
import type { TenantSocketStatus } from "@/modules/crm/hooks/use-tenant-socket";

const STATUS_LABEL: Record<TenantSocketStatus, string> = {
  open: "Live updates connected",
  connecting: "Connecting to live updates…",
  closed: "Live updates disconnected — retrying",
};

const STATUS_DOT_CLASS: Record<TenantSocketStatus, string> = {
  open: "bg-emerald-500",
  connecting: "bg-amber-500",
  closed: "bg-muted-foreground",
};

function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(deltaMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

type NotificationBellProps = {
  connectionStatus: TenantSocketStatus;
};

export function NotificationBell({ connectionStatus }: NotificationBellProps) {
  const router = useRouter();
  const { notifications, unreadCount, isPending, markRead, markAllRead } =
    useNotifications();

  const handleSelect = (notification: NotificationResponse) => {
    if (!notification.readAt) {
      markRead(notification.id);
    }

    if (notification.leadId) {
      router.push(`/leads/${notification.leadId}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={STATUS_LABEL[connectionStatus]}
        render={
          <span className="relative flex items-center justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-xl"
              aria-label={
                unreadCount > 0
                  ? `Notifications (${unreadCount} unread)`
                  : "Notifications"
              }
            >
              <Bell className="h-4 w-4" />
            </Button>
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : (
              <span
                className={cn(
                  "absolute right-1 top-1 h-1.5 w-1.5 rounded-full",
                  STATUS_DOT_CLASS[connectionStatus],
                )}
              />
            )}
          </span>
        }
      />

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto border-t border-border">
          {isPending ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleSelect(notification)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-muted",
                  !notification.readAt && "bg-primary/5",
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {notification.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.body}
                </span>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
