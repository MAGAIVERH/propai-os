import { beforeEach, describe, expect, it, vi } from "vitest";

import * as db from "@propai/db";

import { resolvePropertyForUpload } from "./resolve-property-for-upload.js";

vi.mock("@propai/db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@propai/db")>();

  return {
    ...actual,
    runInTenantContext: vi.fn(),
  };
});

const tenantId = "550e8400-e29b-41d4-a716-446655440000";
const propertyId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const baseProperty = {
  id: propertyId,
  tenantId,
  createdBy: "user-agent-a",
  softDeletedAt: null,
};

describe("resolvePropertyForUpload", () => {
  beforeEach(() => {
    vi.mocked(db.runInTenantContext).mockReset();
  });

  it("returns property for owner when row exists", async () => {
    vi.mocked(db.runInTenantContext).mockImplementation(async (_tenantId, fn) => {
      return fn({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [baseProperty],
            }),
          }),
        }),
      } as never);
    });

    const result = await resolvePropertyForUpload(
      tenantId,
      propertyId,
      "owner",
      "user-owner",
    );

    expect(result).toEqual(baseProperty);
  });

  it("returns null when property is missing", async () => {
    vi.mocked(db.runInTenantContext).mockImplementation(async (_tenantId, fn) => {
      return fn({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
      } as never);
    });

    const result = await resolvePropertyForUpload(
      tenantId,
      propertyId,
      "owner",
      "user-owner",
    );

    expect(result).toBeNull();
  });

  it("returns null when agent does not own the property", async () => {
    vi.mocked(db.runInTenantContext).mockImplementation(async (_tenantId, fn) => {
      return fn({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [baseProperty],
            }),
          }),
        }),
      } as never);
    });

    const result = await resolvePropertyForUpload(
      tenantId,
      propertyId,
      "agent",
      "user-agent-b",
    );

    expect(result).toBeNull();
  });

  it("returns null for viewer role", async () => {
    vi.mocked(db.runInTenantContext).mockImplementation(async (_tenantId, fn) => {
      return fn({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [baseProperty],
            }),
          }),
        }),
      } as never);
    });

    const result = await resolvePropertyForUpload(
      tenantId,
      propertyId,
      "viewer",
      "user-viewer",
    );

    expect(result).toBeNull();
  });
});
