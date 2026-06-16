import { APP_NAME } from "@propai/shared";
import { Building2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateBrokerageForm } from "@/modules/auth/components/create-brokerage-form";

export default function SetupPage() {
  return (
    <Card className="rounded-2xl border border-border">
      <CardHeader className="space-y-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Building2 className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Brokerage
        </p>
        <CardTitle className="text-3xl font-bold tracking-tight">
          Set up your brokerage
        </CardTitle>
        <CardDescription className="text-sm leading-7">
          Your account is ready. Now create a brokerage to start managing your
          organization on {APP_NAME}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateBrokerageForm />
      </CardContent>
    </Card>
  );
}
