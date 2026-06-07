# Phase 2 — Day 24: Property detail + form (task pack)

**Objective:** Create and edit properties via React Hook Form + Zod + API client mutations.

**Prerequisite:** Day 23 list UI.

**Branch:** `feat/phase-2-day-20-25`

**Out of scope (Day 24):** Map pin, photo gallery upload.

---

## Execution order

| Task | Focus |
| ---- | ----- |
| **T1** | `createPropertySchema` / `updatePropertySchema` in module |
| **T2** | API mutations: `createProperty`, `updateProperty` in queries or actions |
| **T3** | `PropertyForm` client component (RHF + shadcn Form) |
| **T4** | Pages: `/properties/new`, `/properties/[id]/edit` |
| **T5** | E2E flow: create → list → edit |

---

## T1 — Schemas

**Owner chat prompt:**

> Implement Day 24 / T1: Zod schemas for create/edit mirroring `@propai/shared`. Price input in dollars, convert to cents on submit.

### Files

- `apps/web/src/modules/properties/schemas/create-property.ts`
- `apps/web/src/modules/properties/schemas/update-property.ts`

---

## T2 — Mutations

**Owner chat prompt:**

> Implement Day 24 / T2: Client mutation functions POST/PATCH `/v1/properties`. Invalidate `properties` query on success. Toast feedback.

### Files

- `apps/web/src/modules/properties/queries/create-property.ts`
- `apps/web/src/modules/properties/queries/update-property.ts`

---

## T3 — Property form

**Owner chat prompt:**

> Implement Day 24 / T3: `PropertyForm` — address, city, state, ZIP, sq ft, price, status Select. useTransition + Sonner. Follow project form rules.

### Files

- `apps/web/src/modules/properties/components/property-form.tsx`

---

## T4 — Routes

**Owner chat prompt:**

> Implement Day 24 / T4: Add routes under `(dashboard)/properties/`. Detail page read-only summary stub optional.

### Files

- `apps/web/src/app/(dashboard)/properties/new/page.tsx`
- `apps/web/src/app/(dashboard)/properties/[id]/edit/page.tsx`

---

## Day 24 checklist

- [ ] Create property → appears in list
- [ ] Edit property → changes persist
- [ ] Forms use RHF + Zod + shadcn Form
- [ ] `pnpm --filter @propai/web typecheck` green

---

## Copy-paste prompt

```
Projeto: propai-os. Fase 2, Day 24.
Branch: feat/phase-2-day-20-25. Leia docs/tasks/PHASE-2-DAY-24.md.
Formulário create/edit property com React Hook Form + API PATCH/POST.
```
