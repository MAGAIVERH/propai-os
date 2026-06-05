import { describe, expect, it } from "vitest";

import { mapPropertyRow, type PropertyRow } from "./map-property-row.js";
import {
  assertPropertyAccess,
  resolveListScope,
} from "./property-access.js";
import {
  decodePropertyCursor,
  encodePropertyCursor,
} from "./property-cursor.js";

const basePropertyRow: PropertyRow = {
  id: "11111111-1111-4111-8111-111111111111",
  tenantId: "22222222-2222-4222-8222-222222222222",
  title: "Lakeview Home",
  description: "Spacious family home",
  type: "single_family",
  status: "active",
  priceUsdCents: 450_000_00,
  rentOrSale: "sale",
  bedrooms: 3,
  bathrooms: "2.5",
  sqFt: 1800,
  yearBuilt: 2010,
  hoaFeeUsd: 150,
  addressLine1: "123 Main St",
  addressLine2: null,
  city: "Austin",
  state: "TX",
  zipCode: "78701",
  latitude: "30.2672000",
  longitude: "-97.7431000",
  createdBy: "user-agent-a",
  createdAt: new Date("2026-06-01T12:00:00.000Z"),
  updatedAt: new Date("2026-06-02T12:00:00.000Z"),
  softDeletedAt: null,
};

describe("resolveListScope", () => {
  it("returns assigned scope for agents", () => {
    expect(resolveListScope("agent")).toBe("assigned");
  });

  it("returns all scope for owners and managers", () => {
    expect(resolveListScope("owner")).toBe("all");
    expect(resolveListScope("manager")).toBe("all");
  });
});

describe("assertPropertyAccess", () => {
  it("allows owner and manager for any non-deleted property", () => {
    expect(assertPropertyAccess("owner", "user-owner", basePropertyRow)).toEqual(
      { allowed: true, scope: "all" },
    );
    expect(
      assertPropertyAccess("manager", "user-manager", basePropertyRow),
    ).toEqual({ allowed: true, scope: "all" });
  });

  it("allows agent only for properties they created", () => {
    expect(
      assertPropertyAccess("agent", "user-agent-a", basePropertyRow),
    ).toEqual({ allowed: true, scope: "assigned" });

    expect(
      assertPropertyAccess("agent", "user-agent-b", basePropertyRow),
    ).toEqual({ allowed: false, reason: "not_found" });
  });

  it("denies viewer with forbidden", () => {
    expect(assertPropertyAccess("viewer", "user-viewer", basePropertyRow)).toEqual(
      { allowed: false, reason: "forbidden" },
    );
  });

  it("returns not_found for missing or soft-deleted properties", () => {
    expect(assertPropertyAccess("owner", "user-owner", null)).toEqual({
      allowed: false,
      reason: "not_found",
    });

    expect(
      assertPropertyAccess("owner", "user-owner", {
        ...basePropertyRow,
        softDeletedAt: new Date("2026-06-03T12:00:00.000Z"),
      }),
    ).toEqual({ allowed: false, reason: "not_found" });
  });
});

describe("mapPropertyRow", () => {
  it("maps numeric fields and ISO datetimes for API responses", () => {
    const mapped = mapPropertyRow(basePropertyRow);

    expect(mapped.bathrooms).toBe("2.5");
    expect(mapped.latitude).toBeCloseTo(30.2672);
    expect(mapped.longitude).toBeCloseTo(-97.7431);
    expect(mapped.createdAt).toBe("2026-06-01T12:00:00.000Z");
    expect(mapped.updatedAt).toBe("2026-06-02T12:00:00.000Z");
    expect(mapped.softDeletedAt).toBeNull();
  });

  it("maps null geo coordinates to null numbers", () => {
    const mapped = mapPropertyRow({
      ...basePropertyRow,
      latitude: null,
      longitude: null,
    });

    expect(mapped.latitude).toBeNull();
    expect(mapped.longitude).toBeNull();
  });
});

describe("property cursor", () => {
  it("round-trips createdAt and id", () => {
    const cursor = {
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
      id: "11111111-1111-4111-8111-111111111111",
    };

    const encoded = encodePropertyCursor(cursor);
    const decoded = decodePropertyCursor(encoded);

    expect(decoded).toEqual(cursor);
  });

  it("returns null for invalid cursor values", () => {
    expect(decodePropertyCursor("invalid")).toBeNull();
    expect(decodePropertyCursor("not-a-date|")).toBeNull();
  });
});
