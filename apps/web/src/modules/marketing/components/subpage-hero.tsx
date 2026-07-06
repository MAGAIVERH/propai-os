import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type SubpageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Optional back link (label + href). Defaults to home. */
  back?: { label: string; href: string };
  children?: React.ReactNode;
};

/**
 * Compact, centered page header for the inner marketing pages (About, Contact,
 * Listings, Insights, legal). Adds the top padding needed to clear the fixed
 * nav, which sits solid on every page except the landing hero.
 */
export function SubpageHero({
  eyebrow,
  title,
  description,
  back = { label: "Back to home", href: "/" },
  children,
}: SubpageHeroProps) {
  return (
    <section className="border-border/60 bg-muted/30 border-b">
      <div className="mx-auto w-full max-w-4xl px-4 pt-28 pb-14 text-center sm:px-6 sm:pt-32 sm:pb-16">
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {back.label}
        </Link>
        {eyebrow ? (
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
