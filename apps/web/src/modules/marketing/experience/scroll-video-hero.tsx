"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, ArrowUp, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

import { DEMO_BROKERAGES, type ShowroomBrokerage, type ShowroomListing } from "./showroom-data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const VIDEO_SRC = "/hero/flythrough.mp4";

type Section =
  | { kind: "intro" }
  | { kind: "brokerage"; brokerage: ShowroomBrokerage }
  | { kind: "finale" };

function scrollToProgress(root: HTMLElement, p: number) {
  const max = root.offsetHeight - window.innerHeight;
  const y = root.offsetTop + Math.max(0, Math.min(1, p)) * max;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o?: object) => void } })
    .__lenis;
  if (lenis) lenis.scrollTo(y, { duration: 1.3 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

export function ScrollVideoHero({
  brokerages = DEMO_BROKERAGES,
}: {
  brokerages?: ShowroomBrokerage[];
}) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionEls = useRef<(HTMLDivElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<ShowroomListing | null>(null);

  const sections: Section[] = [
    { kind: "intro" },
    ...brokerages.map((b) => ({ kind: "brokerage" as const, brokerage: b })),
    { kind: "finale" },
  ];
  const N = sections.length;

  // Scroll-driven video scrub + overlay crossfades.
  useGSAP(
    () => {
      if (reduced) return;

      const slot = 1 / N;
      const trapezoid = (t: number) => {
        if (t <= 0 || t >= 1) return 0;
        return Math.max(0, Math.min(t / 0.18, (1 - t) / 0.18, 1));
      };

      const render = (p: number) => {
        sectionEls.current.forEach((el, i) => {
          if (!el) return;
          const t = (p - i * slot) / slot;
          const o = trapezoid(t);
          el.style.opacity = String(o);
          el.style.visibility = o > 0.001 ? "visible" : "hidden";
          el.style.transform = `translateY(${(1 - o) * 24}px)`;
        });
        const idx = Math.max(0, Math.min(N - 1, Math.floor(p * N + 0.0001)));
        if (markerRef.current) {
          markerRef.current.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
        }
      };

      render(0);

      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          render(self.progress);
          const idx = Math.max(0, Math.min(N - 1, Math.floor(self.progress * N + 0.0001)));
          setActive(idx);
        },
      });

      // Smoothly ease the video's currentTime toward the scroll position.
      const v = videoRef.current;
      let raf = 0;
      const tick = () => {
        if (v && v.duration && !Number.isNaN(v.duration)) {
          const target = progress.current * (v.duration - 0.05);
          const cur = v.currentTime;
          const diff = target - cur;
          if (Math.abs(diff) > 0.012) {
            v.currentTime = cur + diff * 0.18;
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      return () => {
        st.kill();
        cancelAnimationFrame(raf);
      };
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  if (reduced) {
    return <ReducedHero brokerages={brokerages} />;
  }

  return (
    <section
      ref={rootRef}
      style={{ height: `${N * 100}svh` }}
      className="relative bg-black"
      aria-label="PropAI OS — cinematic introduction"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />

        {/* Section index marker */}
        <div className="pointer-events-none absolute top-6 right-6 text-right sm:top-8 sm:right-10">
          <span
            ref={markerRef}
            className="font-mono text-xs tracking-[0.3em] text-white/70"
          >
            01 / {String(N).padStart(2, "0")}
          </span>
        </div>

        {/* Overlay sections */}
        {sections.map((section, i) => (
          <div
            key={i}
            ref={(el) => {
              sectionEls.current[i] = el;
            }}
            className="absolute inset-0 flex flex-col justify-end p-6 pb-[12vh] sm:p-10 sm:pb-[12vh]"
          >
            <div className="mx-auto w-full max-w-6xl">
              <SectionContent section={section} onSelect={setSelected} />
            </div>
          </div>
        ))}

        {/* Navigation controls */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
          {active > 0 ? (
            <button
              type="button"
              onClick={() => rootRef.current && scrollToProgress(rootRef.current, (active - 0.5) / N)}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/60"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
              Back
            </button>
          ) : null}
          {active < N - 1 ? (
            <button
              type="button"
              onClick={() => rootRef.current && scrollToProgress(rootRef.current, (active + 1.5) / N)}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              {active === 0 ? "Enter" : "Discover next"}
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {selected ? <ListingModal listing={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}

function SectionContent({
  section,
  onSelect,
}: {
  section: Section;
  onSelect: (l: ShowroomListing) => void;
}) {
  if (section.kind === "intro") {
    return (
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.35em] text-white/70 uppercase">PropAI OS</p>
        <h1 className="font-display mt-4 text-5xl leading-[1.03] font-semibold text-balance text-white sm:text-7xl">
          Step inside the future of real estate
        </h1>
        <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
          Fly through a home where every wall is a brokerage — its listings, live on PropAI OS.
          Scroll to explore.
        </p>
      </div>
    );
  }

  if (section.kind === "finale") {
    return (
      <div className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.35em] text-white/70 uppercase">Get started</p>
        <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold text-white sm:text-6xl">
          Run your brokerage on PropAI OS
        </h2>
        <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
          Create your workspace in minutes. No credit card required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
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
      </div>
    );
  }

  const b = section.brokerage;
  return (
    <div>
      <p
        className="text-xs font-semibold tracking-[0.35em] uppercase"
        style={{ color: b.accent }}
      >
        Brokerage
      </p>
      <h2 className="font-display mt-3 text-4xl leading-[1.05] font-semibold text-white sm:text-5xl">
        {b.name}
      </h2>
      <p className="mt-2 text-sm text-white/70">{b.tagline}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {b.listings.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onSelect(l)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/15 bg-white/5 text-left backdrop-blur-sm transition-transform hover:-translate-y-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={l.image}
              alt={l.title}
              loading="lazy"
              decoding="async"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                l.closed && "grayscale",
              )}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
            {l.closed ? (
              <span className="absolute top-2 right-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                SOLD
              </span>
            ) : null}
            <span className="absolute right-2 bottom-2 left-2">
              <span className="block text-sm font-semibold text-white">{l.priceLabel}</span>
              <span className="block truncate text-[11px] text-white/75">{l.title}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ListingModal({ listing, onClose }: { listing: ShowroomListing; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f1012] text-white shadow-2xl">
        <div className="relative aspect-[16/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.image}
            alt={listing.title}
            className={cn("h-full w-full object-cover", listing.closed && "grayscale")}
          />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/50 p-1.5 text-white/80 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-xs tracking-widest text-white/50 uppercase">{listing.city}</p>
          <p className="mt-2 text-2xl font-bold">{listing.priceLabel}</p>
          <p className="mt-1 text-base">{listing.title}</p>
          <p className="mt-1 text-sm text-white/60">{listing.meta}</p>
          {listing.closed ? (
            <p className="mt-5 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
              This listing is no longer available.
            </p>
          ) : (
            <a
              href="/signup"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            >
              See full details
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ReducedHero({ brokerages }: { brokerages: ShowroomBrokerage[] }) {
  return (
    <div className="bg-black text-white">
      <div className="relative flex h-[80svh] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/listings/listing-01.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-black/30" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 sm:px-10">
          <p className="text-xs font-semibold tracking-[0.35em] text-white/70 uppercase">PropAI OS</p>
          <h1 className="font-display mt-4 text-4xl font-semibold sm:text-6xl">
            Step inside the future of real estate
          </h1>
        </div>
      </div>
      {brokerages.map((b) => (
        <div key={b.id} className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-10">
          <p className="text-xs font-semibold tracking-[0.35em] uppercase" style={{ color: b.accent }}>
            Brokerage
          </p>
          <h2 className="font-display mt-2 text-3xl font-semibold">{b.name}</h2>
          <p className="mt-1 text-sm text-white/60">{b.tagline}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {b.listings.map((l) => (
              <div key={l.id} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.image} alt={l.title} loading="lazy" className={cn("h-full w-full object-cover", l.closed && "grayscale")} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <span className="absolute right-2 bottom-2 left-2 text-sm font-semibold">{l.priceLabel}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
