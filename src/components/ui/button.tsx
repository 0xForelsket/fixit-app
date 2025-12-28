import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white shadow-md hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-danger-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:shadow-sm",
        outline:
          "border-2 border-zinc-200 bg-white shadow-sm hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/10 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200",
        secondary:
          "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200 hover:shadow-md active:scale-[0.98]",
        ghost:
          "hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest",
        sm: "h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-wider",
        lg: "h-14 rounded-full px-8 text-sm font-black uppercase tracking-widest",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
