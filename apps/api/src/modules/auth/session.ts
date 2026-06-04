import type { FastifyRequest } from "fastify";

import type { PropAiSession } from "./types.js";

const MOCK_SESSION_PREFIX = "Bearer mock-session:";
const MOCK_SESSION_DEFAULT_USER_ID = "test-user-id";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Builds an Authorization header for integration tests (NODE_ENV=test only). */
export function createMockSessionAuthorization(
  organizationId: string,
  userId: string = MOCK_SESSION_DEFAULT_USER_ID,
): string {
  if (userId === MOCK_SESSION_DEFAULT_USER_ID) {
    return `${MOCK_SESSION_PREFIX}${organizationId}`;
  }

  return `${MOCK_SESSION_PREFIX}${organizationId}/${userId}`;
}

function parseMockSession(request: FastifyRequest): PropAiSession | null {
  if (process.env.NODE_ENV !== "test") {
    return null;
  }

  const authorization = request.headers.authorization;

  if (!authorization?.startsWith(MOCK_SESSION_PREFIX)) {
    return null;
  }

  const payload = authorization.slice(MOCK_SESSION_PREFIX.length);
  const slashIndex = payload.indexOf("/");
  const organizationId =
    slashIndex === -1 ? payload : payload.slice(0, slashIndex);
  const userId =
    slashIndex === -1
      ? MOCK_SESSION_DEFAULT_USER_ID
      : payload.slice(slashIndex + 1);

  if (!UUID_PATTERN.test(organizationId) || userId.length === 0) {
    return null;
  }

  return {
    user: { id: userId },
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

function readActiveOrganizationId(sessionRecord: Record<string, unknown>): string | null {
  const value = sessionRecord.activeOrganizationId;

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return null;
}

function mapBetterAuthSession(session: {
  user: { id: string };
  session: Record<string, unknown>;
}): PropAiSession {
  return {
    user: { id: session.user.id },
    session: {
      activeOrganizationId: readActiveOrganizationId(session.session),
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
