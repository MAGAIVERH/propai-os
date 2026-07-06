"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The beat right after the hero: a full-bleed aerial of a famous US skyline
 * (New York) that bursts open as it enters the viewport — a one-shot clip-path
 * + scale reveal for an immediate "wow", then the headline rises in. Static
 * poster, no animation, under reduced motion.
 */
export function CinematicReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      gsap.set(wrapRef.current, { clipPath: "inset(16% 24% round 28px)", scale: 1.14 });
      gsap.to(wrapRef.current, {
        clipPath: "inset(0% 0% round 0px)",
        scale: 1,
        ease: "power3.out",
        duration: 1.3,
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
      });

      gsap.from("[data-reveal-text]", {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        delay: 0.45,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
      });

      // Slow, endless drift so the frame always feels alive.
      gsap.to(wrapRef.current, {
        scale: 1.06,
        duration: 14,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1.4,
      });
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden bg-neutral-950"
    >
      <div ref={wrapRef} className="absolute inset-0 will-change-transform">
        {reduced ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/hero/nyc-poster.jpg"
            alt="Aerial view of the New York City skyline"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero/nyc-poster.jpg"
          >
            <source src="/hero/nyc.mp4" type="video/mp4" />
          </video>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70"
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto w-full max-w-4xl px-6 text-center text-white">
            <p
              data-reveal-text
              className="text-xs font-medium tracking-[0.35em] text-white/80 uppercase"
            >
              New York · Los Angeles · Miami · Aspen
            </p>
            <h2
              data-reveal-text
              className="mt-6 text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] font-semibold tracking-tight text-balance"
            >
              Where the country&rsquo;s most coveted homes change hands
            </h2>
            <p
              data-reveal-text
              className="mx-auto mt-6 max-w-xl text-lg text-pretty text-white/85"
            >
              Iconic markets, exceptional properties, and the agents who know them best.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
