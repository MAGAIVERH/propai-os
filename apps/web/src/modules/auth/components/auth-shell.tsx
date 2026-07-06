import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/modules/marketing/components/brand-logo";

type AuthShellProps = {
  /** Full-bleed image for the left visual panel. */
  image: string;
  imageAlt?: string;
  eyebrow: string;
  headline: string;
  quote?: string;
  quoteAuthor?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
};

/**
 * Premium split-screen frame for every auth screen (buyer and brokerage): a
 * cinematic photo panel with brand + a line of proof on the left, and a calm,
 * centered form column on the right. The photo panel collapses on small screens
 * so the form always leads on mobile.
 */
export function AuthShell({
  image,
  imageAlt = "",
  eyebrow,
  headline,
  quote,
  quoteAuthor,
  backHref = "/",
  backLabel = "Back to site",
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-neutral-950/45"
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <BrandLogo tone="light" />
          <div className="max-w-md">
            <p className="text-xs font-medium tracking-[0.3em] text-white/70 uppercase">
              {eyebrow}
            </p>
            <p className="mt-5 text-3xl leading-[1.15] font-semibold tracking-tight text-balance">
              {headline}
            </p>
            {quote ? (
              <figure className="mt-10 border-l-2 border-white/25 pl-5">
                <blockquote className="text-white/85 text-pretty">“{quote}”</blockquote>
                {quoteAuthor ? (
                  <figcaption className="mt-3 text-sm text-white/60">{quoteAuthor}</figcaption>
                ) : null}
              </figure>
            ) : null}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            href={backHref}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {backLabel}
          </Link>
          <span className="lg:hidden">
            <BrandLogo />
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
