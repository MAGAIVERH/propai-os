"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { buttonVariants } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HERO_IMG = "/listings/listing-17.jpg";

/**
 * Cinematic, volumetric atmosphere: a soft edge vignette frames the shot, a low
 * top wash keeps the nav legible, and layered low-lying fog billows up from the
 * base so the home reads as if it's emerging from morning mist. The fog layers
 * drift on their own.
 */
function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 36%, transparent 42%, rgba(8,12,20,0.34) 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/35 via-black/10 to-transparent" />
      <div data-fog className="absolute inset-x-0 bottom-0 h-[58%]">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
        <div className="absolute bottom-[-12%] left-[-15%] h-[70%] w-[75%] rounded-[50%] bg-white/80 blur-[90px]" />
        <div className="absolute bottom-[-6%] left-[28%] h-[62%] w-[70%] rounded-[50%] bg-white/65 blur-[110px]" />
        <div className="absolute bottom-[-14%] right-[-12%] h-[66%] w-[66%] rounded-[50%] bg-white/75 blur-[100px]" />
      </div>
    </div>
  );
}

/**
 * Pinned brand-reveal hero, scrubbed while the page is held:
 *  A) the fog settles, the headline fades, the photo sharpens;
 *  B) the photo dissolves and the "PropAI" wordmark writes itself in at a clear,
 *     readable pace, with the home visible *inside* the letters;
 *  C) the finished wordmark rests on the soft field for a beat so it can be
 *     taken in, then the page scrolls on to the skyline.
 * The home and headline parallax gently with the cursor. The photo layer is
 * always scaled up beyond the viewport, so that parallax can never expose an
 * edge. Static under reduced motion.
 */
export function PhotoHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const atmosRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reduced || !sectionRef.current) return;

      gsap.to("[data-fog] > div:not(:first-child)", {
        xPercent: 12,
        duration: 16,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 2.5, from: "random" },
      });

      // The wordmark builds letter-by-letter: each glyph rises and sharpens in
      // sequence (a real "construction" of the name).
      gsap.set(wordmarkRef.current, { autoAlpha: 1 });
      gsap.set("[data-letter]", { autoAlpha: 0, yPercent: 90, filter: "blur(18px)" });
      // Photo layer starts zoomed in; it never drops to 1, so parallax always
      // has overhang to spare and no section background can peek through.
      gsap.set(imgWrapRef.current, { scale: 1.1 });

      // Gentle cursor parallax (small, within the photo's overhang).
      const xImg = gsap.quickTo(imgWrapRef.current, "x", { duration: 0.7, ease: "power3" });
      const yImg = gsap.quickTo(imgWrapRef.current, "y", { duration: 0.7, ease: "power3" });
      const xTxt = gsap.quickTo(contentRef.current, "x", { duration: 0.8, ease: "power3" });
      const yTxt = gsap.quickTo(contentRef.current, "y", { duration: 0.8, ease: "power3" });
      const onMove = (e: MouseEvent) => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        xImg(dx * 12);
        yImg(dy * 12);
        xTxt(dx * 10);
        yTxt(dy * 10);
      };
      window.addEventListener("mousemove", onMove);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=140%",
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            window.dispatchEvent(new CustomEvent("propai:hero", { detail: self.progress }));
          },
        },
      });
      window.dispatchEvent(new CustomEvent("propai:hero", { detail: 0 }));

      // Phase A — fog settles, headline fades, photo sharpens.
      tl.to(atmosRef.current, { autoAlpha: 0, ease: "none", duration: 0.4 }, 0);
      tl.to(contentRef.current, { autoAlpha: 0, yPercent: -20, ease: "none", duration: 0.4 }, 0);
      tl.to(imgWrapRef.current, { scale: 1.04, ease: "none", duration: 0.4 }, 0);
      tl.to({}, { duration: 0.12 });

      // Phase B — photo dissolves; the name constructs letter by letter (each
      // glyph rises out of a blur, in sequence). Slow and deliberate.
      tl.to([imgWrapRef.current, scrimRef.current], { autoAlpha: 0, ease: "power1.inOut", duration: 0.6 }, ">");
      tl.to(
        "[data-letter]",
        {
          autoAlpha: 1,
          yPercent: 0,
          filter: "blur(0px)",
          ease: "power2.out",
          duration: 0.55,
          stagger: 0.22,
        },
        "<",
      );

      // Phase C — short hold, then the page scrolls on quickly.
      tl.to({}, { duration: 0.2 });

      return () => window.removeEventListener("mousemove", onMove);
    },
    { scope: sectionRef, dependencies: [reduced] },
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100"
    >
      {/* House photo — wrapper is scaled past the viewport so parallax never
          exposes an edge. */}
      <div ref={imgWrapRef} className="absolute inset-0 z-10 origin-center will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMG}
          alt="A modern luxury home at dusk"
          className="h-full w-full object-cover"
        />
      </div>
      <div
        ref={scrimRef}
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-t from-black/30 via-transparent to-transparent"
      />

      {/* Cinematic atmosphere */}
      <div ref={atmosRef} className="absolute inset-0 z-20">
        <Atmosphere />
      </div>

      {/* "PropAI" built letter-by-letter, with the home masked inside the glyphs
          (background-attachment: fixed keeps the image continuous across letters). */}
      <div
        ref={wordmarkRef}
        aria-label="PropAI"
        role="img"
        className="absolute inset-0 z-30 flex items-center justify-center opacity-0"
      >
        <span className="flex text-[clamp(3.5rem,19vw,18rem)] leading-none font-semibold tracking-tighter">
          {"PropAI".split("").map((ch, i) => (
            <span
              key={i}
              data-letter
              aria-hidden="true"
              className="inline-block bg-clip-text text-transparent will-change-transform"
              style={{
                backgroundImage: `url(${HERO_IMG})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
              }}
            >
              {ch}
            </span>
          ))}
        </span>
      </div>

      {/* Headline */}
      <div ref={contentRef} className="relative z-30 mx-auto w-full max-w-4xl px-6 text-center will-change-transform">
        <h1 className="text-[clamp(2.75rem,9vw,8rem)] leading-[0.95] font-semibold tracking-tight text-white drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)]">
          Find what moves you
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-white/90 drop-shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
          Expert agents. Real guidance. A curated collection of exceptional homes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#listings"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-white text-neutral-950 hover:bg-white/90",
            )}
          >
            Explore listings
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/contact"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full border-white/20 bg-neutral-950/85 text-white backdrop-blur-md hover:bg-neutral-950",
            )}
          >
            Book a consultation
          </Link>
        </div>
      </div>
    </section>
  );
}
