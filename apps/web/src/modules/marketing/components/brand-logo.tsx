import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  /** "light" = white wordmark for use over imagery. */
  tone?: "default" | "light";
};

/**
 * PropAI wordmark — a typographic lockup (no icon tile): the "PropAI" wordmark
 * over a finely-tracked "Real Estate OS" line. Gallery-minimal, premium.
 */
export function BrandLogo({ className, href = "/", tone = "default" }: BrandLogoProps) {
  const light = tone === "light";
  return (
    <Link
      href={href}
      aria-label="PropAI home"
      className={cn(
        "inline-flex flex-col leading-none",
        light ? "text-white" : "text-foreground",
        className,
      )}
    >
      <span className="text-[1.4rem] font-semibold tracking-[-0.035em]">
        Prop<span className={light ? "text-white" : "text-primary"}>AI</span>
      </span>
      <span
        className={cn(
          "mt-[0.4rem] text-[0.5rem] font-semibold tracking-[0.42em] uppercase",
          light ? "text-white/65" : "text-muted-foreground",
        )}
      >
        Real Estate OS
      </span>
    </Link>
  );
}
