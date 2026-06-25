"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * One page-wide Lenis smooth-scroll instance, synced with GSAP ScrollTrigger.
 * Disabled under prefers-reduced-motion. Mount once near the top of the page.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let lenis: Lenis | null = null;
    let frame = 0;
    let active = true;

    void import("lenis").then(({ default: LenisCtor }) => {
      if (!active) return;
      const instance = new LenisCtor({ duration: 1.1, smoothWheel: true });
      lenis = instance;
      instance.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => {
        instance.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
      ScrollTrigger.refresh();
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
