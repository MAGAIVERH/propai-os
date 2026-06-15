import {
  getDb,
  leadActivities,
  leads,
  pipelineStages,
  properties,
  runInTenantContext,
} from "@propai/db";
import {
  publicPropertyQuerySchema,
  submitInterestSchema,
  type SubmitInterestResponse,
} from "@propai/shared";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  isNull,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { FastifyInstance, FastifyReply } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { apiError } from "../../lib/api-error.js";
import { mapPropertyRow, type PropertyRow } from "../../lib/map-property-row.js";
import {
  decodePropertyCursor,
  encodePropertyCursor,
} from "../../lib/property-cursor.js";

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

function buildPublicListFilters(
  query: z.infer<typeof publicPropertyQuerySchema>,
  decodedCursor: ReturnType<typeof decodePropertyCursor>,
): SQL | undefined {
  const conditions: SQL[] = [
    isNull(properties.softDeletedAt),
    eq(properties.status, "active"),
  ];

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
        and(
          eq(properties.createdAt, decodedCursor.createdAt),
          lt(properties.id, decodedCursor.id),
        ),
      )!,
    );
  }

  return and(...conditions);
}

export async function registerPublicRoutes(
  app: FastifyInstance,
): Promise<void> {
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
        return reply
          .status(400)
          .send(apiError("Bad Request", "Invalid pagination cursor."));
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

      return reply.status(200).send({
        properties: pageRows.map((r) => mapPropertyRow(r as PropertyRow)),
        nextCursor,
      });
    },
  );

  // GET /public/properties/:id
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

      return reply.status(200).send({ property: mapPropertyRow(row as PropertyRow) });
    },
  );

  // POST /public/interest
  zodApp.post(
    "/public/interest",
    {
      schema: {
        body: submitInterestSchema,
      },
    },
    async (request, reply: FastifyReply) => {
      const body = submitInterestSchema.parse(request.body);

      const leadId = await runInTenantContext(body.tenantId, async (tx) => {
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
          .returning({ id: leads.id });

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

        return newLead.id;
      });

      const response: SubmitInterestResponse = { leadId };
      return reply.status(201).send(response);
    },
  );
}
