import * as React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GapStatus } from "@/lib/skill-gap/calculateSkillGap";
import { cn } from "@/lib/utils";

interface GapStatusBadgeProps {
  status: GapStatus;
  gap?: number;
  showIcon?: boolean;
  className?: string;
}

export function GapStatusBadge({
  status,
  gap,
  showIcon = true,
  className,
}: GapStatusBadgeProps) {
  if (status === "MEETS_REQUIREMENT") {
    return (
      <Badge
        variant="success"
        className={cn("gap-1.5 font-semibold py-0.5 px-2.5 shadow-2xs", className)}
      >
        {showIcon && <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />}
        <span>Meets Requirement</span>
      </Badge>
    );
  }

  if (status === "NEEDS_IMPROVEMENT") {
    return (
      <Badge
        variant="warning"
        className={cn("gap-1.5 font-semibold py-0.5 px-2.5 shadow-2xs", className)}
      >
        {showIcon && <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />}
        <span>
          Needs Improvement {typeof gap === "number" && gap > 0 ? `(Gap: ${gap})` : ""}
        </span>
      </Badge>
    );
  }

  // NOT_ASSESSED
  return (
    <Badge
      variant="secondary"
      className={cn("gap-1.5 font-medium py-0.5 px-2.5 text-slate-500", className)}
    >
      {showIcon && <HelpCircle className="h-3 w-3 text-slate-400 shrink-0" />}
      <span>Not Assessed</span>
    </Badge>
  );
}
