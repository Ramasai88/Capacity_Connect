"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
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
import { exportSkillGapCSV } from "@/lib/export/csv-export";
import { exportSkillGapPDF } from "@/lib/export/pdf-export";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Download,
  FileText,
  Loader2,
  Users,
} from "lucide-react";

export default function SkillGapsPage() {
  const demoStore = useDemoStore();
  const [realSummaries, setRealSummaries] = useState<any[]>([]);
  const [realOrgSummary, setRealOrgSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [listRes, sumRes] = await Promise.all([
        apiClient.skillGaps.list(),
        apiClient.skillGaps.summary(),
      ]);
      setRealSummaries(listRes.data || []);
      setRealOrgSummary(sumRes.data || null);
    } catch (err) {
      console.error("Failed to load real skill gaps:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  const employeeSummaries: any[] = isDemoMode()
    ? demoStore.employeeSummaries
    : realSummaries;

  const organizationSummary = isDemoMode()
    ? demoStore.organizationSummary
    : realOrgSummary || {
        totalEmployees: employeeSummaries.length,
        totalCompetencies: 4,
        totalGapsIdentified: employeeSummaries.reduce((acc, e) => acc + (e.needsImprovementCount || 0), 0),
        meetsRequirementTotal: employeeSummaries.reduce((acc, e) => acc + (e.meetsRequirementCount || 0), 0),
        needsImprovementTotal: employeeSummaries.reduce((acc, e) => acc + (e.needsImprovementCount || 0), 0),
        notAssessedTotal: employeeSummaries.reduce((acc, e) => acc + (e.notAssessedCount || 0), 0),
        competencySummaries: [],
      };

  // Flatten all gap entries for the organization-wide table
  const allGapRows: {
    employeeId: string;
    employeeName: string;
    designation: string;
    competencyId: string;
    competencyName: string;
    category?: string;
    requiredLevel: number;
    currentLevel: number | null;
    gap: number;
    status: "MEETS_REQUIREMENT" | "NEEDS_IMPROVEMENT" | "NOT_ASSESSED";
  }[] = [];

  for (const emp of employeeSummaries) {
    for (const g of emp.gaps || []) {
      allGapRows.push({
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        designation: emp.designationTitle,
        competencyId: g.competencyId,
        competencyName: g.competencyName,
        category: g.category,
        requiredLevel: g.requiredLevel,
        currentLevel: g.currentLevel,
        gap: g.gap,
        status: g.status,
      });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Skill Gap Analysis</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Evaluates role competency requirements vs. current employee proficiency:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">
              gap = max(0, Required - Current)
            </code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportSkillGapCSV(employeeSummaries)}
            className="h-8 text-xs gap-1.5 shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportSkillGapPDF(employeeSummaries, organizationSummary)}
            className="h-8 text-xs gap-1.5 shadow-2xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Calculating organizational skill gaps...
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Gaps Identified
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {organizationSummary.totalGapsIdentified}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {organizationSummary.totalEmployees} active employees
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Meets Requirement
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {organizationSummary.meetsRequirementTotal}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Competencies at or above required level
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Needs Improvement
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {organizationSummary.needsImprovementTotal}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active developmental skill gaps (gap &gt; 0)
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Not Assessed
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  <HelpCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-slate-700">
                  {organizationSummary.notAssessedTotal}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Unassessed baseline competencies
                </p>
              </CardContent>
            </Card>
          </div>

          {/* All Employee Competency Gaps Table */}
          <Card className="shadow-xs">
            <CardHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Organization-Wide Skill Gap Matrix
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Showing all {allGapRows.length} assessed employee-competency mappings
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {organizationSummary.totalEmployees} Employees Evaluated
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Competency</TableHead>
                    <TableHead>Required Level</TableHead>
                    <TableHead>Current Level</TableHead>
                    <TableHead>Skill Gap</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allGapRows.map((row, idx) => (
                    <TableRow key={`${row.employeeId}-${row.competencyId}-${idx}`}>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {row.employeeName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.designation}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-indigo-700 dark:text-indigo-400">
                          {row.competencyName}
                        </div>
                        {row.category && (
                          <div className="text-[10px] text-muted-foreground">{row.category}</div>
                        )}
                      </TableCell>
                      <TableCell className="w-40">
                        <LevelIndicator currentLevel={row.requiredLevel} requiredLevel={row.requiredLevel} showLabels={false} />
                      </TableCell>
                      <TableCell className="w-40">
                        <LevelIndicator currentLevel={row.currentLevel} requiredLevel={row.requiredLevel} showLabels={false} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-mono text-xs font-bold ${
                            row.gap > 0
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {row.gap > 0 ? `-${row.gap}` : "0"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <GapStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/skill-gaps/${row.employeeId}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 font-semibold hover:text-indigo-600">
                            Breakdown <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
