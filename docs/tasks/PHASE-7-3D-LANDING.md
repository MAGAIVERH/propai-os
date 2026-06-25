# Phase 7 · Cinematic Landing Hero

**Goal:** An extraordinary, editorial landing in the spirit of high-end real-estate
sites (e.g. "mirador") — full-bleed architectural photography with a slow,
camera-like scroll that moves "through" a home.

> Note: an earlier attempt used procedural WebGL (React Three Fiber). It looked
> amateurish without photoreal assets, so it was removed in favor of the
> image-based cinematic approach below — which is how those reference sites
> actually achieve their quality (real photography + motion + typography).

## Technique
- **Photographic scrollytelling**: a tall section with a `sticky` full-viewport
  stage. As you scroll, full-bleed photos crossfade while the active image does a
  slow **Ken Burns** zoom (camera/drone feel). Editorial captions hand off cleanly
  at each transition (no overlap).
- **GSAP ScrollTrigger** drives the effect from scroll progress; **Lenis** provides
  page-wide smooth scroll (one instance via `SmoothScrollProvider`).
- **Editorial typography**: `Fraunces` serif display (`--font-display`) for headlines.
- Fully disabled under `prefers-reduced-motion` → a clean stacked, legible sequence.

## Files
- `apps/web/src/modules/marketing/experience/cinematic-hero.tsx` — the hero.
- `apps/web/src/modules/marketing/components/smooth-scroll-provider.tsx` — page-wide Lenis.
- `apps/web/public/showroom/*.jpg` — curated high-res architecture photography
  (Unsplash license; no attribution required).

## Scenes (image + caption tied to the product)
1. Modern dusk exterior — "The operating system for modern real estate".
2. Open living→garden — "Open the whole house to the world" (AI listings).
3. Staircase living — "A pipeline your team lives in" (real-time CRM).
4. Bright gallery living — "Buyers describe home. We find it." (semantic search).
5. Classic US craftsman — "From Boulder bungalows to Bay Area estates" (US-native).
6. Modern exterior — finale CTA "Run your brokerage on PropAI OS" + Start free / Sign in.

Below the hero: the existing editorial sections (features, how it works, pricing,
testimonials, FAQ, CTA) with scroll-reveal via `LandingAnimations`.

## Verified
- Typecheck + lint green. Headless-Chrome screenshots confirm each scene renders
  with the photo + serif caption, and transitions hand off cleanly (no overlap).
- React Three Fiber / postprocessing dependencies removed (lighter bundle).

## Next
- Swap in higher-end / on-brand photography (or brokerage-supplied photos).
- Optional: tie a scene to live published listings from the public marketplace API.
