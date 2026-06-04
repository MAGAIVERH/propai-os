export type ApiErrorBody = {
  error: string;
  message: string;
};

export function apiError(
  error: string,
  message: string,
): ApiErrorBody {
  return { error, message };
}

export function validationErrorMessage(
  issues: Array<{ message?: string }>,
  fallback = "Invalid request body.",
): string {
  return issues[0]?.message ?? fallback;
}
