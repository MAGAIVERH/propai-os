import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm leading-6">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Back home
        </Link>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
