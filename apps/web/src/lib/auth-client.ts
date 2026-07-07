import {
  apiFetch,
  ApiClientError,
  parseApiErrorResponse,
} from "@/lib/api-client";
import type {
  AuthOrganization,
  AuthSession,
  AuthSessionData,
  AuthUser,
  BrokerageSignUpResult,
  SignInWithEmailInput,
  SignUpBrokerageInput,
} from "@/types/auth";

export { ApiClientError as AuthClientError };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  return readString(value);
}

function parseAuthUser(value: unknown): AuthUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const email = readString(value.email);
  const name = readString(value.name);

  if (!id || !email || !name) {
    return null;
  }

  const image =
    value.image === null
      ? null
      : typeof value.image === "string"
        ? value.image
        : undefined;

  return { id, email, name, image };
}

function parseAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const userId = readString(value.userId);
  const expiresAt = readString(value.expiresAt);

  if (!id || !userId || !expiresAt) {
    return null;
  }

  return {
    id,
    userId,
    expiresAt,
    activeOrganizationId: readNullableString(value.activeOrganizationId),
  };
}

function parseAuthSessionData(value: unknown): AuthSessionData | null {
  if (!isRecord(value)) {
    return null;
  }

  const session = parseAuthSession(value.session);
  const user = parseAuthUser(value.user);

  if (!session || !user) {
    return null;
  }

  return { session, user };
}

function parseAuthOrganization(value: unknown): AuthOrganization | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const name = readString(value.name);
  const slug = readString(value.slug);

  if (!id || !name || !slug) {
    return null;
  }

  return { id, name, slug };
}

function parseBrokerageSignUpResult(value: unknown): BrokerageSignUpResult {
  if (!isRecord(value)) {
    throw new ApiClientError(
      "Invalid brokerage sign-up response.",
      500,
      "Internal Server Error",
    );
  }

  const user = parseAuthUser(value.user);
  const organization = parseAuthOrganization(value.organization);

  if (!isRecord(value.session)) {
    throw new ApiClientError(
      "Invalid brokerage sign-up response.",
      500,
      "Internal Server Error",
    );
  }

  const activeOrganizationId = readString(value.session.activeOrganizationId);

  if (!user || !organization || !activeOrganizationId) {
    throw new ApiClientError(
      "Invalid brokerage sign-up response.",
      500,
      "Internal Server Error",
    );
  }

  return {
    user,
    organization,
    session: { activeOrganizationId },
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function signInWithEmail(
  input: SignInWithEmailInput,
): Promise<AuthSessionData> {
  const response = await apiFetch("/api/auth/brokerage-sign-in", {
    method: "POST",
    json: {
      email: input.email,
      password: input.password,
    },
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body = await readJson(response);
  const sessionFromBody = parseAuthSessionData(body);

  if (sessionFromBody) {
    return sessionFromBody;
  }

  const session = await getSession();

  if (!session) {
    throw new ApiClientError(
      "Sign-in succeeded but session data was missing.",
      500,
      "Internal Server Error",
    );
  }

  return session;
}

export async function signUpBrokerage(
  input: SignUpBrokerageInput,
): Promise<BrokerageSignUpResult> {
  const response = await apiFetch("/api/auth/brokerage-sign-up", {
    method: "POST",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body = await readJson(response);

  return parseBrokerageSignUpResult(body);
}

export async function getSession(): Promise<AuthSessionData | null> {
  const response = await apiFetch("/api/auth/get-session", {
    method: "GET",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }

  const body = await readJson(response);

  return parseAuthSessionData(body);
}

export async function createBrokerage(input: {
  organizationName: string;
}): Promise<void> {
  const response = await apiFetch("/api/auth/brokerage-create-organization", {
    method: "POST",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}

export async function signOut(): Promise<void> {
  const response = await apiFetch("/api/auth/sign-out", {
    method: "POST",
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}

/** Updates the signed-in user's profile (name and/or avatar URL) via Better Auth. */
export async function updateUserProfile(input: {
  name?: string;
  image?: string | null;
}): Promise<void> {
  const response = await apiFetch("/api/auth/update-user", {
    method: "POST",
    json: input,
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}

/** Changes the signed-in user's password via Better Auth. */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const response = await apiFetch("/api/auth/change-password", {
    method: "POST",
    json: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      revokeOtherSessions: false,
    },
  });

  if (!response.ok) {
    throw await parseApiErrorResponse(response);
  }
}
