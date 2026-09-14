"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
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
import { AccessDenied } from "@/components/auth/access-denied";
import { exportReportsCSV } from "@/lib/export/csv-export";
import { exportExecutiveReportPDF } from "@/lib/export/pdf-export";
import { FileText, Download, TrendingUp, Loader2, BarChart3, Building } from "lucide-react";

export default function ReportsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";

  const demoStore = useDemoStore();
  const [realReport, setRealReport] = useState<any | null>(null);
  const [realEmployees, setRealEmployees] = useState<any[]>([]);
  const [realSummaries, setRealSummaries] = useState<any[]>([]);
  const [realCourses, setRealCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [repRes, empRes, gapRes, crsRes] = await Promise.all([
        apiClient.reports.summary(),
        apiClient.employees.list(),
        apiClient.skillGaps.list(),
        apiClient.courses.list(),
      ]);
      setRealReport(repRes.data);
      setRealEmployees(empRes.data || []);
      setRealSummaries(gapRes.data || []);
      setRealCourses(crsRes.data || []);
    } catch (err) {
      console.error("Failed to load real reports data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  if (role === "EMPLOYEE") {
    return (
      <AccessDenied
        requiredRole="MANAGER or ADMIN"
        currentRole="EMPLOYEE"
        resourceName="Executive Capacity Reports & Analytics"
      />
    );
  }

  const employees: any[] = isDemoMode() ? demoStore.employees : realEmployees;
  const employeeSummaries: any[] = isDemoMode() ? demoStore.employeeSummaries : realSummaries;

  const organizationSummary = isDemoMode()
    ? demoStore.organizationSummary
    : realReport?.skillGapsSummary || {
        totalRequired: 0,
        meetsRequirementTotal: 0,
        needsImprovementTotal: 0,
        notAssessedTotal: 0,
        totalGapsIdentified: 0,
      };

  // Calculate department breakdowns
  const departmentStats = new Map<
    string,
    { total: number; meets: number; gaps: number }
  >();

  if (realReport?.departmentMetrics && realReport.departmentMetrics.length > 0) {
    for (const dm of realReport.departmentMetrics) {
      departmentStats.set(dm.department, {
        total: dm.totalRequired,
        meets: dm.meetsRequirementTotal,
        gaps: dm.needsImprovementTotal,
      });
    }
  } else {
    for (const emp of employees) {
      const summary = employeeSummaries.find((s) => s.employeeId === emp.id);
      const dept = emp.department || "General";
      const existing = departmentStats.get(dept) ?? {
        total: 0,
        meets: 0,
        gaps: 0,
      };

      existing.total += summary?.totalRequired ?? 0;
      existing.meets += summary?.meetsRequirementCount ?? 0;
      existing.gaps += summary?.needsImprovementCount ?? 0;

      departmentStats.set(dept, existing);
    }
  }

  const totalAssessed =
    organizationSummary.meetsRequirementTotal +
    organizationSummary.needsImprovementTotal +
    organizationSummary.notAssessedTotal;

  const overallReadinessPercent =
    totalAssessed > 0
      ? Math.round((organizationSummary.meetsRequirementTotal / totalAssessed) * 100)
      : employees.length > 0 ? 0 : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800/80 animate-slide-up">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-float-reverse" />
        <div className="absolute inset-0 hero-mesh-pattern opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold backdrop-blur-md text-indigo-200 border border-white/15 shadow-2xs">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-300" />
              <span>Executive Reporting Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Capacity & Readiness Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Executive intelligence on workforce competency coverage, departmental readiness indexes, and skill distribution benchmarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportReportsCSV(
                  organizationSummary,
                  employeeSummaries
                )
              }
              className="h-9 text-xs gap-1.5 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white font-semibold btn-premium shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>

            <Button
              size="sm"
              onClick={() =>
                exportExecutiveReportPDF(
                  organizationSummary,
                  employeeSummaries
                )
              }
              className="h-9 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold btn-premium shadow-md border border-indigo-400/30"
            >
              <FileText className="h-3.5 w-3.5" />
              Export Executive PDF
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="font-medium">Generating executive analytics...</span>
        </div>
      ) : (
        <>
          {/* Executive Readiness Card with Hover Lift */}
          <Card className="hover-lift-card animate-slide-up border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      Overall Workforce Capacity Readiness
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Calculated across {employees.length} employees and all mapped competency standards
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="default" className="text-sm font-bold bg-emerald-600 px-3 py-1 font-mono">
                  {overallReadinessPercent}% Readiness
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${overallReadinessPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Departmental Capacity Breakdown */}
          <Card className="shadow-xs">
            <CardHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Building className="h-3.5 w-3.5" />
                </div>
                <div>
                  <CardTitle className="text-base">Departmental Capacity & Gap Distribution</CardTitle>
                  <CardDescription className="text-xs">
                    Competency alignment across organizational divisions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Total Required Requirements</TableHead>
                    <TableHead>Meets Requirements</TableHead>
                    <TableHead>Needs Improvement</TableHead>
                    <TableHead>Department Readiness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.size === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                        No departmental capacity data available yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.from(departmentStats.entries()).map(([dept, stats]) => {
                      const deptReadiness =
                        stats.total > 0
                          ? Math.round((stats.meets / stats.total) * 100)
                          : 100;
                      return (
                        <TableRow key={dept}>
                          <TableCell className="font-bold text-xs text-foreground">
                            {dept}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{stats.total}</TableCell>
                          <TableCell className="text-xs text-emerald-700 font-bold font-mono">
                            {stats.meets}
                          </TableCell>
                          <TableCell className="text-xs text-amber-700 font-bold font-mono">
                            {stats.gaps}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-28 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${deptReadiness}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold font-mono text-slate-700">{deptReadiness}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
