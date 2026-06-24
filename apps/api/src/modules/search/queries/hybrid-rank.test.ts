import { describe, expect, it } from "vitest";

import { RANK_WEIGHTS, rankSearchResults, sortRankedRows } from "./hybrid-rank.js";
import type { SemanticSearchRow } from "./semantic-property-search.js";

function row(overrides: Partial<SemanticSearchRow> = {}): SemanticSearchRow {
  return {
    id: overrides.id ?? "00000000-0000-0000-0000-000000000001",
    tenantId: "11111111-1111-1111-1111-111111111111",
    title: "Test Home",
    description: null,
    type: "single_family",
    status: "active",
    priceUsdCents: 50_000_000,
    rentOrSale: "sale",
    bedrooms: 3,
    bathrooms: "2",
    sqFt: 1800,
    yearBuilt: 2010,
    addressLine1: "1 Main St",
    addressLine2: null,
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    latitude: "30.2672",
    longitude: "-97.7431",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    relevanceScore: 0.8,
    ...overrides,
  };
}

describe("rankSearchResults", () => {
  it("weights sum to 1.0", () => {
    const total =
      RANK_WEIGHTS.semantic + RANK_WEIGHTS.price + RANK_WEIGHTS.distance + RANK_WEIGHTS.recency;
    expect(total).toBeCloseTo(1, 10);
  });

  it("produces a composite score in [0,1]", () => {
    const [ranked] = rankSearchResults({ rows: [row()] });
    expect(ranked!.hybridScore).toBeGreaterThanOrEqual(0);
    expect(ranked!.hybridScore).toBeLessThanOrEqual(1);
    expect(ranked!.semanticScore).toBeCloseTo(0.8, 5);
  });

  it("ranks a stronger semantic match above a weaker one, all else equal", () => {
    const strong = row({ id: "a", relevanceScore: 0.95 });
    const weak = row({ id: "b", relevanceScore: 0.2 });
    const ranked = sortRankedRows(rankSearchResults({ rows: [weak, strong] }), "relevance");
    expect(ranked[0]!.id).toBe("a");
  });

  it("rewards recency: a newer listing outranks an old one at equal semantics", () => {
    const now = new Date("2026-06-24T00:00:00.000Z");
    const fresh = row({ id: "new", createdAt: new Date("2026-06-20T00:00:00.000Z") });
    const stale = row({ id: "old", createdAt: new Date("2024-01-01T00:00:00.000Z") });
    const ranked = sortRankedRows(rankSearchResults({ rows: [stale, fresh], now }), "relevance");
    expect(ranked[0]!.id).toBe("new");
  });

  it("rewards in-budget price over out-of-budget price", () => {
    const inBudget = row({ id: "in", priceUsdCents: 40_000_000 });
    const overBudget = row({ id: "over", priceUsdCents: 90_000_000 });
    const ranked = sortRankedRows(
      rankSearchResults({
        rows: [overBudget, inBudget],
        minPriceUsdCents: 30_000_000,
        maxPriceUsdCents: 50_000_000,
      }),
      "relevance",
    );
    expect(ranked[0]!.id).toBe("in");
  });
});

describe("sortRankedRows", () => {
  const rows = rankSearchResults({
    rows: [
      row({ id: "cheap", priceUsdCents: 10_000_000, createdAt: new Date("2026-01-01") }),
      row({ id: "pricey", priceUsdCents: 90_000_000, createdAt: new Date("2026-06-01") }),
    ],
  });

  it("price_asc orders cheapest first", () => {
    const sorted = sortRankedRows(rows, "price_asc");
    expect(sorted[0]!.id).toBe("cheap");
  });

  it("newest orders most recent first", () => {
    const sorted = sortRankedRows(rows, "newest");
    expect(sorted[0]!.id).toBe("pricey");
  });
});
