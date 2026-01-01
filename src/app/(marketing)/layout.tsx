import { BackToTop } from "@/components/marketing/back-to-top";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";

export default function MarketingV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <MarketingNav />
      {children}
      <MarketingFooter />
      <BackToTop />
    </div>
  );
}
