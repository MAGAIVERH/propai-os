"use client";

import { useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

/** Fires a one-time property_view analytics beacon on mount. */
export function ViewBeacon({ propertyId }: { propertyId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void fetch(`${API_URL}/public/properties/${propertyId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {
      // Best-effort — analytics must never disrupt the page.
    });
  }, [propertyId]);

  return null;
}
