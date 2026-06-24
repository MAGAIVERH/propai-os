import { ModuleHeader } from "@/components/module-header";
import { SettingsNav } from "@/modules/settings/components/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <ModuleHeader
        label="Module"
        title="Settings"
        description="Manage your organization, team members, billing, and branding."
      />
      <SettingsNav />
      <div>{children}</div>
    </div>
  );
}
