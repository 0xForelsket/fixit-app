import { cn } from "@/lib/utils";
import Link from "next/link";
import type React from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;

  // Styling
  color?: string; // Text color for icon/value usually
  bg?: string; // Background color for icon container or card
  border?: string; // Border color

  // Interaction/Animation
  href?: string;
  pulse?: boolean;
  delay?: number;

  // Variant
  variant?: "default" | "admin";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color,
  bg,
  border,
  href,
  pulse = false,
  delay = 0,
  variant = "default",
}: StatsCardProps) {
  // Admin Variant Content
  const AdminContent = (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm border border-black/5",
          bg
          // If bg is white/light, we might want color applied to text inside
          // The admin card used `color` class on the container in previous implementation
        )}
      >
        <Icon className={cn("h-6 w-6", color)} />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-black tracking-tight text-zinc-900">
          {typeof value === "number" ? String(value).padStart(2, "0") : value}
        </h3>
        {description && (
          <p className="text-xs text-zinc-500 font-medium">{description}</p>
        )}
      </div>
    </div>
  );

  // Default (Technician) Variant Content
  const DefaultContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-inner border border-white/50",
            bg
          )}
        >
          <Icon className={cn("h-6 w-6", color)} />
        </div>
        <div className="h-1 w-12 bg-zinc-100 rounded-full" />
      </div>

      <div className="space-y-1">
        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <h3
          className={cn(
            "text-2xl sm:text-3xl font-black tracking-tight",
            color
          )}
        >
          {typeof value === "number" ? String(value).padStart(2, "0") : value}
        </h3>
        {description && (
          <p className="text-xs text-zinc-500 font-medium">{description}</p>
        )}
      </div>
    </>
  );

  // Container Classes
  const baseClasses =
    "relative overflow-hidden rounded-2xl border bg-white transition-all duration-300";

  const variantClasses = {
    default: cn(
      "flex flex-col justify-between p-3 card-industrial shadow-sm",
      border,
      pulse &&
        typeof value === "number" &&
        value > 0 &&
        "animate-glow-pulse border-danger-300",
      delay && `animate-stagger-${delay} animate-in`,
      href &&
        "cursor-pointer hover:border-primary-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
    ),
    admin: cn(
      "p-4 hover:shadow-md hover:border-zinc-300"
      // Admin variant usually has simple border, handled by base or passed in
    ),
  };

  const className = cn(baseClasses, variantClasses[variant]);

  const content = variant === "admin" ? AdminContent : DefaultContent;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
