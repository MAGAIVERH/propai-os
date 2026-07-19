"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Parses a display value like "$2.4B", "1,800+", "98%", "40+" into the pieces we
 * need to animate: a non-numeric prefix, the numeric target, a suffix, how many
 * decimals to keep, and whether to group thousands with commas.
 */
function parseValue(value: string) {
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/);
  if (!match) return { prefix: "", target: 0, suffix: value, decimals: 0, group: false };
  const [, prefix, numStr, suffix] = match;
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  const group = numStr.includes(",");
  const target = parseFloat(numStr.replace(/,/g, ""));
  return { prefix, target, suffix, decimals, group };
}

function format(n: number, decimals: number, group: boolean) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: group,
  });
}

const RISE_MS = 2000; // count up over 2s
const HOLD_MS = 1400; // rest at the top
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * A figure that perpetually counts up from zero to its target, holds briefly,
 * then restarts — so the trust band always reads as "live". The loop runs on a
 * single rAF (cheap for a handful of figures) and pauses when the tab is hidden;
 * renders the final value statically under reduced-motion.
 */
export function StatCounter({ value }: { value: string }) {
  const { prefix, target, suffix, decimals, group } = parseValue(value);
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(() => format(target, decimals, group));

  useEffect(() => {
    // Under reduced motion we leave the statically-initialised final value in
    // place (no animation, no setState).
    if (reduced) return;

    let raf = 0;
    let cycleStart = 0;

    const tick = (now: number) => {
      if (!cycleStart) cycleStart = now;
      const elapsed = now - cycleStart;
      if (elapsed <= RISE_MS) {
        const p = easeOut(elapsed / RISE_MS);
        setDisplay(format(target * p, decimals, group));
      } else if (elapsed <= RISE_MS + HOLD_MS) {
        setDisplay(format(target, decimals, group));
      } else {
        cycleStart = now; // restart the loop
      }
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        cycleStart = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
    };
  }, [reduced, target, decimals, group]);

  return (
    <span className="tabular-nums">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
