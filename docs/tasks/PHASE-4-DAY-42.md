# Phase 4 · Day 42 — Public Marketplace

## Tasks

- [x] **T1** — `packages/shared/src/marketplace/public.ts`
  - `publicPropertyQuerySchema` — tenantId + pagination + filter params (rentOrSale, type, city, state, price range, beds)
  - `submitInterestSchema` — tenantId, firstName, lastName, email, phone?, message?, propertyId?
  - `submitInterestResponseSchema` — `{ leadId: string }`

- [x] **T2** — `packages/shared/src/index.ts`
  - Export all marketplace public schemas and types

- [x] **T3** — `apps/api/src/modules/public/routes.ts`
  - `GET /public/properties` — `runInTenantContext(tenantId, ...)` with cursor pagination + filters; active-only
  - `GET /public/properties/:id` — `getDb()` admin fetch with explicit `status='active' AND softDeletedAt IS NULL` guards
  - `POST /public/interest` — `runInTenantContext(tenantId, ...)`: find first non-won/non-lost stage → insert lead with `source='marketplace'` → if message, insert `leadActivity type='note'` → return `{ leadId }`

- [x] **T4** — `apps/api/src/modules/public/index.ts`
  - `registerPublicModule(app)` wiring

- [x] **T5** — `apps/api/src/app.ts`
  - `await registerPublicModule(app)` added before `tenantContextPlugin` (same pattern as `registerSearchModule`)

- [x] **T6** — `apps/marketplace/.env`
  - `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MARKETPLACE_TENANT_ID`

- [x] **T7** — `apps/marketplace/src/lib/env.ts`
  - `getApiUrl()` — server-side origin with fallback
  - `getDefaultTenantId()` — optional brokerage scope from env

- [x] **T8** — `apps/marketplace/src/lib/api.ts`
  - `fetchPublicProperties(tenantId, params?)` — SSR fetch with 60s revalidation
  - `fetchPublicProperty(id)` — SSR fetch, returns null on 404

- [x] **T9** — `apps/marketplace/src/app/page.tsx`
  - SSR server component; reads `NEXT_PUBLIC_MARKETPLACE_TENANT_ID`
  - Renders `<PropertyCard>` grid (3 cols desktop); handles empty, error, no-tenant-id states

- [x] **T10** — `apps/marketplace/src/app/properties/[id]/page.tsx`
  - SSR server component; `await params`; calls `fetchPublicProperty(id)`; `notFound()` on null
  - Property details sidebar + `<InterestForm>` in aside column

- [x] **T11** — `apps/marketplace/src/components/interest-form.tsx`
  - `"use client"` controlled form with `useState`
  - POSTs to `${NEXT_PUBLIC_API_URL}/public/interest`
  - Success state replaces form; error state shows API message

- [x] **T12** — `pnpm typecheck` (shared, api, marketplace) → ✅
