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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { GapStatusBadge } from "@/components/skill-gaps/gap-status-badge";
import { LevelIndicator } from "@/components/skill-gaps/level-indicator";
import {
  ArrowLeft,
  GraduationCap,
  TrendingUp,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function SingleEmployeeSkillGapPage() {
  const params = useParams();
  const employeeId = params.employeeId as string;

  const demoStore = useDemoStore();
  const [realEmployee, setRealEmployee] = useState<any | null>(null);
  const [realSummary, setRealSummary] = useState<any | null>(null);
  const [realCourses, setRealCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [empRes, gapRes, crsRes] = await Promise.all([
        apiClient.employees.getById(employeeId),
        apiClient.skillGaps.getForEmployee(employeeId),
        apiClient.courses.list(),
      ]);
      setRealEmployee(empRes.data);
      setRealSummary(gapRes.data);
      setRealCourses(crsRes.data || []);
    } catch (err) {
      console.error("Failed to load employee skill gap:", err);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  const employee = isDemoMode()
    ? demoStore.employees.find((e) => e.id === employeeId) || demoStore.employees[0]
    : realEmployee;

  const summary = isDemoMode()
    ? demoStore.employeeSummaries.find((s) => s.employeeId === employeeId)
    : realSummary;

  const courses = isDemoMode() ? demoStore.courses : realCourses;

  if (!employee && !isLoading) {
    notFound();
  }

  if (isLoading || !employee) {
    return (
      <div className="flex items-center justify-center py-24 text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Calculating skill gap breakdown...
      </div>
    );
  }

  const designationTitle = employee.designationTitle || employee.designation?.title || "Unassigned";
  const initials = employee.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const weakGaps = summary ? (summary.gaps || []).filter((g: any) => g.status !== "MEETS_REQUIREMENT") : [];
  const recommendations = weakGaps.map((gap: any) => {
    const matchingCourse = courses.find(
      (c: any) => c.competencyId === gap.competencyId && c.status === "PUBLISHED"
    );
    return { gap, course: matchingCourse || null };
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <Link
          href="/skill-gaps"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Skill Gap Analysis
        </Link>
      </div>

      {/* Hero Profile Card */}
      <Card className="shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 text-white font-bold text-base shadow-xs">
                {initials}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">{employee.name}</h1>
                  <Badge variant={employee.status === "ACTIVE" ? "success" : "secondary"} className="text-[10px] font-mono font-bold">
                    {employee.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{employee.email}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-mono">
                  <span className="font-semibold text-slate-700">{employee.employeeCode}</span>
                  <span>•</span>
                  <span className="font-sans">{designationTitle} ({employee.department || "General"})</span>
                </div>
              </div>
            </div>

            {summary && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="success" className="text-xs font-semibold">
                  {summary.meetsRequirementCount} Meets
                </Badge>
                {summary.needsImprovementCount > 0 && (
                  <Badge variant="warning" className="text-xs font-semibold">
                    {summary.needsImprovementCount} Gaps
                  </Badge>
                )}
                {summary.notAssessedCount > 0 && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {summary.notAssessedCount} Unassessed
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <CardTitle className="text-base">Role Competency Requirements vs. Actual Level</CardTitle>
          <CardDescription className="text-xs">
            Dynamic assessment calibrated from PostgreSQL database and competency history
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competency</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Required Level</TableHead>
                <TableHead>Current Level</TableHead>
                <TableHead>Skill Gap</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!summary || (summary.gaps || []).length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No role competency requirements mapped for this designation.
                  </TableCell>
                </TableRow>
              ) : (
                (summary.gaps || []).map((gap: any) => (
                  <TableRow key={gap.competencyId}>
                    <TableCell className="font-semibold text-xs text-foreground">
                      <Link href={`/competencies/${gap.competencyId}`} className="hover:underline text-indigo-700 dark:text-indigo-400">
                        {gap.competencyName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {gap.category || "Technical"}
                    </TableCell>
                    <TableCell className="w-48">
                      <LevelIndicator currentLevel={gap.requiredLevel} requiredLevel={gap.requiredLevel} showLabels={false} />
                    </TableCell>
                    <TableCell className="w-48">
                      <LevelIndicator currentLevel={gap.currentLevel} requiredLevel={gap.requiredLevel} showLabels={false} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono text-xs font-bold ${
                          gap.gap > 0
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {gap.gap > 0 ? `-${gap.gap}` : "0"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <GapStatusBadge status={gap.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommended Developmental Pathways */}
      {recommendations.length > 0 && (
        <Card className="border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
          <CardHeader className="pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <CardTitle className="text-sm">Recommended Developmental Pathways</CardTitle>
                <CardDescription className="text-xs">
                  Targeted capacity-building curriculum to close active skill gaps for {employee.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {recommendations.map(({ gap, course }: any) => (
              <div
                key={gap.competencyId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 gap-3 shadow-2xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{gap.competencyName}</span>
                    <Badge variant="warning" className="text-[10px] font-mono font-bold">
                      Gap: -{gap.gap} Lvl
                    </Badge>
                  </div>
                  {course ? (
                    <div className="text-xs text-muted-foreground">
                      Mapped Course: <span className="font-semibold text-foreground">{course.title}</span> ({course.durationHours} hrs)
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">
                      No published course mapped for this competency yet.
                    </div>
                  )}
                </div>
                {course && (
                  <Link href={`/courses/${course.id}/learn`}>
                    <Button size="sm" className="h-7 text-xs gap-1 font-semibold">
                      <GraduationCap className="h-3.5 w-3.5" />
                      View Course
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
