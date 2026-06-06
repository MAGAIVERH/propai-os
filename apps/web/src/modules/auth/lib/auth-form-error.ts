import { AuthClientError } from "@/lib/auth-client";

export function getAuthFormErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof AuthClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}
