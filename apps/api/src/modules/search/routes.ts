import {
  semanticSearchQuerySchema,
  semanticSearchResponseSchema,
  type SemanticSearchResultItem,
} from "@propai/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

import { isSemanticSearchEnabled } from "../../lib/ai-feature-flags.js";
import { apiError } from "../../lib/api-error.js";
import { AiProviderNotConfiguredError } from "../ai/ai-errors.js";
import { generatePropertyEmbedding } from "../ai/generate-property-embedding.js";
import { rankSearchResults, sortRankedRows } from "./queries/hybrid-rank.js";
import { runSemanticPropertySearch } from "./queries/semantic-property-search.js";

/** Multiplier for the candidate pool fetched before hybrid re-ranking. */
const CANDIDATE_POOL_MULTIPLIER = 3;
const MAX_CANDIDATE_POOL = 50;

function numericToNullableNumber(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function registerSearchRoutes(app: FastifyInstance): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();

  /**
   * GET /search/semantic
   *
   * Public endpoint — no auth required. tenantId scopes the search and is
   * enforced at the database level via RLS. Requires ENABLE_SEMANTIC_SEARCH=true.
   *
   * Example query: "Quiet neighborhood near a dog park with home office space"
   */
  zodApp.get(
    "/search/semantic",
    {
      schema: {
        querystring: semanticSearchQuerySchema,
        response: {
          200: semanticSearchResponseSchema,
        },
      },
    },
    async (request, reply: FastifyReply) => {
      if (!isSemanticSearchEnabled()) {
        return reply
          .status(503)
          .send(
            apiError(
              "Service Unavailable",
              "Semantic search is disabled. Set ENABLE_SEMANTIC_SEARCH=true to use this endpoint.",
            ),
          );
      }

      const query = semanticSearchQuerySchema.parse(request.query);

      let embedding: number[];

      try {
        embedding = await generatePropertyEmbedding(query.q);
      } catch (error) {
        if (error instanceof AiProviderNotConfiguredError) {
          return reply
            .status(503)
            .send(apiError("Service Unavailable", "AI provider is not configured."));
        }

        throw error;
      }

      // Fetch a wider candidate pool from pgvector, then re-rank with the
      // hybrid scorer (semantic + price + distance + recency) before slicing.
      const candidateLimit = Math.min(query.limit * CANDIDATE_POOL_MULTIPLIER, MAX_CANDIDATE_POOL);

      const rows = await runSemanticPropertySearch({
        tenantId: query.tenantId,
        embedding,
        limit: candidateLimit,
        beds: query.beds,
        city: query.city,
        state: query.state,
        minPriceUsdCents: query.minPriceUsdCents,
        maxPriceUsdCents: query.maxPriceUsdCents,
        type: query.type,
        rentOrSale: query.rentOrSale,
      });

      const ranked = rankSearchResults({
        rows,
        minPriceUsdCents: query.minPriceUsdCents,
        maxPriceUsdCents: query.maxPriceUsdCents,
      });

      const ordered = sortRankedRows(ranked, query.sort).slice(0, query.limit);

      const items: SemanticSearchResultItem[] = ordered.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.title,
        description: row.description,
        type: row.type as SemanticSearchResultItem["type"],
        status: row.status as SemanticSearchResultItem["status"],
        priceUsdCents: Number(row.priceUsdCents),
        rentOrSale: row.rentOrSale as SemanticSearchResultItem["rentOrSale"],
        bedrooms: Number(row.bedrooms),
        bathrooms: String(row.bathrooms),
        sqFt: Number(row.sqFt),
        yearBuilt: row.yearBuilt !== null ? Number(row.yearBuilt) : null,
        addressLine1: row.addressLine1,
        addressLine2: row.addressLine2,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        latitude: numericToNullableNumber(row.latitude),
        longitude: numericToNullableNumber(row.longitude),
        createdAt: row.createdAt.toISOString(),
        semanticScore: Number(row.semanticScore),
        relevanceScore: Number(row.hybridScore),
      }));

      return reply.status(200).send(
        semanticSearchResponseSchema.parse({
          items,
          query: query.q,
          total: items.length,
        }),
      );
    },
  );
}
