import React from "react";
import { cn } from "../../lib/utils";

export const Card = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm", className)}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <h3 className={cn("font-semibold leading-none tracking-tight text-lg", className)}>{children}</h3>
);

export const CardContent = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("p-6 pt-0", className)}>{children}</div>
);