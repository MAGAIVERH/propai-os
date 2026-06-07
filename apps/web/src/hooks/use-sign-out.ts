"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { ORGANIZATION_QUERY_KEY } from "@/hooks/use-organization";
import { SESSION_QUERY_KEY } from "@/hooks/use-session";
import { AuthClientError, signOut } from "@/lib/auth-client";

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

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

  return { handleSignOut, isPending };
}
