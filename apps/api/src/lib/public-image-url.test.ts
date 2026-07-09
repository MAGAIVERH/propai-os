import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildPublicImageUrl } from "./public-image-url.js";

const ENV_KEYS = ["S3_PUBLIC_BASE_URL", "S3_ENDPOINT", "S3_BUCKET"] as const;

describe("buildPublicImageUrl", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  it("prefers the explicit public base URL", () => {
    process.env.S3_PUBLIC_BASE_URL = "https://cdn.example.com";
    process.env.S3_ENDPOINT = "http://localhost:9000";
    process.env.S3_BUCKET = "propai-uploads";

    expect(buildPublicImageUrl("photos/a.jpg")).toBe(
      "https://cdn.example.com/photos/a.jpg",
    );
  });

  it("strips a trailing slash from the public base URL", () => {
    process.env.S3_PUBLIC_BASE_URL = "https://cdn.example.com/";

    expect(buildPublicImageUrl("photos/a.jpg")).toBe(
      "https://cdn.example.com/photos/a.jpg",
    );
  });

  it("falls back to endpoint/bucket path style", () => {
    process.env.S3_ENDPOINT = "http://localhost:9000/";
    process.env.S3_BUCKET = "propai-uploads";

    expect(buildPublicImageUrl("photos/a.jpg")).toBe(
      "http://localhost:9000/propai-uploads/photos/a.jpg",
    );
  });

  it("returns null when neither base URL nor endpoint+bucket are set", () => {
    expect(buildPublicImageUrl("photos/a.jpg")).toBeNull();
  });

  it("returns null when the endpoint is set but the bucket is missing", () => {
    process.env.S3_ENDPOINT = "http://localhost:9000";

    expect(buildPublicImageUrl("photos/a.jpg")).toBeNull();
  });
});
