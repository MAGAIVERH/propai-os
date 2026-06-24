import { randomUUID } from "node:crypto";

import {
  analyticsEvents,
  getDb,
  leadActivities,
  leads,
  pipelineStages,
  properties,
  propertyFeatures,
  propertyImages,
  runInTenantContext,
} from "@propai/db";
import {
  publicPropertyQuerySchema,
  submitInterestSchema,
  type PublicPropertyDetailResponse,
  type SubmitInterestResponse,
} from "@propai/shared";
import { and, asc, desc, eq, gte, isNull, lt, lte, or, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import {
  createNotifications,
  getTenantMemberUserIds,
} from "../notifications/create-notification.js";
import { publishTenantEvent } from "../realtime/bus.js";

import { apiError } from "../../lib/api-error.js";
import { mapLeadRow, type LeadRow } from "../../lib/map-lead-row.js";
import { mapPropertyRow, type PropertyRow } from "../../lib/map-property-row.js";
import { buildPublicImageUrl } from "../../lib/public-image-url.js";
import { consumePublicLeadRateLimit } from "../../lib/public-lead-rate-limit.js";
import {
  buildPublicPropertiesCacheKey,
  readPublicPropertiesCache,
  serializeListVariant,
  writePublicPropertiesCache,
  type CacheStatus,
} from "../../lib/public-properties-cache.js";
import { decodePropertyCursor, encodePropertyCursor } from "../../lib/property-cursor.js";

const propertySelectFields = {
  id: properties.id,
  tenantId: properties.tenantId,
  title: properties.title,
  description: properties.description,
  type: properties.type,
  status: properties.status,
  priceUsdCents: properties.priceUsdCents,
  rentOrSale: properties.rentOrSale,
  bedrooms: properties.bedrooms,
  bathrooms: properties.bathrooms,
  sqFt: properties.sqFt,
  yearBuilt: properties.yearBuilt,
  hoaFeeUsd: properties.hoaFeeUsd,
  addressLine1: properties.addressLine1,
  addressLine2: properties.addressLine2,
  city: properties.city,
  state: properties.state,
  zipCode: properties.zipCode,
  latitude: properties.latitude,
  longitude: properties.longitude,
  createdBy: properties.createdBy,
  createdAt: properties.createdAt,
  updatedAt: properties.updatedAt,
  softDeletedAt: properties.softDeletedAt,
} as const;

const leadSelectFields = {
  id: leads.id,
  tenantId: leads.tenantId,
  firstName: leads.firstName,
  lastName: leads.lastName,
  email: leads.email,
  phone: leads.phone,
  source: leads.source,
  assignedAgentId: leads.assignedAgentId,
  propertyId: leads.propertyId,
  stageId: leads.stageId,
  aiScore: leads.aiScore,
  notes: leads.notes,
  createdAt: leads.createdAt,
  updatedAt: leads.updatedAt,
} as const;

function buildPublicListFilters(
  query: z.infer<typeof publicPropertyQuerySchema>,
  decodedCursor: ReturnType<typeof decodePropertyCursor>,
): SQL | undefined {
  const conditions: SQL[] = [isNull(properties.softDeletedAt), eq(properties.status, "active")];

  if (query.rentOrSale) {
    conditions.push(eq(properties.rentOrSale, query.rentOrSale));
  }

  if (query.type) {
    conditions.push(eq(properties.type, query.type));
  }

  if (query.city) {
    conditions.push(sql`lower(${properties.city}) = lower(${query.city})`);
  }

  if (query.state) {
    conditions.push(eq(properties.state, query.state));
  }

  if (query.minPriceUsdCents !== undefined) {
    conditions.push(gte(properties.priceUsdCents, query.minPriceUsdCents));
  }

  if (query.maxPriceUsdCents !== undefined) {
    conditions.push(lte(properties.priceUsdCents, query.maxPriceUsdCents));
  }

  if (query.beds !== undefined) {
    conditions.push(gte(properties.bedrooms, query.beds));
  }

  if (decodedCursor) {
    conditions.push(
      or(
        lt(properties.createdAt, decodedCursor.createdAt),
        and(eq(properties.createdAt, decodedCursor.createdAt), lt(properties.id, decodedCursor.id)),
      )!,
    );
  }

  return and(...conditions);
}

/** Shared handler for `/public/interest` and `/public/leads`. */
async function handlePublicLead(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = submitInterestSchema.parse(request.body);

  // Honeypot — a filled `website` field means a bot. Pretend success so the
  // bot gets no signal, but create nothing.
  if (body.website) {
    return reply.status(201).send({ leadId: randomUUID() });
  }

  const rate = await consumePublicLeadRateLimit(request.ip);

  if (!rate.allowed) {
    reply.header("Retry-After", String(rate.retryAfterSeconds));
    return reply
      .status(429)
      .send(
        apiError(
          "Too Many Requests",
          "You've sent several requests recently. Please try again shortly.",
        ),
      );
  }

  const createdRow = await runInTenantContext(body.tenantId, async (tx) => {
    const stageRows = await tx
      .select({
        id: pipelineStages.id,
        sortOrder: pipelineStages.sortOrder,
      })
      .from(pipelineStages)
      .where(
        and(
          eq(pipelineStages.tenantId, body.tenantId),
          eq(pipelineStages.isWon, false),
          eq(pipelineStages.isLost, false),
        ),
      )
      .orderBy(asc(pipelineStages.sortOrder))
      .limit(1);

    const firstStage = stageRows[0] ?? null;

    const inserted = await tx
      .insert(leads)
      .values({
        tenantId: body.tenantId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone ?? null,
        source: "marketplace",
        propertyId: body.propertyId ?? null,
        stageId: firstStage?.id ?? null,
        notes: body.message ?? null,
      })
      .returning(leadSelectFields);

    const newLead = inserted[0];

    if (!newLead) {
      throw new Error("Failed to create lead.");
    }

    if (body.message) {
      await tx.insert(leadActivities).values({
        leadId: newLead.id,
        type: "note",
        content: body.message,
        createdBy: null,
      });
    }

    return newLead;
  });

  const lead = mapLeadRow(createdRow as LeadRow);

  // Live CRM update — the Kanban board subscribes to this tenant channel.
  publishTenantEvent(body.tenantId, {
    type: "lead:created",
    tenantId: body.tenantId,
    timestamp: new Date().toISOString(),
    lead,
  });

  // Notify the whole brokerage of the inbound marketplace lead.
  const memberUserIds = await getTenantMemberUserIds(body.tenantId);
  await createNotifications({
    tenantId: body.tenantId,
    userIds: memberUserIds,
    type: "lead_created",
    title: "New marketplace lead",
    body: `${body.firstName} ${body.lastName} submitted interest from the marketplace.`,
    leadId: lead.id,
  });

  const response: SubmitInterestResponse = { leadId: lead.id };
  return reply.status(201).send(response);
}

export async function registerPublicRoutes(app: FastifyInstance): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();

  // GET /public/properties
  zodApp.get(
    "/public/properties",
    {
      schema: {
        querystring: publicPropertyQuerySchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const query = publicPropertyQuerySchema.parse(request.query);
      const { tenantId, limit, cursor } = query;
      const decodedCursor = cursor ? decodePropertyCursor(cursor) : null;

      if (cursor && !decodedCursor) {
        return reply.status(400).send(apiError("Bad Request", "Invalid pagination cursor."));
      }

      const cacheKey = buildPublicPropertiesCacheKey(tenantId, serializeListVariant(query));
      const cached = await readPublicPropertiesCache<{
        properties: ReturnType<typeof mapPropertyRow>[];
        nextCursor: string | null;
      }>(cacheKey);

      if (cached) {
        reply.header("X-Cache", "HIT" satisfies CacheStatus);
        return reply.status(200).send(cached);
      }

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(propertySelectFields)
          .from(properties)
          .where(buildPublicListFilters(query, decodedCursor))
          .orderBy(desc(properties.createdAt), desc(properties.id))
          .limit(limit + 1);
      });

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const lastRow = pageRows.at(-1);
      const nextCursor =
        hasMore && lastRow
          ? encodePropertyCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
          : null;

      const payload = {
        properties: pageRows.map((r) => mapPropertyRow(r as PropertyRow)),
        nextCursor,
      };

      await writePublicPropertiesCache(cacheKey, payload);
      reply.header("X-Cache", "MISS" satisfies CacheStatus);
      return reply.status(200).send(payload);
    },
  );

  // GET /public/properties/:id — property + gallery + features
  zodApp.get(
    "/public/properties/:id",
    {
      schema: {
        params: z.object({ id: z.uuid() }),
      },
    },
    async (request, reply: FastifyReply) => {
      const { id } = z.object({ id: z.uuid() }).parse(request.params);

      const db = getDb();
      const rows = await db
        .select(propertySelectFields)
        .from(properties)
        .where(
          and(
            eq(properties.id, id),
            eq(properties.status, "active"),
            isNull(properties.softDeletedAt),
          ),
        )
        .limit(1);

      const row = rows[0];

      if (!row) {
        return reply.status(404).send(apiError("Not Found", "Property not found."));
      }

      const [imageRows, featureRows] = await Promise.all([
        db
          .select({
            id: propertyImages.id,
            storageKey: propertyImages.storageKey,
            isPrimary: propertyImages.isPrimary,
            sortOrder: propertyImages.sortOrder,
          })
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, id))
          .orderBy(desc(propertyImages.isPrimary), asc(propertyImages.sortOrder)),
        db
          .select({
            key: propertyFeatures.featureKey,
            value: propertyFeatures.featureValue,
          })
          .from(propertyFeatures)
          .where(eq(propertyFeatures.propertyId, id)),
      ]);

      const images = imageRows
        .map((img) => {
          const url = buildPublicImageUrl(img.storageKey);
          return url
            ? {
                id: img.id,
                url,
                isPrimary: img.isPrimary,
                sortOrder: img.sortOrder,
              }
            : null;
        })
        .filter((img): img is NonNullable<typeof img> => img !== null);

      const response: PublicPropertyDetailResponse = {
        property: mapPropertyRow(row as PropertyRow),
        images,
        features: featureRows,
      };

      return reply.status(200).send(response);
    },
  );

  // POST /public/leads — canonical lead capture (Day 49)
  zodApp.post("/public/leads", { schema: { body: submitInterestSchema } }, handlePublicLead);

  // POST /public/interest — kept as an alias for backwards compatibility
  zodApp.post("/public/interest", { schema: { body: submitInterestSchema } }, handlePublicLead);

  // POST /public/properties/:id/view — analytics beacon (Day 56). Fire-and-forget
  // from the marketplace detail page; records a property_view event.
  zodApp.post(
    "/public/properties/:id/view",
    { schema: { params: z.object({ id: z.uuid() }) } },
    async (request, reply: FastifyReply) => {
      const { id } = z.object({ id: z.uuid() }).parse(request.params);

      const db = getDb();
      const rows = await db
        .select({ tenantId: properties.tenantId })
        .from(properties)
        .where(
          and(
            eq(properties.id, id),
            eq(properties.status, "active"),
            isNull(properties.softDeletedAt),
          ),
        )
        .limit(1);

      const tenantId = rows[0]?.tenantId;

      if (tenantId) {
        try {
          await runInTenantContext(tenantId, async (tx) => {
            await tx.insert(analyticsEvents).values({
              tenantId,
              type: "property_view",
              propertyId: id,
            });
          });
        } catch {
          // Analytics is best-effort — never fail on a view beacon.
        }
      }

      return reply.status(204).send();
    },
  );
}
