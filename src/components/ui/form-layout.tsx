import { cn } from "@/lib/utils";
import * as React from "react";
import { Label } from "./label";

interface FieldGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  (
    { label, error, description, required, children, className, ...props },
    ref
  ) => {
    const id = React.useId();
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <Label htmlFor={id} className={cn(error && "text-destructive")}>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
        <div id={id}>{children}</div>
        {description && (
          <p className="text-[10px] text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-[10px] font-medium text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
FieldGroup.displayName = "FieldGroup";

const FormGrid = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => (
  <div className={cn("grid gap-6 md:grid-cols-2", className)}>{children}</div>
);

const FormSection = ({
  title,
  children,
  className,
}: { title?: string; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-4", className)}>
    {title && (
      <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 border-b border-border/50 pb-2">
        {title}
      </h3>
    )}
    {children}
  </div>
);

export { FieldGroup, FormGrid, FormSection };
