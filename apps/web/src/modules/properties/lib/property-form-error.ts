import { ApiClientError } from "@/lib/api-client";

export function getPropertyFormErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return fallback;
}
