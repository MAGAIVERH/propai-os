import type { FastifyReply } from "fastify";

/** Forwards all Set-Cookie headers from a Better Auth response to Fastify. */
export function forwardSetCookieHeaders(
  source: Headers,
  reply: FastifyReply,
): void {
  for (const cookie of source.getSetCookie()) {
    void reply.header("Set-Cookie", cookie);
  }
}

/** Builds a Cookie request header from Set-Cookie response headers. */
export function buildCookieHeader(source: Headers): string | null {
  const cookies = source.getSetCookie();

  if (cookies.length === 0) {
    return null;
  }

  return cookies
    .map((cookie) => cookie.split(";")[0] ?? cookie)
    .join("; ");
}

/** Normalizes inject/set-cookie values into a single Cookie header. */
export function normalizeCookieHeader(
  setCookie: string | string[] | undefined,
): string | undefined {
  if (!setCookie) {
    return undefined;
  }

  const values = Array.isArray(setCookie) ? setCookie : [setCookie];

  return values
    .map((cookie) => cookie.split(";")[0] ?? cookie)
    .join("; ");
}
