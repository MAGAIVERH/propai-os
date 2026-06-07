"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSessionQuery } from "@/hooks/use-session";
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

type UserAvatarProps = {
  initials: string;
  className?: string;
};

function UserAvatar({ initials, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold leading-none text-primary",
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

  const user = session?.user;
  const displayName = user?.name ?? user?.email ?? "Account";
  const initials = getUserInitials(user?.name, user?.email ?? "U");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-9 max-w-[220px] gap-0 overflow-hidden rounded-full p-0 pr-2.5"
          />
        }
      >
        <UserAvatar initials={initials} className="size-9 text-sm" />
        <span className="hidden min-w-0 truncate px-2.5 text-sm font-medium sm:inline">
          {displayName}
        </span>
        <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:inline" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <UserAvatar initials={initials} className="size-9 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {displayName}
              </p>
              {user?.email ? (
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
