"use client";

import { APP_NAME } from "@propai/shared";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useOrganizationQuery } from "@/hooks/use-organization";
import { useSignOut } from "@/hooks/use-sign-out";
import {
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from "@/modules/dashboard/data/nav-items";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: organization, isPending } = useOrganizationQuery();
  const { handleSignOut, isPending: isSigningOut } = useSignOut();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="flex h-14 shrink-0 flex-row items-center border-b border-border px-3 py-0">
        <SidebarMenu className="w-full">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-10 rounded-xl px-2"
              render={<Link href="/dashboard" />}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1b2947] shadow-sm">
                <svg viewBox="0 0 32 32" className="size-5" aria-hidden="true">
                  <path
                    d="M16 5 L27 14 L27 27 L19 27 L19 20 L13 20 L13 27 L5 27 L5 14 Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{APP_NAME}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {isPending
                    ? "Loading organization…"
                    : (organization?.name ?? "Brokerage")}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-2 px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wide">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-1">
            <SidebarMenu className="gap-1.5">
              {DASHBOARD_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isDashboardNavActive(pathname, item.href)}
                    tooltip={item.title}
                    className="h-10 rounded-xl px-3 transition-colors"
                  >
                    <item.icon className="size-4" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOut}
              tooltip="Sign out"
              className="text-destructive hover:text-destructive h-10 rounded-xl px-3 transition-colors"
            >
              <LogOut className="size-4" />
              <span className="font-medium">
                {isSigningOut ? "Signing out…" : "Sign out"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
