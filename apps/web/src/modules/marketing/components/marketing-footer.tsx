import { Building2 } from "lucide-react";
import Link from "next/link";

import { FAIR_HOUSING } from "../content";

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How it works", href: "#how-it-works" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Start free", href: "/signup" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border/60 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                <Building2 className="size-4" aria-hidden="true" />
              </span>
              <span>PropAI OS</span>
            </Link>
            <p className="text-muted-foreground max-w-xs text-sm">
              The AI-powered operating system for US real estate brokerages.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h3 className="text-foreground mb-3 text-sm font-medium">{group.heading}</h3>
              <ul className="space-y-2 text-sm">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border/60 mt-10 space-y-3 border-t pt-6">
          <p className="text-muted-foreground text-xs leading-relaxed">{FAIR_HOUSING}</p>
          <p className="text-muted-foreground text-xs">
            © {year} PropAI OS. PropAI OS is a software platform for brokerages, not a licensed
            real estate brokerage.
          </p>
        </div>
      </div>
    </footer>
  );
}
