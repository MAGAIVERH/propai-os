import { runInTenantContext } from "@propai/db";
import { sql, type SQL } from "drizzle-orm";

export type SemanticSearchParams = {
  tenantId: string;
  embedding: number[];
  limit: number;
  beds?: number;
  city?: string;
  state?: string;
  minPriceUsdCents?: number;
  maxPriceUsdCents?: number;
  type?: string;
  rentOrSale?: string;
};

export type SemanticSearchRow = {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priceUsdCents: number;
  rentOrSale: string;
  bedrooms: number;
  bathrooms: string;
  sqFt: number;
  yearBuilt: number | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  latitude: string | null;
  longitude: string | null;
  relevanceScore: number;
};

/**
 * Runs a hybrid semantic property search inside a tenant-scoped RLS context.
 *
 * Hard filters (city, state, beds, price, type, rentOrSale) narrow the result set;
 * cosine distance to the query embedding (`<=>`) provides the ranking signal.
 */
export async function runSemanticPropertySearch(
  params: SemanticSearchParams,
): Promise<SemanticSearchRow[]> {
  const vectorLiteral = `[${params.embedding.join(",")}]`;

  return runInTenantContext(params.tenantId, async (tx) => {
    const filters: SQL[] = [
      sql`status = 'active'`,
      sql`soft_deleted_at IS NULL`,
      sql`embedding IS NOT NULL`,
    ];

    if (params.city !== undefined) {
      filters.push(sql`LOWER(city) = LOWER(${params.city})`);
    }
    if (params.state !== undefined) {
      filters.push(sql`UPPER(state) = UPPER(${params.state})`);
    }
    if (params.beds !== undefined) {
      filters.push(sql`bedrooms >= ${params.beds}`);
    }
    if (params.minPriceUsdCents !== undefined) {
      filters.push(sql`price_usd_cents >= ${params.minPriceUsdCents}`);
    }
    if (params.maxPriceUsdCents !== undefined) {
      filters.push(sql`price_usd_cents <= ${params.maxPriceUsdCents}`);
    }
    if (params.type !== undefined) {
      filters.push(sql`type = ${params.type}::property_type`);
    }
    if (params.rentOrSale !== undefined) {
      filters.push(sql`rent_or_sale = ${params.rentOrSale}::rent_or_sale`);
    }

    const whereClause = sql.join(filters, sql` AND `);

    const rows = await tx.execute<SemanticSearchRow>(sql`
      SELECT
        id::text,
        tenant_id::text       AS "tenantId",
        title,
        description,
        type::text,
        status::text,
        price_usd_cents       AS "priceUsdCents",
        rent_or_sale::text    AS "rentOrSale",
        bedrooms,
        bathrooms::text,
        sq_ft                 AS "sqFt",
        year_built            AS "yearBuilt",
        address_line1         AS "addressLine1",
        address_line2         AS "addressLine2",
        city,
        state,
        zip_code              AS "zipCode",
        latitude::text,
        longitude::text,
        (1 - (embedding <=> ${vectorLiteral}::vector))::float AS "relevanceScore"
      FROM properties
      WHERE ${whereClause}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${params.limit}
    `);

    return Array.from(rows);
  });
}
