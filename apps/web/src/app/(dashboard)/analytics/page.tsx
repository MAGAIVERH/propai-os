import { ModuleHeader } from "@/components/module-header";
import { AnalyticsDashboard } from "@/modules/analytics/components/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Analytics"
        description="Insights on listings performance, lead conversion, and team activity."
      />
      <AnalyticsDashboard />
    </div>
  );
}
