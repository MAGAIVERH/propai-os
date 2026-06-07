"use client";

import { useQuery } from "@tanstack/react-query";

import { getSession } from "@/lib/auth-client";
import type { AuthSessionData } from "@/types/auth";

export const SESSION_QUERY_KEY = ["session"] as const;

export function useSessionQuery() {
  return useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getSession,
  });
}

type UseRequireSessionResult = {
  session: AuthSessionData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
};

export function useRequireSession(): UseRequireSessionResult {
  const query = useSessionQuery();

  return {
    session: query.data ?? null,
    isLoading: query.isPending,
    isAuthenticated: query.isSuccess && query.data !== null,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
