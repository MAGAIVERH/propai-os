type AuthHttpError = {
  status: number;
  message?: string;
  statusCode?: number;
  body?: {
    message?: string;
  };
};

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
  return error.status ?? error.statusCode ?? 500;
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
