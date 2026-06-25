# Phase 7 · Day 67 — GSAP ScrollTrigger + Lenis on landing

**Objective:** Premium scroll experience on the landing page.

## What was built

- `modules/marketing/components/landing-animations.tsx` — a client wrapper that:
  - Sets up **Lenis** smooth scroll, synced with GSAP `ScrollTrigger.update` via
    its `scroll` event, driven by a single `requestAnimationFrame` loop.
  - Registers `ScrollTrigger` and reveals every `[data-animate]` element on scroll
    (fade + rise, `start: "top 85%"`, stagger handled by per-element triggers).
  - Adds a subtle **parallax** on the hero glow (`scrub`).
  - Uses `useGSAP` with a `scope` ref so animations are scoped and auto-cleaned.

## Reduced motion

- All animation and Lenis are gated behind `usePrefersReducedMotion()`. When the
  user prefers reduced motion, nothing animates and content is shown immediately
  (no `data-animate` opacity:0 state is applied).

## How to test

1. `pnpm dev`, open `/`, scroll down → sections fade/rise in; hero glow drifts.
2. Enable "Reduce motion" in OS settings → reload → content appears instantly,
   no smooth-scroll hijack.

## Notes

- Lenis is dynamically imported so it stays out of the initial server bundle.
- Sections remain server-rendered; animation is pure progressive enhancement.
