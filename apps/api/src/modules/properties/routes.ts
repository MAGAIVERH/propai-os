import { properties, runInTenantContext, TenantContextRequiredError } from "@propai/db";
import {
  createPropertySchema,
  propertyCreateResponseSchema,
  propertyListQuerySchema,
  updatePropertySchema,
  type PropertyListResponse,
  type UpdatePropertyInput,
} from "@propai/shared";
import {
  and,
  desc,
  eq,
  gte,
  isNull,
  lte,
  lt,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { apiError } from "../../lib/api-error.js";
import { mapPropertyRow, type PropertyRow } from "../../lib/map-property-row.js";
import {
  assertPropertyAccess,
  resolveListScope,
  type PropertyAccessResult,
} from "../../lib/property-access.js";
import {
  decodePropertyCursor,
  encodePropertyCursor,
} from "../../lib/property-cursor.js";
import { invalidatePublicPropertiesCache } from "../../lib/public-properties-cache.js";
import { checkListingLimit } from "../billing/feature-gate.js";
import { writeAuditEventSafe } from "../../lib/write-audit-event.js";
import { MOCK_SESSION_DEFAULT_USER_ID } from "../auth/session.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";
import { enqueuePropertyEmbeddingJobIfEnabled } from "../ai/enqueue-property-embedding.js";

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

const propertyIdParamsSchema = z.object({
  id: z.uuid(),
});

function requireTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new TenantContextRequiredError();
  }

  return request.tenantId;
}

function requireSessionUserId(request: FastifyRequest): string {
  const userId = request.session?.user.id;

  if (!userId) {
    throw new TenantContextRequiredError();
  }

  return userId;
}

function requireMemberRole(request: FastifyRequest) {
  if (!request.memberRole) {
    throw new Error("Member role is required after permission check.");
  }

  return request.memberRole;
}

function resolveActorId(request: FastifyRequest): string | null {
  const sessionUserId = request.session?.user.id ?? null;

  if (
    process.env.NODE_ENV === "test" &&
    sessionUserId === MOCK_SESSION_DEFAULT_USER_ID
  ) {
    return null;
  }

  return sessionUserId;
}

function sendPropertyAccessFailure(
  reply: FastifyReply,
  access: PropertyAccessResult,
): boolean {
  if (access.allowed) {
    return false;
  }

  if (access.reason === "forbidden") {
    void reply
      .status(403)
      .send(apiError("Forbidden", "Insufficient permissions for this action."));
    return true;
  }

  void reply.status(404).send(apiError("Not Found", "Property not found."));
  return true;
}

function toOptionalNumericString(value: number | undefined): string | undefined {
  return value !== undefined ? String(value) : undefined;
}

function buildPropertyUpdateSet(body: UpdatePropertyInput): {
  updatedAt: Date;
  title?: string;
  description?: string;
  type?: PropertyRow["type"];
  status?: PropertyRow["status"];
  priceUsdCents?: number;
  rentOrSale?: PropertyRow["rentOrSale"];
  bedrooms?: number;
  bathrooms?: string;
  sqFt?: number;
  yearBuilt?: number;
  hoaFeeUsd?: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
} {
  const set = {
    updatedAt: new Date(),
  } as ReturnType<typeof buildPropertyUpdateSet>;

  if (body.title !== undefined) set.title = body.title;
  if (body.description !== undefined) set.description = body.description;
  if (body.type !== undefined) set.type = body.type;
  if (body.status !== undefined) set.status = body.status;
  if (body.priceUsdCents !== undefined) set.priceUsdCents = body.priceUsdCents;
  if (body.rentOrSale !== undefined) set.rentOrSale = body.rentOrSale;
  if (body.bedrooms !== undefined) set.bedrooms = body.bedrooms;
  if (body.bathrooms !== undefined) set.bathrooms = body.bathrooms;
  if (body.sqFt !== undefined) set.sqFt = body.sqFt;
  if (body.yearBuilt !== undefined) set.yearBuilt = body.yearBuilt;
  if (body.hoaFeeUsd !== undefined) set.hoaFeeUsd = body.hoaFeeUsd;
  if (body.addressLine1 !== undefined) set.addressLine1 = body.addressLine1;
  if (body.addressLine2 !== undefined) set.addressLine2 = body.addressLine2;
  if (body.city !== undefined) set.city = body.city;
  if (body.state !== undefined) set.state = body.state;
  if (body.zipCode !== undefined) set.zipCode = body.zipCode;
  if (body.latitude !== undefined) set.latitude = String(body.latitude);
  if (body.longitude !== undefined) set.longitude = String(body.longitude);

  return set;
}

function listChangedFields(body: UpdatePropertyInput): string[] {
  return (Object.keys(body) as (keyof UpdatePropertyInput)[]).filter(
    (key) => body[key] !== undefined,
  );
}

function shouldEnqueuePropertyEmbeddingAfterPatch(
  existing: PropertyRow,
  updated: PropertyRow,
  body: UpdatePropertyInput,
): boolean {
  if (updated.status !== "active" || updated.softDeletedAt) {
    return false;
  }

  const publishedNow =
    existing.status !== "active" && updated.status === "active";

  const reindexActive =
    existing.status === "active" &&
    (body.title !== undefined || body.description !== undefined);

  return publishedNow || reindexActive;
}

function buildListFilters(
  request: FastifyRequest,
  decodedCursor: ReturnType<typeof decodePropertyCursor>,
): SQL | undefined {
  const query = propertyListQuerySchema.parse(request.query);
  const role = requireMemberRole(request);
  const userId = requireSessionUserId(request);
  const conditions: SQL[] = [isNull(properties.softDeletedAt)];

  if (query.status) {
    conditions.push(eq(properties.status, query.status));
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

  if (resolveListScope(role) === "assigned") {
    conditions.push(eq(properties.createdBy, userId));
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

export async function registerPropertiesRoutes(
  app: FastifyInstance,
): Promise<void> {
  const zodApp = app.withTypeProvider<ZodTypeProvider>();
  const requirePropertiesWrite = createRequirePermissionHook("properties:write");

  zodApp.get(
    "/properties",
    {
      schema: {
        querystring: propertyListQuerySchema,
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { limit, cursor } = propertyListQuerySchema.parse(request.query);
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
          .where(buildListFilters(request, decodedCursor))
          .orderBy(desc(properties.createdAt), desc(properties.id))
          .limit(limit + 1);
      });

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const items = pageRows.map((row: PropertyRow) => mapPropertyRow(row));
      const lastRow = pageRows.at(-1);
      const nextCursor =
        hasMore && lastRow
          ? encodePropertyCursor({
              createdAt: lastRow.createdAt,
              id: lastRow.id,
            })
          : null;

      const payload: PropertyListResponse = {
        items,
        nextCursor,
      };

      return reply.status(200).send(payload);
    },
  );

  zodApp.get(
    "/properties/:id",
    {
      schema: {
        params: propertyIdParamsSchema,
        response: {
          200: propertyCreateResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = propertyIdParamsSchema.parse(request.params);
      const role = requireMemberRole(request);
      const userId = requireSessionUserId(request);

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(propertySelectFields)
          .from(properties)
          .where(eq(properties.id, id))
          .limit(1);
      });

      const row = rows[0];
      const access = assertPropertyAccess(role, userId, row);

      if (sendPropertyAccessFailure(reply, access)) {
        return;
      }

      return reply.status(200).send({
        property: mapPropertyRow(row),
      });
    },
  );

  zodApp.post(
    "/properties",
    {
      schema: {
        body: createPropertySchema,
        response: {
          201: propertyCreateResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const userId = requireSessionUserId(request);
      const body = createPropertySchema.parse(request.body);

      // Feature gate: Free plan caps active listings (Day 60).
      if ((body.status ?? "draft") === "active") {
        const check = await checkListingLimit(tenantId);
        if (!check.allowed) {
          return reply
            .status(402)
            .send(
              apiError(
                "Payment Required",
                `Your plan allows up to ${check.limit} active listings. Upgrade to Pro to publish more.`,
              ),
            );
        }
      }

      const rows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .insert(properties)
          .values({
            tenantId,
            createdBy: userId,
            title: body.title,
            description: body.description,
            type: body.type,
            status: body.status ?? "draft",
            priceUsdCents: body.priceUsdCents,
            rentOrSale: body.rentOrSale,
            bedrooms: body.bedrooms,
            bathrooms: body.bathrooms,
            sqFt: body.sqFt,
            yearBuilt: body.yearBuilt,
            hoaFeeUsd: body.hoaFeeUsd,
            addressLine1: body.addressLine1,
            addressLine2: body.addressLine2,
            city: body.city,
            state: body.state,
            zipCode: body.zipCode,
            latitude: toOptionalNumericString(body.latitude),
            longitude: toOptionalNumericString(body.longitude),
          })
          .returning(propertySelectFields);
      });

      const created = rows[0];

      if (!created) {
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to create property."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId: resolveActorId(request),
        action: "property.created",
        entityType: "property",
        entityId: created.id,
        metadata: { title: created.title, status: created.status },
        ip: request.ip,
      });

      if (created.status === "active") {
        await enqueuePropertyEmbeddingJobIfEnabled(tenantId, created.id);
      }

      // Public marketplace grid is cached — drop stale pages on new inventory.
      await invalidatePublicPropertiesCache(tenantId);

      return reply.status(201).send({
        property: mapPropertyRow(created),
      });
    },
  );

  zodApp.patch(
    "/properties/:id",
    {
      schema: {
        params: propertyIdParamsSchema,
        body: updatePropertySchema,
        response: {
          200: propertyCreateResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = propertyIdParamsSchema.parse(request.params);
      const body = updatePropertySchema.parse(request.body);
      const role = requireMemberRole(request);
      const userId = requireSessionUserId(request);

      const existingRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(propertySelectFields)
          .from(properties)
          .where(eq(properties.id, id))
          .limit(1);
      });

      const existing = existingRows[0];
      const access = assertPropertyAccess(role, userId, existing);

      if (sendPropertyAccessFailure(reply, access)) {
        return;
      }

      // Feature gate: block publishing a draft to active over the plan limit.
      if (
        body.status === "active" &&
        existing &&
        existing.status !== "active"
      ) {
        const check = await checkListingLimit(tenantId);
        if (!check.allowed) {
          return reply
            .status(402)
            .send(
              apiError(
                "Payment Required",
                `Your plan allows up to ${check.limit} active listings. Upgrade to Pro to publish more.`,
              ),
            );
        }
      }

      const updatedRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .update(properties)
          .set(buildPropertyUpdateSet(body))
          .where(eq(properties.id, id))
          .returning(propertySelectFields);
      });

      const updated = updatedRows[0];

      if (!updated) {
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to update property."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId: resolveActorId(request),
        action: "property.updated",
        entityType: "property",
        entityId: updated.id,
        metadata: { changedFields: listChangedFields(body) },
        ip: request.ip,
      });

      if (shouldEnqueuePropertyEmbeddingAfterPatch(existing, updated, body)) {
        await enqueuePropertyEmbeddingJobIfEnabled(tenantId, updated.id);
      }

      await invalidatePublicPropertiesCache(tenantId);

      return reply.status(200).send({
        property: mapPropertyRow(updated),
      });
    },
  );

  zodApp.delete(
    "/properties/:id",
    {
      schema: {
        params: propertyIdParamsSchema,
        response: {
          200: propertyCreateResponseSchema,
        },
      },
      preHandler: requirePropertiesWrite,
    },
    async (request, reply: FastifyReply) => {
      const tenantId = requireTenantId(request);
      const { id } = propertyIdParamsSchema.parse(request.params);
      const role = requireMemberRole(request);
      const userId = requireSessionUserId(request);

      const existingRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .select(propertySelectFields)
          .from(properties)
          .where(eq(properties.id, id))
          .limit(1);
      });

      const existing = existingRows[0];
      const access = assertPropertyAccess(role, userId, existing);

      if (sendPropertyAccessFailure(reply, access)) {
        return;
      }

      const now = new Date();
      const deletedRows = await runInTenantContext(tenantId, async (tx) => {
        return tx
          .update(properties)
          .set({
            softDeletedAt: now,
            updatedAt: now,
          })
          .where(eq(properties.id, id))
          .returning(propertySelectFields);
      });

      const deleted = deletedRows[0];

      if (!deleted) {
        return reply
          .status(500)
          .send(apiError("Internal Server Error", "Failed to delete property."));
      }

      await writeAuditEventSafe({
        tenantId,
        actorId: resolveActorId(request),
        action: "property.deleted",
        entityType: "property",
        entityId: deleted.id,
        metadata: { title: deleted.title },
        ip: request.ip,
      });

      await invalidatePublicPropertiesCache(tenantId);

      return reply.status(200).send({
        property: mapPropertyRow(deleted),
      });
    },
  );
}
