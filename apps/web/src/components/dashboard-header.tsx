"use client";

import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useOrganizationQuery } from "@/hooks/use-organization";
import { useTenantSocket } from "@/modules/crm/hooks/use-tenant-socket";

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
        <NotificationBell connectionStatus={status} />
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
