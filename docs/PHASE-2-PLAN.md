# Phase 2 Plan — Properties (Days 16–25)

**Status:** In progress (Day 17+)  
**Prerequisite:** Phase 1 foundation signed off — [BACKEND-FOUNDATION-CHECKLIST.md](./BACKEND-FOUNDATION-CHECKLIST.md) (tag `foundation-v0.1.0`)  
**Product context:** [REQUIREMENTS.md](./REQUIREMENTS.md) — US property fields, photos, marketplace linkage (later phases)

Phase 2 delivers the **Properties** domain: schema, tenant-scoped CRUD API, object storage for media, dashboard UI (list, detail, map, photo upload). No CRM pipeline or marketplace lead flow in this phase.

---

## Foundation dependencies (do not skip)

| Foundation capability | Phase 2 usage |
| --------------------- | ------------- |
| RLS + `runInTenantContext` | Every `properties` / `property_photos` row scoped by `tenant_id` → `organization.id` |
| `resolveTenantId` + `/v1/*` middleware | All property routes inherit session tenant |
| `@propai/shared` Zod + permissions | Property DTOs, `properties:write`, role gates on mutations |
| Audit logs | `property.created`, `property.updated`, `photo.uploaded`, etc. |
| Local dev stack | Same Docker + `pnpm dev` for API + web iteration |
| ADR 001–003 patterns | New migration per table + RLS policy; ADR update if storage/auth pattern changes |

**Do not invert:** schema + RLS migrations **before** API routes; API **before** web UI that mutates data; presigned upload contract **before** UI upload component.

---

## Week overview

| Week | Days | Theme | Outcome |
| ---- | ---- | ----- | ------- |
| 1 | 16–18 | Data model + API | `properties` in DB with RLS; CRUD `/v1/properties`; tests green |
| 2 | 19–21 | Media + storage | R2 (or S3-compatible) presigned uploads; `property_photos`; audit on upload |
| 3 | 22–25 | Dashboard UI | Properties shell in `apps/web`, list/detail, map pin, photo gallery |

---

## Day-by-day roadmap

| Day | Focus | Deliverables | Verification |
| --- | ----- | ------------ | ------------ |
| **[x] 16** | Properties schema | Drizzle tables: `properties` (US fields: address, city, state, ZIP, sq ft, price cents, status enum), `property_features`, `property_images`, `tenant_id`, indexes; migration + RLS policies | `pnpm db:migrate`; extend `pnpm db:rls-test` — task pack: [tasks/PHASE-2-DAY-16.md](./tasks/PHASE-2-DAY-16.md) |
| **17** | Shared contracts | Zod create/update/list schemas in `@propai/shared`; types exported to API + web | `pnpm typecheck`; unit tests on schema edge cases |
| **18** | CRUD API | `modules/properties/` — `GET/POST/PATCH/DELETE /v1/properties`, list filters, `select` explicit; permission `properties:write` | `pnpm test:api` — isolation + RBAC cases |
| **19** | Object storage setup | R2 bucket config, env vars, presigned PUT/GET helper in `apps/api` | Manual curl upload; no secrets in repo |
| **20** | Property photos schema | `property_photos` (order, url/key, property FK, tenant_id + RLS) | Migration + RLS test |
| **21** | Photo API | `POST /v1/properties/:id/photos` (presign + confirm), reorder, delete; audit events | Integration tests + audit log assertions |
| **22** | Web module shell | `src/modules/properties/` — layout, nav entry, empty list page (Server Component + queries stub) | `pnpm dev` — route loads |
| **23** | Properties list UI | Table/cards, filters (status), shadcn components, tokens only | Manual UX pass |
| **24** | Property detail + form | Create/edit with React Hook Form + Zod; Server Actions or API client per project convention | Create → list → edit flow |
| **25** | Map + photos UI | Map component (lat/lng from property), gallery, upload via presigned URL; Phase 2 checklist doc | End-to-end demo on local Docker |

---

## Technical notes

### RLS

Follow [ADR 001](./adr/001-rls-multi-tenancy.md): `tenant_id UUID NOT NULL` → `organization.id`, `ENABLE` + `FORCE ROW LEVEL SECURITY`, policy on `app.current_tenant`. Register new tables in `pnpm db:rls-test`.

### API layout

Mirror Day 12 scaffold ([api-scaffold.md](./api/api-scaffold.md)):

```
apps/api/src/modules/properties/
├── index.ts
├── routes.ts
├── schemas/
└── (queries if needed — prefer @propai/db helpers)
```

### Web layout

Mirror project rules (`src/modules/properties/`): `queries/`, `actions/`, `components/`, `schemas/`, `types/`.

### Out of scope (Phase 2)

- CRM leads, pipeline Kanban, WebSocket realtime
- Marketplace public listing sync
- AI vision / embeddings (Phase 3+)
- MLS/IDX, billing, production Neon sign-off

---

## Risks & mitigations

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| RLS omitted on new table | Cross-tenant data leak | Migration checklist + extend RLS test script |
| Price/area stored as floats | Money/rounding bugs | Store USD in **cents** (integer); sq ft as integer |
| Upload without tenant scope | Wrong bucket prefix | Key pattern `org/{organizationId}/properties/{id}/...` |
| UI before API | Blocked integration | Stick to day order 16→18 before 22+ |
| Map provider keys missing | Broken map day | Use env-based provider; degrade to address text |

---

## Phase 2 kickoff checklist

After Day 15 tag:

- [ ] Branch from `main` (e.g. `feat/phase-2-properties`)
- [ ] Confirm [BACKEND-FOUNDATION-CHECKLIST.md](./BACKEND-FOUNDATION-CHECKLIST.md) 100% `[x]`
- [ ] Read [architecture.md — RLS section](./architecture.md#multi-tenancy--row-level-security-foundation-v01)
- [ ] `pnpm docker:up && pnpm db:migrate && pnpm test:api`
- [ ] Start Day 16 — properties schema migration

---

## Related documents

| Document | Purpose |
| -------- | ------- |
| [architecture.md](./architecture.md) | RLS data plane (Foundation v0.1) |
| [adr/001-rls-multi-tenancy.md](./adr/001-rls-multi-tenancy.md) | RLS policy pattern |
| [adr/002-identity-organizations-roles.md](./adr/002-identity-organizations-roles.md) | Roles + `properties:write` |
| [adr/003-audit-logs.md](./adr/003-audit-logs.md) | Audit on mutations |
| [LOCAL-DEV.md](./LOCAL-DEV.md) | Dev environment |
| [REQUIREMENTS.md](./REQUIREMENTS.md) | US property fields & MVP |
