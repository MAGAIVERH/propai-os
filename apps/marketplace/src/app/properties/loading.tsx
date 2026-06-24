import { CardSkeletonGrid } from "@/components/card-skeleton";

export default function PropertiesLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
      <div className="bg-muted mb-8 h-7 w-56 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="rounded-card bg-card h-96 animate-pulse" />
        <CardSkeletonGrid />
      </div>
    </main>
  );
}
