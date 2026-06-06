"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ORGANIZATION_QUERY_KEY } from "@/hooks/use-organization";
import { SESSION_QUERY_KEY, useSessionQuery } from "@/hooks/use-session";
import { AuthClientError, signOut } from "@/lib/auth-client";

export function UserNav() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSessionQuery();

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
    <div className="flex items-center gap-3">
      {session?.user.name ? (
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session.user.name}
        </span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl"
        disabled={isPending}
        onClick={handleSignOut}
      >
        <LogOut />
        {isPending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
