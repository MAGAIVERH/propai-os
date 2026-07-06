"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * A discreet floating control that appears once the visitor is a couple of
 * screens down and glides the page back to the hero. Keeps a long editorial
 * landing navigable without cluttering the first impression.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
      }
      aria-label="Back to top"
      className={cn(
        "border-border/60 bg-background/90 text-foreground fixed right-4 bottom-4 z-40 inline-flex size-11 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:right-6 sm:bottom-6",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
