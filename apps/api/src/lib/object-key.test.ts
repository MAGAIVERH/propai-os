import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertKeyBelongsToTenant,
  assertKeyMatchesTenantProperty,
  buildObjectKey,
  contentTypeToExtension,
  mimeTypeMatchesExtension,
  parseObjectKey,
} from "./object-key.js";

vi.mock("node:crypto", () => ({
  randomUUID: vi.fn(),
}));

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const propertyId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const fileId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("contentTypeToExtension", () => {
  it("maps supported image content types", () => {
    expect(contentTypeToExtension("image/jpeg")).toBe("jpg");
    expect(contentTypeToExtension("image/png")).toBe("png");
    expect(contentTypeToExtension("image/webp")).toBe("webp");
    expect(contentTypeToExtension("image/jpeg; charset=binary")).toBe("jpg");
  });

  it("returns null for unsupported content types", () => {
    expect(contentTypeToExtension("application/pdf")).toBeNull();
  });
});

describe("buildObjectKey", () => {
  beforeEach(() => {
    vi.mocked(randomUUID).mockReturnValue(fileId);
  });

  it("builds tenant-scoped key with mapped extension", () => {
    const key = buildObjectKey({
      tenantId,
      propertyId,
      contentType: "image/jpeg",
    });

    expect(key).toBe(
      `tenant/${tenantId}/property/${propertyId}/${fileId}.jpg`,
    );
  });

  it("throws for unsupported content type", () => {
    expect(() =>
      buildObjectKey({
        tenantId,
        propertyId,
        contentType: "application/pdf",
      }),
    ).toThrow("Unsupported image content type");
  });
});

describe("parseObjectKey", () => {
  const validKey = `tenant/${tenantId}/property/${propertyId}/${fileId}.jpg`;

  it("parses a valid object key", () => {
    expect(parseObjectKey(validKey)).toEqual({
      tenantId,
      propertyId,
      fileId,
      ext: "jpg",
    });
  });

  it("parses keys case-insensitively", () => {
    const upperKey = validKey.toUpperCase();

    expect(parseObjectKey(upperKey)?.tenantId).toBe(tenantId);
    expect(parseObjectKey(upperKey)?.ext).toBe("jpg");
  });

  it("rejects path traversal and leading slashes", () => {
    expect(parseObjectKey(`/tenant/${tenantId}/property/${propertyId}/${fileId}.jpg`)).toBeNull();
    expect(parseObjectKey(`tenant/../${tenantId}/property/${propertyId}/${fileId}.jpg`)).toBeNull();
    expect(parseObjectKey(`tenant/${tenantId}/property/${propertyId}/../${fileId}.jpg`)).toBeNull();
  });

  it("rejects wrong segment count or labels", () => {
    expect(parseObjectKey(`tenant/${tenantId}/property/${propertyId}`)).toBeNull();
    expect(parseObjectKey(`org/${tenantId}/property/${propertyId}/${fileId}.jpg`)).toBeNull();
    expect(parseObjectKey(`tenant/${tenantId}/listing/${propertyId}/${fileId}.jpg`)).toBeNull();
  });

  it("rejects invalid uuid or extension", () => {
    expect(
      parseObjectKey(`tenant/not-a-uuid/property/${propertyId}/${fileId}.jpg`),
    ).toBeNull();
    expect(
      parseObjectKey(`tenant/${tenantId}/property/${propertyId}/${fileId}.gif`),
    ).toBeNull();
  });
});

describe("assertKeyBelongsToTenant", () => {
  const validKey = `tenant/${tenantId}/property/${propertyId}/${fileId}.png`;

  it("returns true when tenant matches parsed key", () => {
    expect(assertKeyBelongsToTenant(validKey, tenantId)).toBe(true);
  });

  it("returns false on tenant mismatch", () => {
    const otherTenant = "11111111-1111-4111-8111-111111111111";

    expect(assertKeyBelongsToTenant(validKey, otherTenant)).toBe(false);
  });

  it("returns false for invalid keys", () => {
    expect(assertKeyBelongsToTenant("invalid-key", tenantId)).toBe(false);
  });
});

describe("assertKeyMatchesTenantProperty", () => {
  const validKey = `tenant/${tenantId}/property/${propertyId}/${fileId}.png`;

  it("returns true when tenant and property match", () => {
    expect(assertKeyMatchesTenantProperty(validKey, tenantId, propertyId)).toBe(
      true,
    );
  });

  it("returns false on property mismatch", () => {
    const otherProperty = "11111111-1111-4111-8111-111111111111";

    expect(
      assertKeyMatchesTenantProperty(validKey, tenantId, otherProperty),
    ).toBe(false);
  });

  it("returns false on tenant mismatch", () => {
    const otherTenant = "22222222-2222-4222-8222-222222222222";

    expect(
      assertKeyMatchesTenantProperty(validKey, otherTenant, propertyId),
    ).toBe(false);
  });
});

describe("mimeTypeMatchesExtension", () => {
  it("matches mime type to extension", () => {
    expect(mimeTypeMatchesExtension("image/jpeg", "jpg")).toBe(true);
    expect(mimeTypeMatchesExtension("image/jpeg", "jpeg")).toBe(true);
    expect(mimeTypeMatchesExtension("image/png", "png")).toBe(true);
  });

  it("rejects mismatched mime and extension", () => {
    expect(mimeTypeMatchesExtension("image/png", "jpg")).toBe(false);
    expect(mimeTypeMatchesExtension("application/pdf", "jpg")).toBe(false);
  });
});
