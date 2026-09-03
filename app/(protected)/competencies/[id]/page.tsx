"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { ArrowLeft, BadgeCheck, CheckCircle2, Briefcase, Loader2 } from "lucide-react";

export default function CompetencyDetailPage() {
  const params = useParams();
  const compId = params.id as string;

  const demoStore = useDemoStore();
  const [realCompetency, setRealCompetency] = useState<any | null>(null);
  const [realDesignations, setRealDesignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [compRes, desigRes] = await Promise.all([
        apiClient.competencies.getById(compId),
        apiClient.designations.list(),
      ]);
      setRealCompetency(compRes.data);
      setRealDesignations(desigRes.data || []);
    } catch (err) {
      console.error("Failed to load competency detail:", err);
    } finally {
      setIsLoading(false);
    }
  }, [compId]);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  const currentComp = isDemoMode()
    ? demoStore.competencies.find((c) => c.id === compId) || demoStore.competencies[0]
    : realCompetency;

  const designations = isDemoMode() ? demoStore.designations : realDesignations;

  if (!currentComp && !isLoading) {
    notFound();
  }

  if (isLoading || !currentComp) {
    return (
      <div className="flex items-center justify-center py-24 text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading rubric definition...
      </div>
    );
  }

  const requiringDesignations = designations.filter((d: any) =>
    (d.requirements || []).some((r: any) => r.competencyId === currentComp.id)
  );

  const levelColorMap: Record<number, string> = {
    1: "bg-slate-100 text-slate-800 border-slate-200",
    2: "bg-sky-50 text-sky-800 border-sky-200",
    3: "bg-indigo-50 text-indigo-800 border-indigo-200",
    4: "bg-violet-50 text-violet-800 border-violet-200",
    5: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <Link
          href="/competencies"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Competencies
        </Link>
      </div>

      {/* Header Card */}
      <Card className="shadow-xs">
        <CardHeader className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                  <BadgeCheck className="h-5 w-5 shrink-0" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">{currentComp.name}</h1>
                  <Badge variant="secondary" className="text-[11px] font-medium mt-0.5">
                    {currentComp.category}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2 leading-relaxed max-w-3xl">
                {currentComp.description}
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs self-start px-2.5 py-1 bg-slate-50 shadow-2xs">
              {currentComp.code}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 5-Level Rubric */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <CardTitle className="text-base">Universal 5-Level Rubric Scale</CardTitle>
          <CardDescription className="text-xs">
            Standardized behavioral benchmarks and assessment criteria for {currentComp.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3.5">
          {(currentComp.levels || []).map((lvl: any) => (
            <div
              key={lvl.level}
              className="flex flex-col gap-3.5 rounded-xl border border-border/80 p-4 sm:flex-row sm:items-start sm:gap-4 transition-all hover:bg-slate-50/60 shadow-2xs"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono font-bold text-sm border shadow-2xs ${levelColorMap[lvl.level] || levelColorMap[1]}`}>
                L{lvl.level}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {lvl.label || lvl.name || `Level ${lvl.level}`}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Scale {lvl.level} / 5
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lvl.description}
                </p>
                {lvl.behavioralIndicators && lvl.behavioralIndicators.length > 0 && (
                  <div className="pt-1.5">
                    <span className="text-[11px] font-semibold text-foreground block mb-1.5">
                      Key Behavioral Indicators:
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {lvl.behavioralIndicators.map((ind: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-muted-foreground bg-white p-1.5 rounded-lg border border-slate-200/60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Role Requirements Mapping */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <div>
              <CardTitle className="text-base">Role Requirement Mappings</CardTitle>
              <CardDescription className="text-xs">
                Designations that require proficiency in {currentComp.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {requiringDesignations.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 italic">
              No designations currently list {currentComp.name} as a mandatory requirement.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {requiringDesignations.map((desig: any) => {
                const req = (desig.requirements || []).find(
                  (r: any) => r.competencyId === currentComp.id
                );
                return (
                  <div
                    key={desig.id}
                    className="flex flex-col justify-between rounded-xl border border-border/80 p-3.5 bg-slate-50/50 shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        {desig.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {desig.department || "General"}
                      </div>
                    </div>
                    {req && (
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2">
                        <span className="text-[11px] text-muted-foreground">
                          Target Baseline:
                        </span>
                        <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                          Level {req.requiredLevel}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
