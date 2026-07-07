"use client";

import { ChevronDown, CreditCard, LogOut, Settings, UserCog } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
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
        "bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

const ROW =
  "group/row flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted";
const ROW_ICON = "text-muted-foreground group-hover/row:text-foreground size-4 transition-colors";

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

      <DropdownMenuContent align="end" className="w-60 rounded-xl p-0">
        {/* Account header */}
        <div className="flex items-center gap-3 px-3 py-3">
          <UserAvatar initials={initials} className="size-9 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-sm font-medium">{displayName}</p>
            {user?.email ? (
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            ) : null}
          </div>
        </div>

        <div className="border-border border-t p-1">
          <Link href="/profile" className={ROW}>
            <UserCog className={ROW_ICON} />
            Your profile
          </Link>
          <Link href="/settings/general" className={ROW}>
            <Settings className={ROW_ICON} />
            Brokerage settings
          </Link>
          <Link href="/settings/billing" className={ROW}>
            <CreditCard className={ROW_ICON} />
            Billing &amp; plan
          </Link>
        </div>

        <div className="border-border border-t p-1">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className={cn(
              ROW,
              "text-destructive hover:bg-destructive/10 disabled:opacity-60",
            )}
          >
            <LogOut className="size-4" />
            {isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
