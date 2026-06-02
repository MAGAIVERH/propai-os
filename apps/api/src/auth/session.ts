import type { FastifyRequest } from "fastify";

import type { PropAiSession } from "./types.js";

const MOCK_SESSION_PREFIX = "Bearer mock-session:";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Builds an Authorization header for integration tests (NODE_ENV=test only). */
export function createMockSessionAuthorization(
  organizationId: string,
): string {
  return `${MOCK_SESSION_PREFIX}${organizationId}`;
}

function parseMockSession(request: FastifyRequest): PropAiSession | null {
  if (process.env.NODE_ENV !== "test") {
    return null;
  }

  const authorization = request.headers.authorization;

  if (!authorization?.startsWith(MOCK_SESSION_PREFIX)) {
    return null;
  }

  const organizationId = authorization.slice(MOCK_SESSION_PREFIX.length);

  if (!UUID_PATTERN.test(organizationId)) {
    return null;
  }

  return {
    user: { id: "test-user-id" },
    session: { activeOrganizationId: organizationId },
  };
}

function toFetchHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) {
      continue;
    }

    headers.set(key, Array.isArray(value) ? value.join(",") : value);
  }

  return headers;
}

function mapBetterAuthSession(session: {
  user: { id: string };
  session: { activeOrganizationId?: string | null };
}): PropAiSession {
  return {
    user: { id: session.user.id },
    session: {
      activeOrganizationId: session.session.activeOrganizationId ?? null,
    },
  };
}

/** Reads the caller session from Better Auth cookies or test mock authorization. */
export async function getSessionFromRequest(
  request: FastifyRequest,
): Promise<PropAiSession | null> {
  const mockSession = parseMockSession(request);

  if (mockSession) {
    return mockSession;
  }

  try {
    const { auth } = await import("./better-auth.js");
    const session = await auth.api.getSession({
      headers: toFetchHeaders(request),
    });

    if (!session) {
      return null;
    }

    return mapBetterAuthSession(session);
  } catch {
    return null;
  }
}
