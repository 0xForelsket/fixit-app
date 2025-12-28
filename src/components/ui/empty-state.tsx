import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type LucideIcon, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500",
        "bg-zinc-50/50 industrial-grid",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border mb-4">
        <Icon className="h-8 w-8 text-primary-500" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {children && <div className="mt-6">{children}</div>}

      {action && (
        <div className="mt-8">
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}
