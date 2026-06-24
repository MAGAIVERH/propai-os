import {
  estimatePriceResponseSchema,
  type EstimatePriceRequest,
  type EstimatePriceResponse,
} from "@propai/shared";
import { properties, runInTenantContext } from "@propai/db";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { generateObject } from "ai";
import { ZodError } from "zod";

import { getOpenAiProvider } from "../../lib/embedding-provider.js";
import { AiAnalysisParseError, AiProviderNotConfiguredError } from "./ai-errors.js";
import {
  buildPriceEstimationUserPrompt,
  PRICE_ESTIMATION_SYSTEM_PROMPT,
  type PriceComparable,
} from "./prompts/price-estimation-prompt.js";

function getPricingModelId(): string {
  const configured = process.env.OPENAI_PRICING_MODEL?.trim();
  return configured ?? "gpt-4o-mini";
}

const llmOutputSchema = estimatePriceResponseSchema.omit({ comparablesCount: true });

async function fetchComparables(
  tenantId: string,
  params: EstimatePriceRequest,
): Promise<PriceComparable[]> {
  return runInTenantContext(tenantId, async (tx) => {
    const filters = [
      eq(properties.city, params.city),
      eq(properties.state, params.state),
      eq(properties.type, params.type),
      eq(properties.rentOrSale, params.rentOrSale),
      isNull(properties.softDeletedAt),
      sql`${properties.priceUsdCents} IS NOT NULL`,
    ];

    if (params.excludePropertyId) {
      filters.push(ne(properties.id, params.excludePropertyId));
    }

    const rows = await tx
      .select({
        priceUsdCents: properties.priceUsdCents,
        bedrooms: properties.bedrooms,
        sqFt: properties.sqFt,
        status: properties.status,
      })
      .from(properties)
      .where(and(...filters))
      .orderBy(sql`${properties.createdAt} DESC`)
      .limit(10);

    return rows;
  });
}

export async function estimatePriceWithAI(
  tenantId: string,
  params: EstimatePriceRequest,
): Promise<EstimatePriceResponse> {
  const provider = getOpenAiProvider();

  if (!provider) {
    throw new AiProviderNotConfiguredError("OpenAI API is not configured.");
  }

  const comparables = await fetchComparables(tenantId, params);
  const modelId = getPricingModelId();
  const userPrompt = buildPriceEstimationUserPrompt(params, comparables);

  try {
    const { object } = await generateObject({
      model: provider(modelId),
      schema: llmOutputSchema,
      system: PRICE_ESTIMATION_SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    return estimatePriceResponseSchema.parse({
      ...object,
      comparablesCount: comparables.length,
    });
  } catch (error) {
    if (error instanceof AiProviderNotConfiguredError) {
      throw error;
    }

    if (error instanceof ZodError) {
      throw new AiAnalysisParseError("Price estimation response could not be validated.");
    }

    if (error instanceof AiAnalysisParseError) {
      throw error;
    }

    throw new AiAnalysisParseError("Price estimation failed unexpectedly.");
  }
}
