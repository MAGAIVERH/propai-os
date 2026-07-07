"use client";

import { ChevronDown, CreditCard, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionQuery } from "@/hooks/use-session";
import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils";

function getUserInitials(name: string | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) ?? email.slice(0, 2)).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function UserAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-white/70 dark:ring-white/10",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function UserNav() {
  const { data: session } = useSessionQuery();
  const { handleSignOut, isPending } = useSignOut();

  const user = session?.user;
  const displayName = user?.name ?? user?.email ?? "Account";
  const initials = getUserInitials(user?.name, user?.email ?? "U");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="hover:bg-muted h-9 max-w-[220px] gap-0 overflow-hidden rounded-full p-0.5 pr-2"
          />
        }
      >
        <UserAvatar initials={initials} />
        <span className="hidden min-w-0 truncate px-2 text-sm font-medium sm:inline">
          {displayName}
        </span>
        <ChevronDown className="text-muted-foreground hidden size-4 shrink-0 sm:inline" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <UserAvatar initials={initials} />
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">{displayName}</p>
              {user?.email ? (
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/settings/general" />}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/billing" />}>
          <CreditCard className="size-4" />
          Billing &amp; plan
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          {isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
