"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "propai-cookie-consent";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorage is browser-only; reading it after mount (rather than during
    // render) keeps SSR and first client render in sync, then reveals the
    // banner if the visitor hasn't chosen yet.
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode) — don't nag.
    }
  }, []);

  function dismiss(value: "accepted" | "declined") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
    >
      <div className="rounded-card border-border bg-card mx-auto flex w-full max-w-3xl flex-col gap-3 border p-4 shadow-2xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          We use essential cookies to keep this site working and optional analytics to improve it.
          See our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => dismiss("declined")}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => dismiss("accepted")}
            className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
