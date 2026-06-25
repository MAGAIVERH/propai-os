import { MarketingFooter } from "@/modules/marketing/components/marketing-footer";
import { MarketingNav } from "@/modules/marketing/components/marketing-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
