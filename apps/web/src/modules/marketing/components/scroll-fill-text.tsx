"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ScrollFillTextProps = {
  /** Full text; rendered word-by-word so each word can fade in on scroll. */
  text: string;
  /** Heading/paragraph tag to render. */
  as?: "h2" | "h3" | "p" | "span";
  className?: string;
};

/**
 * The signature findrealestate.com effect: a block of text whose words start
 * dimmed and "fill in" to full strength as the block scrolls through the
 * viewport (scrubbed, staggered). Degrades to fully-legible static text under
 * reduced motion or when JS is unavailable — words render at full opacity by
 * default and are only dimmed once the animation is wired up.
 */
export function ScrollFillText({ text, as = "p", className }: ScrollFillTextProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const words = text.split(" ");

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const wordEls = ref.current.querySelectorAll<HTMLElement>("[data-fill-word]");
      gsap.set(wordEls, { opacity: 0.22 });
      gsap.to(wordEls, {
        opacity: 1,
        ease: "none",
        stagger: 0.5,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          end: "top 35%",
          scrub: true,
        },
      });
    },
    { scope: ref, dependencies: [reduced] },
  );

  const Tag = as;

  return (
    <Tag ref={ref as never} className={cn(className)}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span data-fill-word className="inline-block">
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
