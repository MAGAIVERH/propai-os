"use client";

import { Bell } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOrganizationQuery } from "@/hooks/use-organization";
import { useTenantSocket } from "@/modules/crm/hooks/use-tenant-socket";

const STATUS_LABEL = {
  open: "Live updates connected",
  connecting: "Connecting to live updates…",
  closed: "Live updates disconnected — retrying",
} as const;

const STATUS_DOT_CLASS = {
  open: "bg-emerald-500",
  connecting: "bg-amber-500",
  closed: "bg-muted-foreground",
} as const;

export function DashboardHeader() {
  const { data: organization, isPending } = useOrganizationQuery();
  const { status } = useTenantSocket();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {isPending
            ? "Loading organization…"
            : (organization?.name ?? "Brokerage")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="relative flex items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl"
                  disabled
                  aria-label="Notifications (coming soon)"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <span
                  className={`absolute right-1 top-1 h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[status]}`}
                />
              </span>
            }
          />
          <TooltipContent>{STATUS_LABEL[status]}</TooltipContent>
        </Tooltip>
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
