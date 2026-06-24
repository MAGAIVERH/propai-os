import { CardSkeletonGrid } from "@/components/card-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16">
      <div className="bg-muted mb-8 h-7 w-48 animate-pulse rounded" />
      <CardSkeletonGrid />
    </main>
  );
}
