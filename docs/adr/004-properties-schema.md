# ADR 004: Properties schema and RLS

**Status:** Accepted  
**Date:** 2026-06-05  
**Context:** Phase 2 Day 16 — core US real estate listing tables with tenant isolation (RLS).

---

## Decision

PropAI OS stores brokerage listings in PostgreSQL tables `properties`, `property_features`, and `property_images`. Tenant isolation follows [ADR 001](./001-rls-multi-tenancy.md):

| Table | RLS strategy |
| ----- | -------------- |
| `properties` | Direct `tenant_id` → `organization.id` (same pattern as `audit_logs`) |
| `property_features` | Parent-scoped: `EXISTS` subquery on `properties.tenant_id` |
| `property_images` | Parent-scoped: `EXISTS` subquery on `properties.tenant_id` |

Child tables **do not** denormalize `tenant_id` in v1. Deletes cascade from `properties` to children.

Migration: `packages/db/drizzle/0007_properties.sql`. Drizzle schema: `packages/db/src/schema/properties.ts`.

---

## Enums (v1)

| Enum | Values |
| ---- | ------ |
| `property_type` | `single_family`, `condo`, `townhouse`, `multi_family` |
| `property_status` | `draft`, `active`, `under_contract`, `sold`, `rented` (default `draft`) |
| `rent_or_sale` | `sale`, `rent` |

Display labels (en-US) belong in `@propai/shared` (Day 17+); the database stores snake_case enum values.

---

## Schema (v1)

### `properties`

US listing fields per [REQUIREMENTS.md](../REQUIREMENTS.md#us-property-fields-v1).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | `gen_random_uuid()` |
| `tenant_id` | `uuid` FK | → `organization.id`, `ON DELETE CASCADE` |
| `title` | `text` | Required |
| `description` | `text` | Nullable |
| `type` | `property_type` | Required |
| `status` | `property_status` | Default `draft` |
| `price_usd_cents` | `integer` | List price in **USD cents** (not float) |
| `rent_or_sale` | `rent_or_sale` | Listing intent |
| `bedrooms` | `integer` | ≥ 0 |
| `bathrooms` | `numeric(3,1)` | Supports half-baths (e.g. `2.5`) |
| `sq_ft` | `integer` | Living area (US customary) |
| `year_built` | `integer` | Nullable |
| `hoa_fee_usd` | `integer` | Nullable; **whole USD per month** (not cents) |
| `address_line1` | `text` | Required |
| `address_line2` | `text` | Nullable |
| `city` | `text` | Required |
| `state` | `text` | 2-letter US code |
| `zip_code` | `text` | Required |
| `latitude` | `numeric(10,7)` | Nullable, WGS84 |
| `longitude` | `numeric(10,7)` | Nullable, WGS84 |
| `created_by` | `text` FK nullable | → `user.id`, `ON DELETE SET NULL` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Default `now()` |
| `soft_deleted_at` | `timestamptz` | Nullable; v1 uses soft delete only |
| `embedding` | `vector(1536)` | Nullable; pgvector semantic search (Phase 3 Day 29); OpenAI `text-embedding-3-small` |
| `embedding_updated_at` | `timestamptz` | Nullable; last successful embedding write |

Migration: `packages/db/drizzle/0008_property_embeddings.sql`. Requires PostgreSQL **pgvector** extension (`CREATE EXTENSION vector`). On Neon, enable pgvector in the console before migrate.

**Indexes:**

| Index | Columns | Rationale |
| ----- | ------- | --------- |
| `properties_tenant_status_idx` | `(tenant_id, status)` | Dashboard filters by listing status within tenant |
| `properties_tenant_city_state_idx` | `(tenant_id, city, state)` | Marketplace / CRM location filters |
| `properties_geo_idx` | `(latitude, longitude)` | B-tree composite for map queries in v1 (PostGIS / GiST deferred) |

### `property_features`

Key-value amenities (e.g. `pool` → `true`, `garage` → `2-car`).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `property_id` | `uuid` FK | → `properties.id`, `ON DELETE CASCADE` |
| `feature_key` | `text` | Required |
| `feature_value` | `text` | Required |
| `created_at` | `timestamptz` | Default `now()` |

**Indexes:** `(property_id)`; unique `(property_id, feature_key)` — one key per property in v1.

### `property_images`

Ordered photo metadata; binary objects live in R2/S3 (Day 19+).

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `uuid` PK | |
| `property_id` | `uuid` FK | → `properties.id`, `ON DELETE CASCADE` |
| `storage_key` | `text` | R2/S3 object key |
| `sort_order` | `integer` | Default `0` |
| `is_primary` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | Default `now()` |

**Index:** `(property_id, sort_order)` for gallery ordering.

---

## Money and storage notes

| Field | Storage | Display |
| ----- | ------- | ------- |
| List price | `price_usd_cents` (integer) | Format as USD in query/API layer (e.g. `$1,250,000`) |
| HOA fee | `hoa_fee_usd` (integer, nullable) | Whole dollars per month; `null` when N/A |
| Photos | `property_images.storage_key` | Presigned URLs generated at API layer; no URLs in DB |

Never store list price as `float`/`numeric` dollars in v1.

---

## RLS

### `properties` (direct tenant_id)

```sql
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties FORCE ROW LEVEL SECURITY;

CREATE POLICY properties_tenant_isolation ON properties
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO propai_app;
```

### Child tables (parent-scoped)

```sql
CREATE POLICY property_features_tenant_isolation ON property_features
  AS PERMISSIVE FOR ALL TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_features.property_id
        AND p.tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_features.property_id
        AND p.tenant_id = nullif(current_setting('app.current_tenant', true), '')::uuid
    )
  );
```

Same `EXISTS` pattern for `property_images`. Runtime role: `propai_app`. App code sets `app.current_tenant` per transaction (`runInTenantContext`).

**Regression:** `pnpm db:rls-test` validates `properties`, `property_features`, and `property_images` (tenant A/B isolation, no context, cross-tenant read/insert).

---

## Explicitly deferred (not Day 16)

| Item | Target |
| ---- | ------ |
| `property_pricing_history` | v1.1 — price change audit trail |
| HNSW / IVFFlat index on `properties.embedding` | Day 31+ — semantic search query tuning |
| CRUD API `/v1/properties` | Day 18 |
| Zod DTOs in `@propai/shared` | Day 17 |
| R2 presigned upload flow | Days 19–21 |

---

## Consequences

### Positive

- Single migration delivers enums, tables, indexes, RLS, and `propai_app` grants.
- Parent-scoped RLS on children avoids redundant `tenant_id` and keeps one source of truth on `properties`.
- Cents + integer HOA aligns with foundation money-handling rules.

### Follow-ups

- Day 17: shared Zod schemas and display formatters.
- Day 18: CRUD API + RBAC (`properties:write`).
- Extend audit actions (`property.created`, etc.) when API lands.
- Consider GiST/PostGIS for geo if btree composite proves insufficient at scale.

---

## References

- `packages/db/src/schema/properties.ts`
- `packages/db/drizzle/0007_properties.sql`
- `packages/db/drizzle/0008_property_embeddings.sql`
- `packages/db/scripts/rls-poc-test.ts`
- [REQUIREMENTS.md — US property fields](../REQUIREMENTS.md#us-property-fields-v1)
- [PHASE-2-PLAN.md](../PHASE-2-PLAN.md)
- [ADR 001 — RLS multi-tenancy](./001-rls-multi-tenancy.md)
