import { Settings } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { ModuleHeader } from "@/components/module-header";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Settings"
        description="Configure your organization, team members, and workspace preferences."
      />
      <EmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Organization profile, team invites, and notification preferences will be available in a future release."
      />
    </div>
  );
}
