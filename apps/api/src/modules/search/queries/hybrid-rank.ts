import type { SearchSort } from "@propai/shared";

import type { SemanticSearchRow } from "./semantic-property-search.js";

/**
 * Hybrid ranking weights (Day 52). Documented in
 * `docs/adr/004-search-ranking.md`.
 */
export const RANK_WEIGHTS = {
  semantic: 0.4,
  price: 0.2,
  distance: 0.2,
  recency: 0.2,
} as const;

/** Recency half-life: a listing scores ~0.5 at this age. */
const RECENCY_HALF_LIFE_DAYS = 30;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type RankInput = {
  rows: SemanticSearchRow[];
  minPriceUsdCents?: number;
  maxPriceUsdCents?: number;
  now?: Date;
};

export type RankedRow = SemanticSearchRow & {
  semanticScore: number;
  /** Composite hybrid score (0–1). */
  hybridScore: number;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Price fit relative to the searcher's budget.
 *  - No bounds → neutral 0.7 (we can't judge fit).
 *  - Within the range → 1.0 (closer to the cheaper end scores marginally
 *    higher, since buyers usually prefer value).
 *  - Outside the range → decays with relative overshoot/undershoot.
 */
function priceScore(priceUsdCents: number, min?: number, max?: number): number {
  if (min === undefined && max === undefined) {
    return 0.7;
  }

  const lo = min ?? 0;
  const hi = max ?? Number.POSITIVE_INFINITY;

  if (priceUsdCents >= lo && priceUsdCents <= hi) {
    if (hi === Number.POSITIVE_INFINITY) return 1;
    const span = hi - lo || 1;
    // 1.0 at the low end → 0.85 at the high end.
    return clamp01(1 - ((priceUsdCents - lo) / span) * 0.15);
  }

  // Outside the budget: penalize by how far out it is.
  const reference = priceUsdCents < lo ? lo : hi;
  const overshoot = Math.abs(priceUsdCents - reference) / (reference || 1);
  return clamp01(0.6 - overshoot);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

function parseCoord(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Geographic centrality: rows nearer the centroid of the candidate set score
 * higher. Without an explicit search coordinate this rewards the dominant
 * cluster of results (e.g. a city center). Rows lacking coordinates get a
 * neutral 0.5.
 */
function buildDistanceScorer(rows: SemanticSearchRow[]): (row: SemanticSearchRow) => number {
  const lats: number[] = [];
  const lngs: number[] = [];

  for (const row of rows) {
    const lat = parseCoord(row.latitude);
    const lng = parseCoord(row.longitude);
    if (lat !== null && lng !== null) {
      lats.push(lat);
      lngs.push(lng);
    }
  }

  if (lats.length === 0) {
    return () => 0.5;
  }

  const centerLat = median(lats);
  const centerLng = median(lngs);

  // Spread used to normalize distance into 0–1.
  const distances = rows.map((row) => {
    const lat = parseCoord(row.latitude);
    const lng = parseCoord(row.longitude);
    if (lat === null || lng === null) return null;
    return Math.hypot(lat - centerLat, lng - centerLng);
  });

  const maxDistance = Math.max(...distances.filter((d): d is number => d !== null), 0);

  return (row: SemanticSearchRow) => {
    const lat = parseCoord(row.latitude);
    const lng = parseCoord(row.longitude);
    if (lat === null || lng === null) return 0.5;
    if (maxDistance === 0) return 1;
    const distance = Math.hypot(lat - centerLat, lng - centerLng);
    return clamp01(1 - distance / maxDistance);
  };
}

function recencyScore(createdAt: Date, now: Date): number {
  const ageDays = Math.max(0, (now.getTime() - createdAt.getTime()) / MS_PER_DAY);
  return clamp01(Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS));
}

/**
 * Computes the composite hybrid score for each candidate row.
 * Weights: semantic 40% + price 20% + distance 20% + recency 20%.
 */
export function rankSearchResults(input: RankInput): RankedRow[] {
  const now = input.now ?? new Date();
  const distanceScorer = buildDistanceScorer(input.rows);

  return input.rows.map((row) => {
    const semantic = clamp01(row.relevanceScore);
    const price = priceScore(row.priceUsdCents, input.minPriceUsdCents, input.maxPriceUsdCents);
    const distance = distanceScorer(row);
    const recency = recencyScore(row.createdAt, now);

    const hybridScore = clamp01(
      semantic * RANK_WEIGHTS.semantic +
        price * RANK_WEIGHTS.price +
        distance * RANK_WEIGHTS.distance +
        recency * RANK_WEIGHTS.recency,
    );

    return { ...row, semanticScore: semantic, hybridScore };
  });
}

/** Applies the requested sort to ranked rows (stable). */
export function sortRankedRows(rows: RankedRow[], sort: SearchSort): RankedRow[] {
  const copy = [...rows];

  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.priceUsdCents - b.priceUsdCents);
    case "newest":
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case "relevance":
    default:
      return copy.sort((a, b) => b.hybridScore - a.hybridScore);
  }
}
