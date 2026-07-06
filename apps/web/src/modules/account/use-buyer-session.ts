"use client";

import { useSyncExternalStore } from "react";

/**
 * Lightweight buyer (end-user) session for the public site. This is a portfolio
 * demo — there is no consumer auth backend — so a signed-in buyer is persisted
 * in localStorage and shared across tabs/components via events. It lets a buyer
 * stay logged in and request tours in one click (the interest would create a
 * lead in the brokerage CRM in the real product) instead of re-typing a form.
 *
 * This is entirely separate from the brokerage/agent auth (Better Auth) used for
 * the dashboard at /login and /signup.
 */
export type Buyer = { name: string; email: string };

const KEY = "propai:buyer";
const EVENT = "propai:buyer-change";

// Cache so getSnapshot returns a stable reference while the stored value is
// unchanged (required by useSyncExternalStore to avoid render loops).
let cachedRaw = "";
let cachedBuyer: Buyer | null = null;

function getSnapshot(): Buyer | null {
  let raw = "";
  try {
    raw = window.localStorage.getItem(KEY) ?? "";
  } catch {
    raw = "";
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedBuyer = raw ? (JSON.parse(raw) as Buyer) : null;
    } catch {
      cachedBuyer = null;
    }
  }
  return cachedBuyer;
}

function getServerSnapshot(): Buyer | null {
  return null;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(buyer: Buyer | null) {
  try {
    if (buyer) window.localStorage.setItem(KEY, JSON.stringify(buyer));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useBuyerSession() {
  const buyer = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    buyer,
    signIn: (next: Buyer) => write(next),
    register: (next: Buyer) => write(next),
    signOut: () => write(null),
  };
}

/** Derive a friendly display name from an email local-part, e.g. jane.doe → Jane. */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]/)[0] ?? local;
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "there";
}
