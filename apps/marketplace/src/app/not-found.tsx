import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-28 text-center">
      <p className="text-primary text-6xl font-bold">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Go home
        </Link>
        <Link
          href="/properties"
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
        >
          Browse listings
        </Link>
      </div>
    </main>
  );
}
