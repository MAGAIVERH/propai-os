# Phase 2 — Day 21: Property photos confirm API (task pack)

**Objective:** Persist uploaded images to `property_images` after presigned upload; audit trail on confirm.

**Prerequisite:** Day 18 presigned upload API + Day 20 dashboard shell.

**Branch:** `feat/phase-2-day-20-25`

**References:**
- [PHASE-2-PLAN.md](../PHASE-2-PLAN.md)
- [adr/005-object-storage-r2.md](../adr/005-object-storage-r2.md)
- Day 18 task pack: [PHASE-2-DAY-18.md](./PHASE-2-DAY-18.md)

**Out of scope (Day 21):** Web upload UI, gallery component, image processing.

---

## Execution order

| Task | Focus |
| ---- | ----- |
| **T1** | Zod schemas in `@propai/shared` for confirm payload |
| **T2** | `POST /v1/properties/:id/images/confirm` route |
| **T3** | Audit event `photo.uploaded` / `property_image.created` |
| **T4** | Integration tests + Insomnia/curl docs |
| **T5** | Extend `pnpm test:api` coverage |

---

## T1 — Shared contracts

**Owner chat prompt:**

> Implement Day 21 / T1: Zod schemas for image confirm request/response in `@propai/shared`. Fields: objectKey, mimeType, sizeBytes, sortOrder optional.

### Do

- [ ] `packages/shared/src/properties/image-confirm.ts` (or extend property module)
- [ ] Export types via `z.infer`
- [ ] Unit tests in shared package

### Done when

- `pnpm test:shared` green

---

## T2 — Confirm API route

**Owner chat prompt:**

> Implement Day 21 / T2: POST confirm endpoint under properties module. Validate tenant scope, property exists, object key prefix matches tenant/property. Insert `property_images` row.

### Do

- [ ] Route in `apps/api/src/modules/properties/`
- [ ] RBAC: `properties:write`
- [ ] RLS via `runInTenantContext`
- [ ] Reject keys outside `tenant/{id}/property/{id}/` pattern

### Done when

- curl confirm after presign creates DB row

---

## T3 — Audit logging

**Owner chat prompt:**

> Implement Day 21 / T3: Write audit event on image confirm using existing `writeAuditEvent` helper.

### Do

- [ ] Event type aligned with ADR 003
- [ ] Metadata: propertyId, imageId, objectKey (no secrets)

### Done when

- Audit row visible via `/v1/audit` or DB query

---

## T4 — Docs + manual QA

**Owner chat prompt:**

> Implement Day 21 / T4: Document confirm flow in docs/api/. Manual QA: presign → PUT to MinIO → confirm → GET property includes image.

### Files

- `docs/api/upload-confirm.md` (new)
- Update `docs/LOCAL-DEV.md`

---

## Day 21 checklist

```bash
pnpm test:shared && pnpm test:api
```

- [ ] Presign → upload → confirm → image in DB
- [ ] Cross-tenant key rejected
- [ ] Audit event written

---

## Copy-paste prompt

```
Projeto: propai-os. Fase 2, Day 21.
Branch: feat/phase-2-day-20-25. Leia docs/tasks/PHASE-2-DAY-21.md.
API confirm para property_images após presigned upload. Sem UI web ainda.
```
