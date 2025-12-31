import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-success-500/30 bg-success-500/15 text-success-700 font-bold uppercase tracking-wider text-[10px]",
        warning:
          "border-warning-500/30 bg-warning-500/15 text-warning-700 font-bold uppercase tracking-wider text-[10px]",
        danger:
          "border-danger-500/30 bg-danger-500/15 text-danger-700 font-bold uppercase tracking-wider text-[10px]",
        critical:
          "border-danger-600 bg-gradient-to-r from-danger-500 to-danger-600 text-white font-black shadow-md shadow-danger-500/25 animate-gentle-pulse uppercase tracking-widest text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
