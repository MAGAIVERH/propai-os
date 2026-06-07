"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useSessionQuery } from "@/hooks/use-session";

type PublicSessionRedirectProps = {
  children: React.ReactNode;
};

export function PublicSessionRedirect({
  children,
}: PublicSessionRedirectProps) {
  const router = useRouter();
  const { data: session, isPending } = useSessionQuery();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return children;
}
