import { getApiUrl, getPublicApiUrl } from "@/lib/env";

export type ApiErrorBody = {
  error: string;
  message: string;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly error: string;

  constructor(message: string, status: number, error: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.error = error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseApiErrorBody(body: unknown): ApiErrorBody {
  if (!isRecord(body)) {
    return {
      error: "Error",
      message: "Request failed.",
    };
  }

  const message =
    typeof body.message === "string"
      ? body.message
      : "Request failed.";
  const error =
    typeof body.error === "string"
      ? body.error
      : typeof body.code === "string"
        ? body.code
        : "Error";

  return { error, message };
}

export async function parseApiErrorResponse(
  response: Response,
): Promise<ApiClientError> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const parsed = parseApiErrorBody(body);

  return new ApiClientError(
    parsed.message,
    response.status,
    parsed.error,
  );
}

type ApiFetchInit = Omit<RequestInit, "credentials"> & {
  json?: unknown;
};

function getFetchBaseUrl(): string {
  return typeof window === "undefined" ? getApiUrl() : getPublicApiUrl();
}

/** Credentialed fetch against the PropAI API (cookies for Better Auth). */
export async function apiFetch(
  path: string,
  init: ApiFetchInit = {},
): Promise<Response> {
  const { json, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);

  if (json !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (typeof window === "undefined") {
    const { headers: nextHeaders } = await import("next/headers");
    const headerStore = await nextHeaders();
    const cookie = headerStore.get("cookie");

    if (cookie) {
      requestHeaders.set("cookie", cookie);
    }
  }

  return fetch(`${getFetchBaseUrl()}${path}`, {
    ...rest,
    credentials: "include",
    headers: requestHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
}
