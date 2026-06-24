import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "PropAI OS is an AI-native operating system for US real estate brokerages — from listing management to lead conversion.",
};

const STATS = [
  { value: "AI-first", label: "Semantic property search" },
  { value: "Real-time", label: "Lead routing to agents" },
  { value: "US-wide", label: "Fair Housing compliant" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16">
      <p className="text-primary text-sm font-medium tracking-[0.18em] uppercase">About</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Real estate, reimagined with AI</h1>
      <p className="text-muted-foreground mt-5 leading-7 text-pretty">
        PropAI OS is the operating system behind this marketplace. Brokerages use it to manage
        listings, capture leads, and close deals faster — while buyers and renters get a search
        experience that actually understands what they&apos;re looking for.
      </p>
      <p className="text-muted-foreground mt-4 leading-7 text-pretty">
        Instead of forcing you through dropdown after dropdown, our semantic search lets you
        describe your ideal home in your own words. Behind the scenes, every inquiry you send
        reaches a real agent in seconds.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-card border-border bg-card border p-5">
            <p className="text-primary text-xl font-bold">{s.value}</p>
            <p className="text-muted-foreground mt-1 text-sm">{s.label}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
