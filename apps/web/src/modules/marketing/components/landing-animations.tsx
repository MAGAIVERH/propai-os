"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type LandingAnimationsProps = {
  children: React.ReactNode;
};

/**
 * Progressive-enhancement wrapper for the editorial sections below the hero.
 * Smooth scroll is provided once page-wide by SmoothScrollProvider; this only
 * adds GSAP ScrollTrigger reveal animations, disabled under reduced motion.
 */
export function LandingAnimations({ children }: LandingAnimationsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

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
