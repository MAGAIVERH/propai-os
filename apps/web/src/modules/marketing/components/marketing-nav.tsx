"use client";

import { ArrowRight, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuyerSession } from "@/modules/account/use-buyer-session";

import { BrandLogo } from "./brand-logo";

/**
 * A text link whose rounded outline draws itself around the label on hover — the
 * stroke traces the full perimeter and closes (a premium touch reserved for the
 * two account links). `tone` carries the over-hero vs. solid text colour.
 */
function OutlineLink({
  href,
  tone,
  className,
  children,
}: {
  href: string;
  tone: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        tone,
        className,
      )}
    >
      <span className="relative z-10">{children}</span>
      {/* No viewBox → the SVG's units are CSS pixels, so ry="50%" resolves to
          half the height and (with rx omitted) rx=ry, giving a true pill outline
          at any width — matching the "Book a consultation" button. */}
      <svg
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          ry="50%"
          pathLength={100}
          vectorEffect="non-scaling-stroke"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-0 [stroke-dasharray:100] [stroke-dashoffset:100] transition-[stroke-dashoffset,opacity] duration-500 ease-out group-hover:opacity-100 group-hover:[stroke-dashoffset:0]"
        />
      </svg>
    </Link>
  );
}

const NAV_LINKS = [
  { label: "Listings", href: "/#listings" },
  { label: "How it works", href: "/#platform" },
  { label: "Services", href: "/#services" },
  { label: "Markets", href: "/#markets" },
  { label: "Stories", href: "/#stories" },
];

/**
 * A single header with two moods:
 *  - Over the hero (at the top of the page) it's transparent with a white
 *    wordmark, letting the cinematic hero breathe.
 *  - Once you scroll past the fold it condenses into a solid, blurred bar with
 *    dark text so navigation stays reachable everywhere on the page (a more
 *    professional pattern than hiding the nav entirely).
 * On mobile the links collapse into a full-screen overlay menu.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { buyer, signOut } = useBuyerSession();
  // Only the landing page has a full-bleed hero for the nav to float over;
  // every other page is light, so the nav must stay solid from the top.
  const overHero = pathname === "/";

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  // Lock body scroll while the mobile overlay is open, and close it on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // "solid" = dark text on a light, blurred bar. Always solid off the landing
  // page; on the landing page it turns solid once you scroll past the fold.
  const solid = scrolled || !overHero;

  const linkTone = solid
    ? "text-foreground/80 hover:text-foreground"
    : "text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.55)] hover:text-white/80";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        solid
          ? "border-border/60 bg-background/85 border-b shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Primary"
        className={cn(
          "mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-6",
          solid ? "h-16" : "h-20",
        )}
      >
        <BrandLogo tone={solid ? "default" : "light"} />

        <ul
          className={cn(
            "hidden items-center gap-8 text-sm font-medium md:flex",
            solid
              ? "text-foreground/80"
              : "text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.55)]",
          )}
        >
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "group relative inline-block py-1 transition-colors",
                  solid ? "hover:text-foreground" : "hover:text-white",
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100",
                    solid ? "bg-foreground" : "bg-white",
                  )}
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <OutlineLink href="/login" tone={linkTone} className="hidden lg:inline-flex">
            Agent login
          </OutlineLink>

          {buyer ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/listings"
                className={cn("inline-flex items-center gap-2 text-sm font-medium", linkTone)}
              >
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                    solid ? "bg-muted text-foreground" : "bg-white/20 text-white",
                  )}
                >
                  {buyer.name.charAt(0).toUpperCase()}
                </span>
                {buyer.name}
              </Link>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className={cn("transition-colors", linkTone)}
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <OutlineLink href="/account/login" tone={linkTone} className="hidden sm:inline-flex">
                Sign in
              </OutlineLink>
              <Link
                href="/contact"
                className="group relative hidden items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-br from-neutral-800 to-neutral-950 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:inline-flex"
              >
                <span className="relative z-10">Book a consultation</span>
                <ArrowRight
                  className="relative z-10 size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full"
                />
              </Link>
            </>
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className={cn(
              "inline-flex size-10 items-center justify-center rounded-full transition-colors md:hidden",
              solid
                ? "text-foreground hover:bg-muted"
                : "text-white hover:bg-white/10",
            )}
          >
            <Menu className="size-6" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Full-screen mobile overlay */}
      <div
        className={cn(
          "bg-background fixed inset-0 z-50 flex flex-col md:hidden",
          "transition-[opacity,transform] duration-300",
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="flex h-20 items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-foreground hover:bg-muted inline-flex size-10 items-center justify-center rounded-full transition-colors"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex flex-1 flex-col px-6 pt-6">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-border/60 block border-b py-4 text-2xl font-semibold tracking-tight"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-3 pb-10">
            {buyer ? (
              <>
                <p className="text-muted-foreground text-sm">
                  Signed in as <span className="text-foreground font-medium">{buyer.name}</span>
                </p>
                <Link
                  href="/listings"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")}
                >
                  Browse listings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full rounded-full",
                  )}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/account/login"
                  onClick={() => setOpen(false)}
                  className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full")}
                >
                  Sign in
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full rounded-full",
                  )}
                >
                  Book a consultation
                </Link>
              </>
            )}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground mt-1 text-center text-sm underline underline-offset-2"
            >
              Agent login
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
