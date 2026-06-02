import { APP_NAME, PRODUCT_TAGLINE } from "@propai/shared";

export default function MarketplaceHome() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Marketplace</p>
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground text-sm leading-7">{PRODUCT_TAGLINE}</p>
        <p className="text-muted-foreground text-sm">
          Public property search (SEO/SSR) — semantic search and lead capture ship in Phase 1.
        </p>
      </main>
      <footer className="border-border mt-auto border-t px-6 py-6 text-center text-xs text-muted-foreground">
        <p>
          Equal Housing Opportunity. PropAI OS does not discriminate based on race, color,
          religion, sex, handicap, familial status, or national origin.
        </p>
      </footer>
    </>
  );
}
