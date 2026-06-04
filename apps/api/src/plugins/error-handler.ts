import { TenantContextRequiredError } from "@propai/db";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { ZodError } from "zod";

import {
  apiError,
  validationErrorMessage,
  type ApiErrorBody,
} from "../lib/api-error.js";
import {
  getAuthHttpErrorMessage,
  getAuthHttpErrorStatus,
  isAuthHttpError,
} from "../lib/auth-http-error.js";

function isFastifyValidationError(
  error: FastifyError,
): error is FastifyError & { validation: unknown } {
  return Array.isArray(error.validation);
}

function getZodError(error: unknown): ZodError | null {
  if (error instanceof ZodError) {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    error.cause instanceof ZodError
  ) {
    return error.cause;
  }

  return null;
}

function send(
  reply: FastifyReply,
  statusCode: number,
  body: ApiErrorBody,
): void {
  void reply.status(statusCode).send(body);
}

export const errorHandlerPlugin = fp(async (app) => {
  app.setErrorHandler(
    (error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
      const zodError = getZodError(error);

      if (zodError) {
        return send(
          reply,
          400,
          apiError(
            "Bad Request",
            validationErrorMessage(zodError.issues),
          ),
        );
      }

      if (isFastifyValidationError(error)) {
        const validation = error.validation as Array<{ message?: string }>;
        return send(
          reply,
          400,
          apiError("Bad Request", validationErrorMessage(validation)),
        );
      }

      if (error instanceof TenantContextRequiredError) {
        return send(reply, 403, apiError("Forbidden", error.message));
      }

      if (isAuthHttpError(error)) {
        const status = getAuthHttpErrorStatus(error);
        const message = getAuthHttpErrorMessage(error);
        const label =
          status === 401
            ? "Unauthorized"
            : status === 403
              ? "Forbidden"
              : status === 409
                ? "Conflict"
                : status >= 500
                  ? "Internal Server Error"
                  : "Bad Request";

        return send(reply, status, apiError(label, message));
      }

      if (error.statusCode && error.statusCode < 500) {
        return send(
          reply,
          error.statusCode,
          apiError(
            error.name || "Error",
            error.message || "Request failed.",
          ),
        );
      }

      app.log.error(error);

      const isProduction = process.env.NODE_ENV === "production";
      const message = isProduction
        ? "An unexpected error occurred."
        : error.message || "An unexpected error occurred.";

      return send(
        reply,
        error.statusCode ?? 500,
        apiError("Internal Server Error", message),
      );
    },
  );
});
