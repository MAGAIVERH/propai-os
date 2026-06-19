import { Resend } from "resend";

let cachedClient: Resend | null = null;

export class ResendNotConfiguredError extends Error {
  constructor(message = "Resend is not configured (RESEND_API_KEY missing).") {
    super(message);
    this.name = "ResendNotConfiguredError";
  }
}

function readResendApiKey(): string | null {
  const value = process.env.RESEND_API_KEY?.trim();

  if (!value) {
    return null;
  }

  return value;
}

/**
 * Lazy singleton Resend client. Returns null when RESEND_API_KEY is unset so
 * callers (workers) can no-op gracefully in local/dev without email config.
 */
export function getResendClient(): Resend | null {
  const apiKey = readResendApiKey();

  if (!apiKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }

  return cachedClient;
}

export function requireResendClient(): Resend {
  const client = getResendClient();

  if (!client) {
    throw new ResendNotConfiguredError();
  }

  return client;
}

/** Sender address for transactional email (verified Resend domain). */
export function getResendFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() || "notifications@propai-os.com"
  );
}

/** Resets the in-memory singleton without connecting — for tests only. */
export function resetResendClientCache(): void {
  cachedClient = null;
}
