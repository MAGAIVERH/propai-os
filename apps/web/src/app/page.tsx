import { APP_NAME, PRODUCT_TAGLINE } from "@propai/shared";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-6">
      <Card className="border-border w-full max-w-lg rounded-2xl border">
        <CardHeader className="space-y-3">
          <div className="bg-primary/15 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
            <Building2 className="h-4 w-4" />
          </div>
          <p className="text-primary text-sm font-medium tracking-[0.18em] uppercase">Platform</p>
          <CardTitle className="text-3xl tracking-tight">{APP_NAME}</CardTitle>
          <CardDescription className="text-sm leading-7">
            {PRODUCT_TAGLINE}. Monorepo scaffold active — dashboard at apps/web.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Day 3 — Monorepo</Badge>
          <Badge className="bg-success/15 text-success">shadcn/ui</Badge>
          <Button type="button" variant="default">
            Get started
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
