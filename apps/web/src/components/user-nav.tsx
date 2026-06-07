"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ORGANIZATION_QUERY_KEY } from "@/hooks/use-organization";
import { SESSION_QUERY_KEY, useSessionQuery } from "@/hooks/use-session";
import { AuthClientError, signOut } from "@/lib/auth-client";

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

export function UserNav() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSessionQuery();

  const user = session?.user;
  const displayName = user?.name ?? user?.email ?? "Account";
  const initials = getUserInitials(user?.name, user?.email ?? "U");

  function handleSignOut() {
    startTransition(async () => {
      try {
        await signOut();

        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        await queryClient.invalidateQueries({
          queryKey: ORGANIZATION_QUERY_KEY,
        });

        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 400);
      } catch (error) {
        const message =
          error instanceof AuthClientError
            ? error.message
            : "Unable to sign out. Please try again.";

        toast.error(message);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
          />
        }
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary">
          {initials}
        </span>
        <span className="hidden max-w-32 truncate text-sm sm:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {displayName}
            </span>
            {user?.email ? (
              <span className="text-xs text-muted-foreground">{user.email}</span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          onClick={handleSignOut}
          className="rounded-lg"
        >
          <LogOut />
          {isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
