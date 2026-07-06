"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "lucide-react";
import { useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

import { STORIES, type Story } from "../content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

function Stars({ className = "size-3.5" }: { className?: string }) {
  return (
    <div className="flex gap-0.5" aria-label="Rated 5 out of 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn(className, "fill-amber-400 text-amber-400")} aria-hidden="true" />
      ))}
    </div>
  );
}

/** A decorative opening quotation mark (sans, to stay on-brand). */
function QuoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20 12c-6.6 0-12 5.4-12 12v12h12V24h-6c0-3.3 2.7-6 6-6V12Zm20 0c-6.6 0-12 5.4-12 12v12h12V24h-6c0-3.3 2.7-6 6-6V12Z" />
    </svg>
  );
}

/** Uniform quote card used across the marquee and the reduced-motion grid. */
function StoryCard({ story, grid = false }: { story: Story; grid?: boolean }) {
  return (
    <figure
      className={cn(
        "border-border/60 bg-card flex h-full flex-col rounded-2xl border p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-20px_rgba(16,24,40,0.28)]",
        grid ? "w-full" : "w-[340px] shrink-0",
      )}
    >
      <Stars />
      <blockquote className="text-foreground/85 mt-4 line-clamp-3 min-h-[4.5rem] leading-relaxed text-pretty">
        “{story.quote}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.avatar}
          alt={story.name}
          loading="lazy"
          className="size-10 rounded-full object-cover ring-2 ring-white"
        />
        <span>
          <span className="text-foreground block text-sm font-medium">{story.name}</span>
          <span className="text-muted-foreground block text-xs">{story.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * "Stories" — social proof, reimagined as an editorial moment rather than a wall
 * of boxes. A large centered featured quote leads (the signature), then two rows
 * of uniform testimonial cards drift in opposite directions behind soft edge
 * fades. The marquee pauses gently on hover; under reduced motion it collapses to
 * a calm, symmetric three-column grid. Light + navy Gallery-Minimal skin.
 */
export function StoriesSection() {
  const ref = useRef<HTMLElement>(null);
  const rowARef = useRef<HTMLDivElement>(null);
  const rowBRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [featured, ...rest] = STORIES;
  const rowA = rest.slice(0, Math.ceil(rest.length / 2));
  const rowB = rest.slice(Math.ceil(rest.length / 2));

  useGSAP(
    () => {
      if (reduced || !ref.current) return;

      // Featured quote rises in as the section enters view.
      gsap.from("[data-featured]", {
        y: 32,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 78%" },
      });

      // Seamless opposing marquees (each track renders its cards twice, so a
      // -50% shift lands exactly on the duplicate — no visible jump).
      const build = (el: HTMLElement | null, dir: 1 | -1) => {
        if (!el) return null;
        const from = dir === 1 ? 0 : -50;
        const to = dir === 1 ? -50 : 0;
        gsap.set(el, { xPercent: from });
        return gsap.to(el, { xPercent: to, duration: 60, ease: "none", repeat: -1 });
      };

      const a = build(rowARef.current, 1);
      const b = build(rowBRef.current, -1);
      const tweens = [a, b].filter(Boolean) as gsap.core.Tween[];

      const slow = () => gsap.to(tweens, { timeScale: 0, duration: 0.5, overwrite: true });
      const resume = () => gsap.to(tweens, { timeScale: 1, duration: 0.5, overwrite: true });
      const wrap = ref.current.querySelector("[data-marquee]");
      wrap?.addEventListener("mouseenter", slow);
      wrap?.addEventListener("mouseleave", resume);

      return () => {
        wrap?.removeEventListener("mouseenter", slow);
        wrap?.removeEventListener("mouseleave", resume);
      };
    },
    { scope: ref, dependencies: [reduced] },
  );

  return (
    <section ref={ref} id="stories" className="bg-muted/30 scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            Stories
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            The people behind every move
          </h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            Brokers, agents, and buyers on what changed when they switched to PropAI.
          </p>
        </div>

        {/* Signature — the featured, editorial testimonial. */}
        <figure
          data-featured
          className="border-border/60 bg-card relative mx-auto mt-14 max-w-3xl rounded-[2rem] border px-8 py-14 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04),0_28px_60px_-32px_rgba(16,24,40,0.25)] sm:px-14"
        >
          <QuoteMark className="text-primary/15 mx-auto size-12" />
          <blockquote className="mx-auto mt-6 max-w-2xl text-2xl leading-snug font-medium tracking-tight text-balance sm:text-[1.75rem]">
            {featured.quote}
          </blockquote>
          <figcaption className="mt-9 flex items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.avatar}
              alt={featured.name}
              className="size-14 rounded-full object-cover shadow-md ring-2 ring-white"
            />
            <div className="text-left">
              <span className="text-foreground block font-semibold">{featured.name}</span>
              <span className="text-muted-foreground block text-sm">{featured.role}</span>
            </div>
          </figcaption>
        </figure>
      </div>

      {reduced ? (
        // Calm, symmetric grid when motion is off.
        <div className="mx-auto mt-12 grid w-full max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {rest.map((story) => (
            <StoryCard key={story.name} story={story} grid />
          ))}
        </div>
      ) : (
        <div
          data-marquee
          className="mt-12 space-y-5 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          }}
        >
          <div ref={rowARef} className="flex w-max gap-5 will-change-transform">
            {[...rowA, ...rowA].map((story, i) => (
              <StoryCard key={`a-${i}`} story={story} />
            ))}
          </div>
          <div ref={rowBRef} className="flex w-max gap-5 will-change-transform">
            {[...rowB, ...rowB].map((story, i) => (
              <StoryCard key={`b-${i}`} story={story} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
