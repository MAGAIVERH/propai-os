import { properties, runInTenantContext, TenantContextRequiredError } from "@propai/db";
import {
  propertyCreateResponseSchema,
  propertyListQuerySchema,
  type PropertyListResponse,
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
} from "../../lib/property-access.js";
import {
  decodePropertyCursor,
  encodePropertyCursor,
} from "../../lib/property-cursor.js";
import { createRequirePermissionHook } from "../../plugins/require-member-role.js";

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

      if (!access.allowed) {
        if (access.reason === "forbidden") {
          return reply
            .status(403)
            .send(apiError("Forbidden", "Insufficient permissions for this action."));
        }

        return reply
          .status(404)
          .send(apiError("Not Found", "Property not found."));
      }

      return reply.status(200).send({
        property: mapPropertyRow(row),
      });
    },
  );
}
