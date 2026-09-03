import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-2xs",
        secondary:
          "border-slate-200/80 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        destructive:
          "border-rose-200/80 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
        outline: "border-border text-foreground bg-white/60",
        success:
          "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        warning:
          "border-amber-200/80 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        info:
          "border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
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
