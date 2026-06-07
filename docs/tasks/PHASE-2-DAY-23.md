# Phase 2 — Day 23: Properties list UI (task pack)

**Objective:** Polished properties list — table/cards, status filters, metrics row, shadcn components.

**Prerequisite:** Day 22 properties module shell.

**Branch:** `feat/phase-2-day-20-25`

**Out of scope (Day 23):** Create/edit detail page, map, photos.

---

## Execution order

| Task | Focus |
| ---- | ----- |
| **T1** | Status filter schema + URL searchParams |
| **T2** | `PropertiesTable` component |
| **T3** | Summary metrics cards (count by status) |
| **T4** | Responsive layout (table desktop, cards mobile) |
| **T5** | Manual UX pass + typecheck |

---

## T1 — Filters

**Owner chat prompt:**

> Implement Day 23 / T1: Status filter on `/properties?status=active`. Zod validate searchParams in Server Component page. Pass filter to query.

### Files

- `apps/web/src/modules/properties/schemas/list-filters.ts`
- `apps/web/src/app/(dashboard)/properties/page.tsx` (Server Component wrapper)

---

## T2 — Table component

**Owner chat prompt:**

> Implement Day 23 / T2: `PropertiesTable` — address, city/state, price formatted, status Badge, link to detail placeholder `#` or `/properties/[id]` stub.

### Files

- `apps/web/src/modules/properties/components/properties-table.tsx`

---

## T3 — Metrics row

**Owner chat prompt:**

> Implement Day 23 / T3: Row of metric cards above table — total, active, pending, sold (from list data or separate count query).

---

## Day 23 checklist

- [ ] Filter by status works via URL
- [ ] Table uses shadcn Badge, Table, tokens only
- [ ] Mobile-friendly layout
- [ ] No hardcoded colors

---

## Copy-paste prompt

```
Projeto: propai-os. Fase 2, Day 23.
Branch: feat/phase-2-day-20-25. Leia docs/tasks/PHASE-2-DAY-23.md.
Lista de properties com filtros, tabela shadcn e métricas.
```
