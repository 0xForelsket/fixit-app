import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageLayoutProps {
  /** The main title of the page */
  title: string;
  /** Small subtitle above the title */
  subtitle?: string;
  /** Descriptive text below the title */
  description?: string;
  /** Large background decorative symbol */
  bgSymbol?: string;
  /** Actions to display in the header (buttons, links) */
  headerActions?: ReactNode;
  /** Stats section to display below the header */
  stats?: ReactNode;
  /** Filters section to display below stats */
  filters?: ReactNode;
  /** Main page content */
  children: ReactNode;
  /** ID for the page container */
  id?: string;
  /** Additional classes for the page container */
  className?: string;
  /** Whether to use the compact header variant. Defaults to true. */
  compactHeader?: boolean;
}

export function PageLayout({
  title,
  subtitle,
  description,
  bgSymbol,
  headerActions,
  stats,
  filters,
  children,
  id,
  className,
  compactHeader = true,
}: PageLayoutProps) {
  return (
    <PageContainer id={id} className={cn("space-y-8", className)}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        description={description}
        bgSymbol={bgSymbol}
        compact={compactHeader}
        actions={headerActions}
      />

      {stats && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
          {stats}
        </section>
      )}

      {filters && (
        <section className="relative z-[100] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
          {filters}
        </section>
      )}

      <div className="relative z-0 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 fill-mode-both">
        {children}
      </div>
    </PageContainer>
  );
}
