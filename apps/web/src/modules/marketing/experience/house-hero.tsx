"use client";

import dynamic from "next/dynamic";

// The 3D showroom is client-only (WebGL) and must never run during SSR.
const HouseExperience = dynamic(
  () => import("./house-experience").then((m) => m.HouseExperience),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100svh] w-full items-center justify-center bg-[#070708]">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.3em] text-white/40 uppercase">
            PropAI OS
          </p>
          <p className="mt-3 animate-pulse text-lg text-white/60">
            Entering the gallery…
          </p>
        </div>
      </div>
    ),
  },
);

export function HouseHero() {
  return <HouseExperience />;
}
