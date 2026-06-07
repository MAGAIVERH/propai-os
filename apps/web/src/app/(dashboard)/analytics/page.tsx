import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Analytics"
        description="Insights on listings performance, lead conversion, and team activity."
      />
      <EmptyState
        icon={BarChart3}
        title="No analytics data"
        description="Charts and reports will populate as you add properties, leads, and complete visits."
      />
    </div>
  );
}
