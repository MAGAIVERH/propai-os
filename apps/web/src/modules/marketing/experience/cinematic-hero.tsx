"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Scene = {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  align?: "left" | "center";
  finale?: boolean;
};

const SCENES: Scene[] = [
  {
    image: "/showroom/01-exterior.jpg",
    eyebrow: "PropAI OS",
    title: "The operating system for modern real estate",
    body: "CRM, AI listings, and a public marketplace — one platform built for US brokerages.",
    align: "center",
  },
  {
    image: "/showroom/02-living-garden.jpg",
    eyebrow: "AI Listings",
    title: "Open the whole house to the world",
    body: "Upload a few photos and let AI draft the listing — then publish it to a marketplace built to convert.",
  },
  {
    image: "/showroom/05-bedroom.jpg",
    eyebrow: "Real-time CRM",
    title: "A pipeline your team lives in",
    body: "Drag-and-drop deals that update live across your brokerage over WebSockets — no refresh, no stale data.",
  },
  {
    image: "/showroom/04-living.jpg",
    eyebrow: "Semantic search",
    title: "Buyers describe home. We find it.",
    body: "Natural-language property search powered by vector embeddings, ranked by what actually matters.",
  },
  {
    image: "/showroom/06-pool.jpg",
    eyebrow: "Built for US brokerages",
    title: "From Boulder bungalows to Bay Area estates",
    body: "USD, square feet, US addresses, and Fair Housing — native to the US market, not translated.",
  },
  {
    image: "/showroom/03-kitchen.jpg",
    eyebrow: "Get started",
    title: "Run your brokerage on PropAI OS",
    body: "Create your workspace in minutes. No credit card required.",
    align: "center",
    finale: true,
  },
];

export function CinematicHero() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneEls = useRef<(HTMLDivElement | null)[]>([]);
  const imgEls = useRef<(HTMLDivElement | null)[]>([]);
  const capEls = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      if (reduced) return;
      const n = SCENES.length;

      // Initial state: only the first scene visible.
      sceneEls.current.forEach((el, i) => {
        if (el) gsap.set(el, { autoAlpha: i === 0 ? 1 : 0 });
      });

      const apply = (progress: number) => {
        const v = progress * (n - 1);
        const active = Math.min(n - 1, Math.floor(v));
        const frac = v - active;

        sceneEls.current.forEach((el, i) => {
          if (!el) return;
          let o = 0;
          if (i === active) o = 1;
          else if (i === active + 1) o = frac;
          el.style.opacity = String(o);
          el.style.visibility = o > 0.001 ? "visible" : "hidden";

          // Captions hand off cleanly at the midpoint so two headlines never
          // overlap during a crossfade.
          let capO = 0;
          if (i === active) capO = gsap.utils.clamp(0, 1, 1 - frac * 2);
          else if (i === active + 1) capO = gsap.utils.clamp(0, 1, (frac - 0.5) * 2);
          const cap = capEls.current[i];
          if (cap) {
            cap.style.opacity = String(capO);
            cap.style.transform = `translateY(${(1 - capO) * 26}px)`;
          }
          const img = imgEls.current[i];
          if (img) {
            const local = gsap.utils.clamp(0, 1, v - i + 0.85);
            img.style.transform = `scale(${(1.04 + local * 0.12).toFixed(4)})`;
          }
        });
      };

      apply(0);

      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => apply(self.progress),
      });

      return () => st.kill();
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  // Reduced-motion / no-JS: a clean stacked sequence, fully legible.
  if (reduced) {
    return (
      <div className="bg-black">
        {SCENES.map((scene) => (
          <SceneCard key={scene.image} scene={scene} static />
        ))}
      </div>
    );
  }

  return (
    <section
      ref={rootRef}
      style={{ height: `${SCENES.length * 100}svh` }}
      className="relative bg-black"
      aria-label="PropAI OS introduction"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {SCENES.map((scene, i) => (
          <div
            key={scene.image}
            ref={(el) => {
              sceneEls.current[i] = el;
            }}
            className="absolute inset-0 will-change-[opacity]"
          >
            {/* Ken Burns image layer */}
            <div
              ref={(el) => {
                imgEls.current[i] = el;
              }}
              className="absolute inset-0 will-change-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scene.image}
                alt=""
                aria-hidden="true"
                loading={i === 0 ? "eager" : "lazy"}
                {...(i === 0 ? { fetchPriority: "high" as const } : {})}
                className="h-full w-full object-cover"
              />
            </div>
            {/* Legibility gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />

            {/* Caption */}
            <div
              ref={(el) => {
                capEls.current[i] = el;
              }}
              className={cn(
                "absolute right-6 bottom-[12vh] left-6 mx-auto max-w-6xl sm:right-10 sm:left-10",
                scene.align === "center" && "text-center",
              )}
            >
              <CaptionContent scene={scene} />
            </div>
          </div>
        ))}

        {/* Scroll hint */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70">
          <ChevronDown className="size-6 animate-bounce" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function CaptionContent({ scene }: { scene: Scene }) {
  return (
    <div className={cn("max-w-2xl", scene.align === "center" && "mx-auto")}>
      <p className="text-xs font-semibold tracking-[0.35em] text-white/70 uppercase">
        {scene.eyebrow}
      </p>
      <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold text-balance text-white sm:text-6xl">
        {scene.title}
      </h2>
      <p className="mt-5 max-w-xl text-base text-pretty text-white/80 sm:text-lg">
        {scene.body}
      </p>
      {scene.finale ? (
        <div
          className={cn(
            "mt-8 flex flex-wrap gap-3",
            scene.align === "center" && "justify-center",
          )}
        >
          <Button size="lg" render={<Link href="/signup" />}>
            Start free
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/30 bg-white/10 text-white hover:bg-white/20",
            )}
          >
            Sign in
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function SceneCard({ scene, static: isStatic }: { scene: Scene; static?: boolean }) {
  return (
    <div className={cn("relative flex h-[100svh] items-end overflow-hidden", isStatic && "")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={scene.image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
      <div
        className={cn(
          "relative mx-auto w-full max-w-6xl px-6 pb-[12vh] sm:px-10",
          scene.align === "center" && "text-center",
        )}
      >
        <CaptionContent scene={scene} />
      </div>
    </div>
  );
}
