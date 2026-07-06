"use client";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Full-bleed cinematic video band — a drone glide through luxury homes, echoing
 * the reference site's full-screen video moments. Renders a static poster under
 * reduced motion.
 */
export function CinematicVideoBand() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="how-it-works"
      className="relative isolate flex min-h-[88svh] scroll-mt-20 items-center justify-center overflow-hidden"
    >
      {reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/hero/houses-poster.jpg"
          alt="A drone view of a luxury home"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster="/hero/houses-poster.jpg"
        >
          <source src="/hero/houses.mp4" type="video/mp4" />
        </video>
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/35 to-black/65"
      />

      <div className="mx-auto w-full max-w-3xl px-6 text-center text-white">
        <p className="text-xs font-medium tracking-[0.3em] text-white/75 uppercase">
          Every home, a story
        </p>
        <h2 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
          Where the right home meets the right buyer
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-white/85">
          From the first drone pass to the signed close, PropAI moves with you.
          Every listing, lead, and decision in one place.
        </p>
      </div>
    </section>
  );
}
