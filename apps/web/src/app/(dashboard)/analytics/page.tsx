import { PageHeader } from "@/components/page-header";
import { AnalyticsDashboard } from "@/modules/analytics/components/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Insights on listings performance, lead conversion, and team activity."
      />
      <AnalyticsDashboard />
    </div>
  );
}
