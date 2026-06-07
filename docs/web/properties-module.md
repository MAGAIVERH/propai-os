# Properties module — `apps/web` (Day 22–23)

Dashboard list page wired to `GET /v1/properties` via TanStack Query. Day 22 added the module shell; Day 23 adds status filters, metrics cards, and responsive table/cards layout.

**Prerequisite:** Day 19 dashboard auth + Day 17 properties API (`pnpm test:api`).

**Related:** [dashboard-auth.md](./dashboard-auth.md) · [tasks/PHASE-2-DAY-22.md](../tasks/PHASE-2-DAY-22.md) · [tasks/PHASE-2-DAY-23.md](../tasks/PHASE-2-DAY-23.md)

---

## Architecture

| Layer | Path | Role |
| ----- | ---- | ---- |
| Types | `apps/web/src/modules/properties/types/property.ts` | `PropertyListItem` with `priceDisplay` and PT labels |
| Schemas | `apps/web/src/modules/properties/schemas/` | `property-list.ts` (API query) · `list-filters.ts` (URL `?status=` filter) |
| Query | `apps/web/src/modules/properties/queries/get-properties.ts` | `getProperties()` — `apiFetch` + Zod parse + cents → display |
| Hook | `apps/web/src/modules/properties/hooks/use-properties.ts` | `usePropertiesQuery` with stable `PROPERTIES_QUERY_KEY` |
| UI | `apps/web/src/modules/properties/components/` | Table, skeleton, page content |
| Page | `apps/web/src/app/(dashboard)/properties/page.tsx` | Server Component — validates `searchParams`, passes filters to client |
| Detail stub | `apps/web/src/app/(dashboard)/properties/[id]/page.tsx` | Placeholder until Day 24+ |

Data flow:

1. Server page parses `?status=` via `parsePropertiesListFilters`.
2. Client calls `usePropertiesQuery` twice — unfiltered for metrics, filtered for list.
3. `getProperties()` fetches `GET /v1/properties` with `credentials: "include"`.
4. Response validated with `propertyListResponseSchema` (`@propai/shared`).
5. UI: metrics row → status filter buttons → table (desktop) or cards (mobile).

---

## Manual QA — local

**Setup:** `pnpm docker:up && pnpm db:migrate && pnpm dev`

1. Sign up or sign in at http://localhost:3000/signup
2. Open http://localhost:3000/properties
3. **Empty state** — no listings yet → dashed card “Nenhum imóvel cadastrado”
4. **With data** — create a property via API, then refresh `/properties`:

```bash
# After brokerage sign-up (save cookies.txt from auth-flow)
curl -s -b cookies.txt -X POST "http://localhost:3333/v1/properties" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Austin Ranch Home",
    "type": "single_family",
    "priceUsdCents": 45000000,
    "rentOrSale": "sale",
    "bedrooms": 3,
    "bathrooms": "2.5",
    "sqFt": 2100,
    "addressLine1": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zipCode": "78701"
  }'
```

5. Reload `/properties` — metrics row, table with address/price/status, links to `/properties/[id]`
6. Filter: http://localhost:3000/properties?status=active — list updates; metrics stay global
7. Resize to mobile width — cards layout replaces table
8. Stop API → reload page → error toast (Sonner)

**Typecheck:** `pnpm --filter @propai/web typecheck`

---

## Out of scope (Day 23)

- Pagination cursor UI
- Create / edit forms (Day 24)
- Photo upload gallery (Day 25)
- Full property detail page (stub only at `/properties/[id]`)

---

## Key source files

| File | Role |
| ---- | ---- |
| `apps/web/src/lib/api-client.ts` | Credentialed `apiFetch` |
| `apps/web/src/modules/properties/queries/get-properties.ts` | API list fetch + transform |
| `apps/web/src/modules/properties/hooks/use-properties.ts` | TanStack Query hook |
| `apps/web/src/modules/properties/components/properties-page-content.tsx` | Loading / empty / error / table |
| `packages/shared/src/properties/property.ts` | Shared DTOs and Zod schemas |
