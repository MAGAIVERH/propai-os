# Phase 7 · Day 70 — Accessibility pass

**Objective:** Baseline a11y for international companies.

## What was done

- **Reduced motion (global)** — added a `@media (prefers-reduced-motion: reduce)`
  rule in `globals.css` that neutralizes animations, transitions, and smooth
  scroll app-wide. GSAP/Lenis on the landing and analytics are additionally gated
  in JS via `usePrefersReducedMotion()`.
- **Icon buttons** — audited every `size="icon*"` button. All have an `aria-label`
  or an `sr-only` text label:
  - notification bell, theme toggle, sidebar trigger, dialog/sheet close,
    team "Remove member", onboarding "Dismiss setup checklist".
- **Landing semantics** — single `<h1>` in the hero, `<h2>` per section, `<nav>`
  with `aria-label="Primary"`, decorative icons marked `aria-hidden`, and an
  accessible FAQ using native `<details>/<summary>` (keyboard-operable).
- **Focus rings** — the shared Button already renders visible
  `focus-visible:ring` states; left intact.

## How to test

1. Enable OS "Reduce motion" → reload → no animation/scroll hijack anywhere.
2. Tab through the landing and dashboard → all controls reachable and labeled;
   focus rings visible.
3. Run axe DevTools on `/` and the dashboard → no critical violations on main flows.
