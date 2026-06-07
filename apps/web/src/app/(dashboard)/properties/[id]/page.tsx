import Link from "next/link";

import { ModuleHeader } from "@/components/module-header";
import { Button } from "@/components/ui/button";

type PropertyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Módulo"
        title="Detalhe do imóvel"
        description="Página de detalhe em construção — disponível no Day 24+."
      />
      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">ID do imóvel</p>
        <p className="mt-1 font-mono text-sm text-foreground">{id}</p>
        <Link href="/properties" className="mt-6 inline-block">
          <Button variant="outline">Voltar para a lista</Button>
        </Link>
      </section>
    </div>
  );
}
