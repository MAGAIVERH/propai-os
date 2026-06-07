# Properties module — `apps/web` (Day 22)

Dashboard list page wired to `GET /v1/properties` via TanStack Query. Replaces the Day 20 empty-state placeholder with loading, error, empty, and table states.

**Prerequisite:** Day 19 dashboard auth + Day 17 properties API (`pnpm test:api`).

**Related:** [dashboard-auth.md](./dashboard-auth.md) · [tasks/PHASE-2-DAY-22.md](../tasks/PHASE-2-DAY-22.md)

---

## Architecture

| Layer | Path | Role |
| ----- | ---- | ---- |
| Types | `apps/web/src/modules/properties/types/property.ts` | `PropertyListItem` with `priceDisplay` and PT labels |
| Schemas | `apps/web/src/modules/properties/schemas/property-list.ts` | Re-exports `propertyListQuerySchema` from `@propai/shared` (filters in Day 23+) |
| Query | `apps/web/src/modules/properties/queries/get-properties.ts` | `getProperties()` — `apiFetch` + Zod parse + cents → display |
| Hook | `apps/web/src/modules/properties/hooks/use-properties.ts` | `usePropertiesQuery` with stable `PROPERTIES_QUERY_KEY` |
| UI | `apps/web/src/modules/properties/components/` | Table, skeleton, page content |
| Page | `apps/web/src/app/(dashboard)/properties/page.tsx` | Renders `PropertiesPageContent` |

Data flow:

1. Client component calls `usePropertiesQuery()`.
2. `getProperties()` fetches `GET /v1/properties` with `credentials: "include"`.
3. Response validated with `propertyListResponseSchema` (`@propai/shared`).
4. Each row mapped to `PropertyListItem` (`formatPriceUsdCents`, status/type labels in PT).
5. Page shows skeleton → table or empty state; errors surface via Sonner toast.

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

5. Reload `/properties` — table shows title, location, type, formatted price, status badge
6. Stop API → reload page → error toast (Sonner)

**Typecheck:** `pnpm --filter @propai/web typecheck`

---

## Out of scope (Day 22)

- Filters and pagination UI (Day 23+)
- Create / edit forms (Day 24)
- Photo upload gallery (Day 25)
- Property detail page (`/properties/[id]`)

---

## Key source files

| File | Role |
| ---- | ---- |
| `apps/web/src/lib/api-client.ts` | Credentialed `apiFetch` |
| `apps/web/src/modules/properties/queries/get-properties.ts` | API list fetch + transform |
| `apps/web/src/modules/properties/hooks/use-properties.ts` | TanStack Query hook |
| `apps/web/src/modules/properties/components/properties-page-content.tsx` | Loading / empty / error / table |
| `packages/shared/src/properties/property.ts` | Shared DTOs and Zod schemas |
