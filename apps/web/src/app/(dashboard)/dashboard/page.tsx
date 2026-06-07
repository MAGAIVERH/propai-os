import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Dashboard"
        description="Overview of your brokerage workspace. Metrics and activity summaries will appear here."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="No activity yet"
        description="Your dashboard will show key metrics, recent leads, and upcoming visits once data is available."
      />
    </div>
  );
}
