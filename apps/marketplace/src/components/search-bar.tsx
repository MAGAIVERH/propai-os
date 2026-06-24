"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTIONS = [
  "Quiet area near parks, pet friendly, under $500k",
  "Modern condo with home office downtown",
  "Family home with a big backyard and garage",
];

export function SearchBar({
  defaultValue = "",
  autoFocus = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="border-border bg-card focus-within:border-primary/60 focus-within:ring-ring flex w-full items-center gap-2 rounded-full border p-1.5 shadow-lg shadow-black/20 focus-within:ring-2"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="text-muted-foreground ml-3 size-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          autoFocus={autoFocus}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Describe your ideal home…"
          aria-label="Search properties with natural language"
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              submit(s);
            }}
            className="border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground rounded-full border px-3 py-1 text-xs transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
