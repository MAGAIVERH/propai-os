import { CalendarCheck } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";

export default function VisitsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Visits"
        description="Schedule and manage property showings with your team."
      />
      <EmptyState
        icon={CalendarCheck}
        title="No visits scheduled"
        description="Upcoming showings and open houses will appear here once you start booking appointments."
      />
    </div>
  );
}
