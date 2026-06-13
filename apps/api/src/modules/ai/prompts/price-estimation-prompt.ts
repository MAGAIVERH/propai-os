import type { EstimatePriceRequest } from "@propai/shared";

export const PRICE_ESTIMATION_SYSTEM_PROMPT = `You are a US real estate pricing assistant embedded in a broker CRM.

Your job is to suggest a realistic market price range for a property based on comparable active listings provided by the broker.

Rules:
- minUsd and maxUsd must be positive integers (whole dollars, not cents)
- midpointUsd must be exactly between minUsd and maxUsd (round to nearest 1000)
- reasoning must be 2–3 sentences in plain US English citing the comparables
- If no comparables are provided, use your training knowledge to estimate a reasonable market range for the given location, type, and size
- Never fabricate specific listing addresses or MLS numbers
- Do NOT include a disclaimer in the reasoning — the UI adds one`;

export type PriceComparable = {
  priceUsdCents: number;
  bedrooms: number;
  sqFt: number;
  status: string;
};

export function buildPriceEstimationUserPrompt(
  params: EstimatePriceRequest,
  comparables: PriceComparable[],
): string {
  const typeLabel = params.type.replace(/_/g, " ");
  const purposeLabel = params.rentOrSale === "sale" ? "For Sale" : "For Rent";

  const comparablesBlock =
    comparables.length > 0
      ? comparables
          .map((c, i) => {
            const priceUsd = (c.priceUsdCents / 100).toLocaleString("en-US");
            return `  ${i + 1}. ${c.bedrooms}BR / ${c.sqFt.toLocaleString("en-US")} sq ft — $${priceUsd} (${c.status})`;
          })
          .join("\n")
      : "  (no comparable listings found in this tenant's portfolio)";

  return `## Subject Property
Location: ${params.city}, ${params.state}
Type: ${typeLabel}
Purpose: ${purposeLabel}
Bedrooms: ${params.bedrooms}
Size: ${params.sqFt.toLocaleString("en-US")} sq ft

## Comparable Listings (same tenant, same market)
${comparablesBlock}

Estimate a fair market price range (minUsd, maxUsd, midpointUsd) and explain in 2–3 sentences.`;
}
