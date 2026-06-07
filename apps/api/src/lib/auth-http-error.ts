type AuthHttpError = {
  status: number | string;
  message?: string;
  statusCode?: number | string;
  body?: {
    message?: string;
  };
};

/** Better Auth may expose string status codes (e.g. UNPROCESSABLE_ENTITY). */
export function normalizeAuthHttpStatus(value: unknown): number {
  if (typeof value === "number" && value >= 400 && value < 600) {
    return value;
  }

  if (typeof value === "string") {
    if (value === "UNPROCESSABLE_ENTITY") {
      return 422;
    }

    const parsed = Number.parseInt(value, 10);

    if (!Number.isNaN(parsed) && parsed >= 400 && parsed < 600) {
      return parsed;
    }
  }

  return 500;
}

export function isAuthHttpError(error: unknown): error is AuthHttpError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const record = error as AuthHttpError;

  return (
    typeof record.status === "number" || typeof record.statusCode === "number"
  );
}

export function getAuthHttpErrorStatus(error: AuthHttpError): number {
  return normalizeAuthHttpStatus(error.status ?? error.statusCode);
}

export function getAuthHttpErrorMessage(error: AuthHttpError): string {
  return (
    error.body?.message ??
    error.message ??
    "Authentication request failed."
  );
}

/** Maps Better Auth sign-up conflicts to brokerage API responses. */
export function mapSignUpErrorStatus(status: number): number {
  if (status === 422 || status === 409) {
    return 409;
  }

  return status;
}

export function mapSignUpErrorMessage(status: number, message: string): string {
  if (status === 422 || status === 409) {
    return "Email already registered.";
  }

  return message;
}
