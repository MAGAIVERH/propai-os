import { describe, expect, it } from "vitest";

import { slugifyOrganizationName } from "./organization-slug.js";

describe("slugifyOrganizationName", () => {
  it("lowercases and hyphenates a plain name", () => {
    expect(slugifyOrganizationName("Acme Realty")).toBe("acme-realty");
  });

  it("strips diacritics (accents)", () => {
    expect(slugifyOrganizationName("São Paulo Imóveis")).toBe(
      "sao-paulo-imoveis",
    );
  });

  it("collapses runs of non-alphanumerics into a single hyphen", () => {
    expect(slugifyOrganizationName("Blue   &   Co. --- Realty")).toBe(
      "blue-co-realty",
    );
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyOrganizationName("  !Prime Homes!  ")).toBe("prime-homes");
  });

  it("falls back to 'brokerage' when nothing usable remains", () => {
    expect(slugifyOrganizationName("")).toBe("brokerage");
    expect(slugifyOrganizationName("   ")).toBe("brokerage");
    expect(slugifyOrganizationName("***")).toBe("brokerage");
  });

  it("truncates to at most 64 characters", () => {
    const long = "a".repeat(100);
    const result = slugifyOrganizationName(long);

    expect(result).toHaveLength(64);
  });

  it("keeps existing digits", () => {
    expect(slugifyOrganizationName("Century 21 Group")).toBe(
      "century-21-group",
    );
  });
});
