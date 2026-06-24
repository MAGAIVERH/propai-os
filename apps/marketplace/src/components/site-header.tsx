import Link from "next/link";

const NAV_LINKS = [
  { href: "/properties", label: "Browse" },
  { href: "/properties/map", label: "Map" },
  { href: "/search", label: "AI Search" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  agencyName,
  logoUrl,
}: {
  agencyName?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={agencyName ?? "Logo"} className="h-7 w-auto rounded" />
          ) : (
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg text-sm font-bold">
              {(agencyName ?? "P").charAt(0).toUpperCase()}
            </span>
          )}
          <span className="text-base">
            {agencyName ?? (
              <>
                PropAI<span className="text-primary"> OS</span>
              </>
            )}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-2 text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/search"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 sm:hidden"
        >
          Search
        </Link>
      </div>
    </header>
  );
}
