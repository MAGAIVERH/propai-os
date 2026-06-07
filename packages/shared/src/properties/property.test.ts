import { describe, expect, it } from "vitest";

import {
  createPropertySchema,
  propertyListQuerySchema,
  updatePropertySchema,
} from "./property.js";

const validMinimalCreate = {
  title: "Lakeview Home",
  type: "single_family" as const,
  priceUsdCents: 450_000_00,
  rentOrSale: "sale" as const,
  bedrooms: 3,
  bathrooms: "2.5",
  sqFt: 1800,
  addressLine1: "123 Main St",
  city: "Austin",
  state: "tx",
  zipCode: "78701",
};

describe("createPropertySchema", () => {
  it("accepts a valid minimal create payload", () => {
    const result = createPropertySchema.safeParse(validMinimalCreate);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state).toBe("TX");
    }
  });

  it("rejects an invalid state code", () => {
    const result = createPropertySchema.safeParse({
      ...validMinimalCreate,
      state: "Texas",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid ZIP code", () => {
    const result = createPropertySchema.safeParse({
      ...validMinimalCreate,
      zipCode: "7870",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid bathrooms format", () => {
    const result = createPropertySchema.safeParse({
      ...validMinimalCreate,
      bathrooms: "2.25",
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-positive priceUsdCents", () => {
    const result = createPropertySchema.safeParse({
      ...validMinimalCreate,
      priceUsdCents: 0,
    });

    expect(result.success).toBe(false);
  });

  it("accepts ZIP+4 format", () => {
    const result = createPropertySchema.safeParse({
      ...validMinimalCreate,
      zipCode: "78701-1234",
    });

    expect(result.success).toBe(true);
  });
});

describe("updatePropertySchema", () => {
  it("accepts an empty partial update object", () => {
    const result = updatePropertySchema.safeParse({});

    expect(result.success).toBe(true);
  });
});

describe("propertyListQuerySchema", () => {
  it("defaults limit to 20 when omitted", () => {
    const result = propertyListQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string limit from query params", () => {
    const result = propertyListQuerySchema.safeParse({ limit: "50" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });
});
