# Phase 4 · Day 39 — GSAP FLIP Animations on Pipeline

## Tasks

- [x] **T1** — Install `gsap` and `@gsap/react` in `@propai/web`

- [x] **T2** — Reduced-motion hook `apps/web/src/hooks/use-reduced-motion.ts`
  - `usePrefersReducedMotion()` — reads `(prefers-reduced-motion: reduce)` media query
  - Reactive: updates when system preference changes

- [x] **T3** — Kanban card `apps/web/src/modules/crm/components/kanban-card.tsx`
  - Added `data-flip-id={lead.id}` to root div for GSAP Flip targeting

- [x] **T4** — Kanban column `apps/web/src/modules/crm/components/kanban-column.tsx`
  - Added `data-column-id={stage.id}` for GSAP querySelector targeting
  - Added `isWonCelebrating` prop — applies `border-emerald-400/60 bg-emerald-50/40` highlight

- [x] **T5** — Kanban board `apps/web/src/modules/crm/components/kanban-board.tsx`
  - `gsap.registerPlugin(Flip)` guarded by `typeof window !== "undefined"`
  - `handleDragEnd`: captures `Flip.getState("[data-flip-id]")` before `moveLead()`
  - Double `requestAnimationFrame` after mutation so GSAP reads post-React DOM
  - `Flip.from(state, { duration: 0.35, ease: "power2.out", stagger: 0.03, absolute: true })`
  - Won celebration: `gsap.timeline()` scale pulse (1 → 1.025 → 1 elastic) on the Won column
  - `setCelebratingStageId` drives the `isWonCelebrating` visual highlight (clears after 1.2 s)
  - All animations skipped when `usePrefersReducedMotion()` returns `true`

- [x] **T6** — `pnpm typecheck` (web) → ✅
