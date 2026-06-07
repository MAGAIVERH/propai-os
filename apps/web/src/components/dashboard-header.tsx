"use client";

import { Bell } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useOrganizationQuery } from "@/hooks/use-organization";

export function DashboardHeader() {
  const { data: organization, isPending } = useOrganizationQuery();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {isPending
            ? "Loading organization…"
            : (organization?.name ?? "Brokerage")}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl"
          disabled
          aria-label="Notifications (coming soon)"
          title="Notifications (coming soon)"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
