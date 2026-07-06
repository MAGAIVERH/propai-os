"use client";

import { usePathname } from "next/navigation";

/**
 * Subtle fade/rise on route change for dashboard pages. Re-keys on pathname so
 * the enter animation replays per navigation. Motion is disabled automatically
 * under `prefers-reduced-motion` via the global stylesheet rule.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
      {children}
    </div>
  );
}
