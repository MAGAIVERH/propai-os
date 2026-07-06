"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuyerSession } from "@/modules/account/use-buyer-session";

import { BrandLogo } from "./brand-logo";

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
          <Link
            href="/login"
            className={cn(
              "hidden text-sm font-medium transition-colors lg:inline-flex",
              linkTone,
            )}
          >
            Agent login
          </Link>

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
              <Link
                href="/account/login"
                className={cn(
                  "hidden text-sm font-medium transition-colors sm:inline-flex",
                  linkTone,
                )}
              >
                Sign in
              </Link>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden rounded-full sm:inline-flex",
                  solid ? "" : "bg-white text-neutral-950 hover:bg-white/90",
                )}
              >
                Book a consultation
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
