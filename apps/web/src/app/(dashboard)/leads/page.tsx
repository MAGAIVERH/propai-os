import { Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Leads"
        description="Track prospects and nurture your sales pipeline."
      />
      <EmptyState
        icon={Users}
        title="No leads yet"
        description="Leads from your website, marketplace, and campaigns will show up here for follow-up."
      />
    </div>
  );
}
