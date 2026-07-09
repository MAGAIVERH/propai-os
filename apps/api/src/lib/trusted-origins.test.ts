import { describe, expect, it } from "vitest";

import { DEFAULT_TRUSTED_ORIGINS, parseTrustedOrigins } from "./trusted-origins.js";

describe("parseTrustedOrigins", () => {
  it("returns only the localhost defaults when the env var is unset", () => {
    expect(parseTrustedOrigins(undefined)).toEqual(DEFAULT_TRUSTED_ORIGINS);
  });

  it("returns only the defaults for an empty string", () => {
    expect(parseTrustedOrigins("")).toEqual(DEFAULT_TRUSTED_ORIGINS);
  });

  it("appends comma-separated env origins to the defaults", () => {
    const result = parseTrustedOrigins(
      "https://app.example.com,https://api.example.com",
    );

    expect(result).toEqual([
      ...DEFAULT_TRUSTED_ORIGINS,
      "https://app.example.com",
      "https://api.example.com",
    ]);
  });

  it("trims whitespace and ignores empty segments", () => {
    const result = parseTrustedOrigins(" https://app.example.com , , ");

    expect(result).toEqual([
      ...DEFAULT_TRUSTED_ORIGINS,
      "https://app.example.com",
    ]);
  });

  it("de-duplicates origins that already exist in the defaults", () => {
    const result = parseTrustedOrigins("http://localhost:3000");

    expect(result).toEqual(DEFAULT_TRUSTED_ORIGINS);
  });
});
