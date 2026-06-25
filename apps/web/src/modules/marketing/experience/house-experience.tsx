"use client";

import { Canvas } from "@react-three/fiber";
import { ArrowLeft, Maximize2, MousePointerClick, X } from "lucide-react";
import { Suspense, useMemo, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

import {
  bayView,
  HALL_VIEW,
  planBays,
  ShowroomScene,
  type CameraTarget,
} from "./scene";
import { DEMO_BROKERAGES, type ShowroomBrokerage, type ShowroomListing } from "./showroom-data";

function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export function HouseExperience({
  brokerages = DEMO_BROKERAGES,
}: {
  brokerages?: ShowroomBrokerage[];
}) {
  const reduced = usePrefersReducedMotion();
  const bays = useMemo(() => planBays(brokerages), [brokerages]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ShowroomListing | null>(null);
  const [webgl] = useState(hasWebGL);

  const activeBay = bays.find((b) => b.brokerage.id === activeId) ?? null;
  const target: CameraTarget = activeBay ? bayView(activeBay) : HALL_VIEW;

  if (!webgl) {
    return <ExperienceFallback brokerages={brokerages} />;
  }

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-[#070708]">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ fov: 52, near: 0.1, far: 200, position: [0, 2.7, 12] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0b0b0e"]} />
        <fog attach="fog" args={["#0b0b0e", 26, 80]} />
        <Suspense fallback={null}>
          <ShowroomScene
            bays={bays}
            target={target}
            reduced={reduced}
            onEnterBay={setActiveId}
            onSelectListing={setSelected}
          />
        </Suspense>
      </Canvas>

      {/* ── Overlay UI ─────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-8">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4">
          <div className="pointer-events-auto">
            <p className="text-xs font-medium tracking-[0.3em] text-white/50 uppercase">
              PropAI OS
            </p>
            <h2 className="mt-1 max-w-md text-2xl font-bold text-white sm:text-3xl">
              {activeBay ? activeBay.brokerage.name : "Step inside the gallery"}
            </h2>
            <p className="mt-1 max-w-md text-sm text-white/60">
              {activeBay
                ? activeBay.brokerage.tagline
                : "Every brokerage gets a wall. Click one to walk into their listings."}
            </p>
          </div>

          {/* Brokerage switcher */}
          <div className="pointer-events-auto hidden flex-wrap justify-end gap-2 sm:flex">
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors ${
                activeId === null
                  ? "border-white/70 bg-white/15 text-white"
                  : "border-white/20 bg-black/30 text-white/70 hover:text-white"
              }`}
            >
              Overview
            </button>
            {brokerages.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveId(b.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors ${
                  activeId === b.id
                    ? "border-white/70 bg-white/15 text-white"
                    : "border-white/20 bg-black/30 text-white/70 hover:text-white"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-end justify-between gap-4">
          <div className="pointer-events-auto flex items-center gap-3">
            {activeBay ? (
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-black/60"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to gallery
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/70 backdrop-blur">
                <MousePointerClick className="size-4" aria-hidden="true" />
                Click a brokerage wall to step inside
              </span>
            )}
          </div>

          <a
            href="#features"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/70 backdrop-blur transition-colors hover:text-white"
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
            Skip to overview
          </a>
        </div>
      </div>

      {/* Listing detail card */}
      {selected ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#101114] p-6 text-white shadow-2xl">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="size-5" />
            </button>
            <p className="text-xs tracking-widest text-white/50 uppercase">{selected.city}</p>
            <p className="mt-2 text-2xl font-bold">{selected.priceLabel}</p>
            <p className="mt-1 text-base">{selected.title}</p>
            <p className="mt-1 text-sm text-white/60">{selected.meta}</p>
            {selected.closed ? (
              <p className="mt-5 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
                This listing is no longer available.
              </p>
            ) : (
              <a
                href="/signup"
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                Start free to list like this
              </a>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** 2D fallback for devices without WebGL. */
function ExperienceFallback({ brokerages }: { brokerages: ShowroomBrokerage[] }) {
  return (
    <div className="bg-[#070708] px-6 py-20 text-center text-white">
      <p className="text-xs font-medium tracking-[0.3em] text-white/50 uppercase">PropAI OS</p>
      <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold sm:text-5xl">
        The gallery of modern real estate
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-white/60">
        Every brokerage gets a wall of listings on PropAI OS.
      </p>
      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {brokerages.map((b) => (
          <div key={b.id} className="rounded-xl border border-white/10 bg-white/5 p-5 text-left">
            <p className="text-lg font-semibold">{b.name}</p>
            <p className="text-sm text-white/50">{b.tagline}</p>
            <p className="mt-3 text-sm text-white/70">{b.listings.length} listings</p>
          </div>
        ))}
      </div>
    </div>
  );
}
