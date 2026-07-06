import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { PageTransition } from "@/components/page-transition";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Dashboard pages are authenticated (gated by proxy) and depend on the
// signed-in session, so they must render per-request rather than being
// statically prerendered at build time.
export const dynamic = "force-dynamic";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
