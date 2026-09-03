import * as React from "react";
import { cn } from "@/lib/utils";

interface LevelIndicatorProps {
  currentLevel: number | null;
  requiredLevel: number;
  maxLevel?: number;
  showLabels?: boolean;
}

export function LevelIndicator({
  currentLevel,
  requiredLevel,
  maxLevel = 5,
  showLabels = true,
}: LevelIndicatorProps) {
  const steps = Array.from({ length: maxLevel }, (_, i) => i + 1);
  const curr = currentLevel ?? 0;
  const meets = curr >= requiredLevel;
  const gap = Math.max(0, requiredLevel - curr);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {steps.map((level) => {
          const isCurrentOrBelow = curr >= level;
          const isCurrentExact = curr === level;
          const isRequiredExact = requiredLevel === level;
          const isInGapZone = level > curr && level <= requiredLevel;

          let bgClass = "bg-slate-100 border border-slate-200/80";
          if (isCurrentOrBelow) {
            bgClass = meets
              ? "bg-emerald-500 text-white shadow-xs shadow-emerald-500/20 border border-emerald-600"
              : "bg-indigo-600 text-white shadow-xs shadow-indigo-600/20 border border-indigo-700";
          } else if (isInGapZone) {
            bgClass = "bg-amber-100 border border-amber-300/80 text-amber-800";
          }

          return (
            <div
              key={level}
              className="group relative flex-1"
              title={`Level ${level}: ${isCurrentExact ? "Current Level" : ""} ${isRequiredExact ? "Required Target" : ""}`}
            >
              <div
                className={cn(
                  "h-3 rounded-md transition-all flex items-center justify-center text-[9px] font-bold font-mono",
                  bgClass
                )}
              >
                {isCurrentExact && !meets && "●"}
                {isRequiredExact && "◆"}
                {isCurrentExact && meets && "✓"}
              </div>
            </div>
          );
        })}
      </div>

      {showLabels && (
        <div className="flex items-center justify-between text-[11px] leading-tight">
          <span className="flex items-center gap-1 text-slate-600">
            Current:{" "}
            <strong className={cn(
              "font-mono px-1.5 py-0.5 rounded text-[10px]",
              curr > 0
                ? meets ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-indigo-100 text-indigo-800 font-bold"
                : "bg-slate-100 text-slate-600"
            )}>
              {curr > 0 ? `L${curr}` : "Unassessed"}
            </strong>
          </span>

          <span className="flex items-center gap-1 text-slate-600">
            Target:{" "}
            <strong className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
              {`L${requiredLevel}`}
            </strong>
          </span>

          {gap > 0 ? (
            <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Gap: {gap} Lvl
            </span>
          ) : (
            <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Met
            </span>
          )}
        </div>
      )}
    </div>
  );
}
