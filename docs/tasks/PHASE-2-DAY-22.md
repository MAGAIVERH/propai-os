# Phase 2 — Day 22: Properties module shell (task pack)

**Objective:** Replace properties empty state with real module structure — queries, types, and list page wired to API.

**Prerequisite:** Day 20 navigation + Day 17 properties CRUD API.

**Branch:** `feat/phase-2-day-20-25`

**References:**
- [PHASE-2-PLAN.md](../PHASE-2-PLAN.md)
- Project rules: `src/modules/properties/`

**Out of scope (Day 22):** Filters, create/edit forms, photo upload UI.

---

## Execution order

| Task | Focus |
| ---- | ----- |
| **T1** | `modules/properties/types/` + `schemas/` |
| **T2** | `lib/api-client` + `getProperties` query |
| **T3** | `usePropertiesQuery` hook (TanStack Query) |
| **T4** | Properties page — loading, error, empty, table skeleton |
| **T5** | Docs update in `docs/web/` |

---

## T1 — Module scaffolding

**Owner chat prompt:**

> Implement Day 22 / T1: Create `src/modules/properties/` with types and Zod schemas mirroring `@propai/shared` property DTOs.

### Files

- `apps/web/src/modules/properties/types/property.ts`
- `apps/web/src/modules/properties/schemas/` (if needed for filters later)

---

## T2 — Query function

**Owner chat prompt:**

> Implement Day 22 / T2: `getProperties()` calling `GET /v1/properties` with credentials. Transform cents → display in query layer.

### Files

- `apps/web/src/modules/properties/queries/get-properties.ts`
- Extend `apps/web/src/lib/api-client.ts` if needed

---

## T3 — Client hook

**Owner chat prompt:**

> Implement Day 22 / T3: `usePropertiesQuery` with stable queryKey. Used by properties page client wrapper.

### Files

- `apps/web/src/modules/properties/hooks/use-properties.ts`

---

## T4 — Properties page UI

**Owner chat prompt:**

> Implement Day 22 / T4: Update `/properties` page — ModuleHeader, loading skeleton, error toast boundary, empty vs populated table shell (shadcn Table, tokens only).

### Done when

- `pnpm dev` — `/properties` loads data from API when properties exist

---

## Day 22 checklist

- [ ] Module folder structure matches project rules
- [ ] List renders API data
- [ ] Empty state when no properties
- [ ] `pnpm --filter @propai/web typecheck` green

---

## Copy-paste prompt

```
Projeto: propai-os. Fase 2, Day 22.
Branch: feat/phase-2-day-20-25. Leia docs/tasks/PHASE-2-DAY-22.md.
Módulo properties em apps/web — query GET /v1/properties, página lista básica.
```
