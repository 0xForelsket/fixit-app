import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function PageContainer({ children, className, id }: PageContainerProps) {
  return (
    <div
      id={id}
      className={cn(
        "mx-auto max-w-7xl h-full space-y-8 animate-in relative",
        className
      )}
    >
      {children}
    </div>
  );
}
