import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-28 text-center">
      <span className="border-border flex size-14 items-center justify-center rounded-2xl border text-2xl">
        ⌂
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">Listing unavailable</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This property may have been sold, rented, or taken off the market.
      </p>
      <Link
        href="/properties"
        className="bg-primary text-primary-foreground mt-8 rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Browse other listings
      </Link>
    </main>
  );
}
