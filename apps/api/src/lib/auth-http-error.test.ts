import { describe, expect, it } from "vitest";

import {
  getAuthHttpErrorMessage,
  getAuthHttpErrorStatus,
  isAuthHttpError,
  mapSignUpErrorMessage,
  mapSignUpErrorStatus,
  normalizeAuthHttpStatus,
} from "./auth-http-error.js";

describe("normalizeAuthHttpStatus", () => {
  it("passes through numeric HTTP statuses", () => {
    expect(normalizeAuthHttpStatus(401)).toBe(401);
    expect(normalizeAuthHttpStatus(409)).toBe(409);
  });

  it("maps the UNPROCESSABLE_ENTITY string to 422", () => {
    expect(normalizeAuthHttpStatus("UNPROCESSABLE_ENTITY")).toBe(422);
  });

  it("parses numeric strings within the HTTP range", () => {
    expect(normalizeAuthHttpStatus("403")).toBe(403);
  });

  it("falls back to 500 for out-of-range or unknown values", () => {
    expect(normalizeAuthHttpStatus(200)).toBe(500);
    expect(normalizeAuthHttpStatus(600)).toBe(500);
    expect(normalizeAuthHttpStatus("nonsense")).toBe(500);
    expect(normalizeAuthHttpStatus(undefined)).toBe(500);
  });
});

describe("isAuthHttpError", () => {
  it("recognizes objects with a numeric status", () => {
    expect(isAuthHttpError({ status: 409 })).toBe(true);
    expect(isAuthHttpError({ statusCode: 401 })).toBe(true);
  });

  it("rejects non-objects and shapes without a numeric status", () => {
    expect(isAuthHttpError(null)).toBe(false);
    expect(isAuthHttpError("boom")).toBe(false);
    expect(isAuthHttpError({ status: "409" })).toBe(false);
  });
});

describe("getAuthHttpErrorStatus", () => {
  it("prefers status over statusCode and normalizes it", () => {
    expect(getAuthHttpErrorStatus({ status: "UNPROCESSABLE_ENTITY" })).toBe(422);
    expect(getAuthHttpErrorStatus({ statusCode: 401 })).toBe(401);
  });
});

describe("getAuthHttpErrorMessage", () => {
  it("prefers body.message, then message, then a default", () => {
    expect(
      getAuthHttpErrorMessage({ status: 400, body: { message: "from body" } }),
    ).toBe("from body");
    expect(getAuthHttpErrorMessage({ status: 400, message: "top level" })).toBe(
      "top level",
    );
    expect(getAuthHttpErrorMessage({ status: 400 })).toBe(
      "Authentication request failed.",
    );
  });
});

describe("sign-up error mapping", () => {
  it("collapses 422/409 conflicts to a 409 'email already registered'", () => {
    expect(mapSignUpErrorStatus(422)).toBe(409);
    expect(mapSignUpErrorStatus(409)).toBe(409);
    expect(mapSignUpErrorMessage(422, "raw")).toBe("Email already registered.");
    expect(mapSignUpErrorMessage(409, "raw")).toBe("Email already registered.");
  });

  it("passes through other statuses and messages unchanged", () => {
    expect(mapSignUpErrorStatus(400)).toBe(400);
    expect(mapSignUpErrorMessage(400, "Bad password")).toBe("Bad password");
  });
});
