import { BackToTop } from "@/modules/marketing/components/back-to-top";
import { MarketingFooter } from "@/modules/marketing/components/marketing-footer";
import { MarketingNav } from "@/modules/marketing/components/marketing-nav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing bg-background text-foreground flex min-h-dvh flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <BackToTop />
    </div>
  );
}
