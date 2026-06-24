import Link from "next/link";

export function SiteFooter({ agencyName }: { agencyName?: string | null }) {
  const year = new Date().getFullYear();
  const name = agencyName ?? "PropAI OS";

  return (
    <footer className="border-border bg-card/40 mt-20 border-t">
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg text-sm font-bold">
                {name.charAt(0).toUpperCase()}
              </span>
              {name}
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              AI-native real estate for modern US brokerages.
            </p>
          </div>

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Explore
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/properties" className="text-muted-foreground hover:text-foreground">
                  Browse listings
                </Link>
              </li>
              <li>
                <Link
                  href="/properties/map"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Map view
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground">
                  AI search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Company
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Legal
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Fair Housing disclaimer — legally required for US real estate listings. */}
        <div className="border-border mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-muted-foreground flex items-start gap-3 text-xs">
            <span
              aria-hidden
              className="border-border mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border font-bold"
              title="Equal Housing Opportunity"
            >
              ⌂=
            </span>
            <p className="max-w-2xl leading-relaxed">
              <span className="text-foreground font-medium">Equal Housing Opportunity.</span> PropAI
              OS is committed to the letter and spirit of U.S. policy for the achievement of equal
              housing opportunity. We do not discriminate based on race, color, religion, sex,
              handicap, familial status, or national origin. All listings are subject to the Fair
              Housing Act.
            </p>
          </div>
          <p className="text-muted-foreground shrink-0 text-xs">
            © {year} {name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
