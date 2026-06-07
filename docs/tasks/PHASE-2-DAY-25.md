# Phase 2 — Day 25: Map + photos UI (task pack)

**Objective:** Property detail with map (lat/lng), photo gallery, upload via presigned URL flow.

**Prerequisite:** Day 21 confirm API + Day 24 property forms.

**Branch:** `feat/phase-2-day-20-25`

**References:**
- [adr/005-object-storage-r2.md](../adr/005-object-storage-r2.md)

**Out of scope (Day 25):** Marketplace sync, AI vision, production map billing.

---

## Execution order

| Task | Focus |
| ---- | ----- |
| **T1** | Map component (env-based provider; degrade to address text) |
| **T2** | `PropertyMap` + lat/lng fields on form |
| **T3** | Presign + upload client flow |
| **T4** | `PropertyGallery` + confirm call |
| **T5** | Phase 2 checklist doc + demo script |

---

## T1 — Map provider

**Owner chat prompt:**

> Implement Day 25 / T1: Map component with `NEXT_PUBLIC_MAP_PROVIDER` env. Show pin when lat/lng set; fallback to formatted address. No hardcoded API keys in repo.

### Files

- `apps/web/src/modules/properties/components/property-map.tsx`
- `.env.example` — map provider vars

---

## T2 — Detail page

**Owner chat prompt:**

> Implement Day 25 / T2: `/properties/[id]` detail page — summary card, map section, gallery placeholder area.

### Files

- `apps/web/src/app/(dashboard)/properties/[id]/page.tsx`
- `apps/web/src/modules/properties/queries/get-property-by-id.ts`

---

## T3 — Upload flow

**Owner chat prompt:**

> Implement Day 25 / T3: Client upload — presign → PUT file → confirm API. Progress state, error toast, invalidate property query.

### Files

- `apps/web/src/modules/properties/queries/presign-property-image.ts`
- `apps/web/src/modules/properties/queries/confirm-property-image.ts`
- `apps/web/src/modules/properties/components/property-image-upload.tsx`

---

## T4 — Gallery

**Owner chat prompt:**

> Implement Day 25 / T4: `PropertyGallery` grid of images from property detail. shadcn Card, rounded-2xl, tokens only.

### Files

- `apps/web/src/modules/properties/components/property-gallery.tsx`

---

## T5 — Phase 2 wrap-up

**Owner chat prompt:**

> Implement Day 25 / T5: Create `docs/PHASE-2-CHECKLIST.md` with end-to-end demo steps (Docker → signup → create property → upload photo → view on map).

---

## Day 25 checklist

```bash
pnpm dev
```

- [ ] Property detail shows map or address fallback
- [ ] Upload photo via presigned URL + confirm
- [ ] Gallery displays images
- [ ] Full Phase 2 demo documented

---

## Copy-paste prompt

```
Projeto: propai-os. Fase 2, Day 25.
Branch: feat/phase-2-day-20-25. Leia docs/tasks/PHASE-2-DAY-25.md.
Mapa, galeria e upload presigned na página de detalhe do imóvel.
```
