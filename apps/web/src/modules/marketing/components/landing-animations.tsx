"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type LandingAnimationsProps = {
  children: React.ReactNode;
};

/**
 * Progressive-enhancement wrapper for the landing page. Content is rendered
 * server-side (SEO); this client component adds Lenis smooth scroll and GSAP
 * ScrollTrigger reveal animations on top. All motion is disabled when the user
 * prefers reduced motion — elements are shown immediately in that case.
 */
export function LandingAnimations({ children }: LandingAnimationsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  // Lenis smooth scroll, synced with ScrollTrigger.
  useEffect(() => {
    if (reduced) return;

    let lenis: Lenis | null = null;
    let frame = 0;
    let active = true;

    void import("lenis").then(({ default: LenisCtor }) => {
      if (!active) return;
      const instance = new LenisCtor({ duration: 1 });
      lenis = instance;
      instance.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => {
        instance.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, [reduced]);

  useGSAP(
    () => {
      if (reduced) return;

      const elements = gsap.utils.toArray<HTMLElement>("[data-animate]");
      elements.forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      });

      // Subtle parallax on the hero glow.
      const glow = rootRef.current?.querySelector("[data-hero-glow]");
      if (glow) {
        gsap.to(glow, {
          yPercent: 30,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      ScrollTrigger.refresh();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  return <div ref={rootRef}>{children}</div>;
}
