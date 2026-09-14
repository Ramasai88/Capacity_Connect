"use client";

import Link from "next/link";
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
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import {
  Users,
  BadgeCheck,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Activity,
  Layers,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";
  const isEmployeeRole = role === "EMPLOYEE";

  const demoStore = useDemoStore();
  const [realReport, setRealReport] = useState<any | null>(null);
  const [realEmployees, setRealEmployees] = useState<any[]>([]);
  const [realCourses, setRealCourses] = useState<any[]>([]);
  const [realEnrollments, setRealEnrollments] = useState<any[]>([]);
  const [realReassessments, setRealReassessments] = useState<any[]>([]);
  const [realSummaries, setRealSummaries] = useState<any[]>([]);
  const [employeeDevData, setEmployeeDevData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      if (isEmployeeRole) {
        const [devRes, crsRes] = await Promise.all([
          apiClient.myDevelopment.get().catch(() => ({ data: null })),
          apiClient.courses.list().catch(() => ({ data: [] })),
        ]);
        setEmployeeDevData(devRes?.data || null);
        setRealCourses(crsRes?.data || []);
      } else {
        const [repRes, empRes, crsRes, enrRes, reassRes, gapRes] = await Promise.all([
          apiClient.reports.summary().catch(() => ({ data: null })),
          apiClient.employees.list().catch(() => ({ data: [] })),
          apiClient.courses.list().catch(() => ({ data: [] })),
          apiClient.learning.getEnrollments().catch(() => ({ data: [] })),
          apiClient.reassessments.list().catch(() => ({ data: [] })),
          apiClient.skillGaps.list().catch(() => ({ data: [] })),
        ]);
        setRealReport(repRes?.data || null);
        setRealEmployees(empRes?.data || []);
        setRealCourses(crsRes?.data || []);
        setRealEnrollments(enrRes?.data || []);
        setRealReassessments(reassRes?.data || []);
        setRealSummaries(gapRes?.data || []);
      }
    } catch (err) {
      console.error("Failed to load real dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isEmployeeRole]);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  // Derived data for Admin / Manager
  const employees = isDemoMode() ? demoStore.employees : realEmployees;
  const competenciesCount = isDemoMode()
    ? demoStore.competencies.length
    : (realReport?.metrics?.totalCompetencies ?? 0);
  const designationsCount = isDemoMode()
    ? demoStore.designations.length
    : (realReport?.metrics?.totalDesignations ?? 0);
  const courses = isDemoMode() ? demoStore.courses : realCourses;
  const reassessments = isDemoMode() ? demoStore.reassessments : realReassessments;
  const employeeSummaries = isDemoMode() ? demoStore.employeeSummaries : realSummaries;
  const overallReadiness = isDemoMode()
    ? 50
    : (realReport?.metrics?.overallReadinessPercent ?? (employees.length === 0 ? 100 : 0));
  const orgName = realReport?.organizationName || "Capacity Connect";

  // Find high priority gaps (gap >= 1)
  const criticalGaps: {
    employeeId: string;
    employeeName: string;
    designation: string;
    competencyName: string;
    requiredLevel: number;
    currentLevel: number | null;
    gap: number;
  }[] = [];

  for (const emp of employeeSummaries) {
    for (const g of emp.gaps || []) {
      if (g.gap > 0) {
        criticalGaps.push({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          designation: emp.designationTitle,
          competencyName: g.competencyName,
          requiredLevel: g.requiredLevel,
          currentLevel: g.currentLevel,
          gap: g.gap,
        });
      }
    }
  }

  const pendingReassessments = reassessments.filter(
    (r: any) => r.status === "PENDING_REASSESSMENT"
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800/80 animate-slide-up">
        {/* Floating Decorative Elements */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-float-reverse" />
        <div className="absolute inset-0 hero-mesh-pattern opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold backdrop-blur-md text-indigo-200 border border-white/15 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <Activity className="h-3 w-3 text-indigo-300 ml-0.5" />
              <span>{isEmployeeRole ? "Personal Skill Profile" : "Real-Time Workforce Analytics"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {session?.user?.name || "User"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isEmployeeRole
                ? "Monitor your competency profile, diagnostic assessment roadmap, and active learning milestones."
                : `Comprehensive workforce capacity and organizational skill readiness overview for ${orgName}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!isEmployeeRole && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[11px] text-slate-300 font-medium">Readiness:</span>
                <span className="text-sm font-extrabold text-emerald-400">{overallReadiness}%</span>
              </div>
            )}
            <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20 font-mono py-1 px-2.5">
              Role: <strong className="ml-1 uppercase text-indigo-200">{role}</strong>
            </Badge>
            {!isDemoMode() && (
              <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border-0 font-semibold py-1 px-2.5">
                Live PostgreSQL
              </Badge>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-xs text-muted-foreground gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
          <span className="font-medium">Loading live capacity metrics...</span>
        </div>
      ) : isEmployeeRole ? (
        /* ================= EMPLOYEE ROLE DASHBOARD ================= */
        <div className="space-y-6">
          {/* Employee KPI Overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-lift-card animate-slide-up stagger-1 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Role Competencies
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs">
                  <Layers className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-foreground">
                  {employeeDevData?.skillGapSummary?.totalRequired ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Required for {employeeDevData?.employee?.designationTitle ?? "Designation"}
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-card animate-slide-up stagger-2 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Meets Requirement
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-2xs">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-emerald-600">
                  {employeeDevData?.skillGapSummary?.meetsRequirementCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Competencies meeting role target
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-card animate-slide-up stagger-3 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Active Skill Gaps
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 shadow-2xs">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-amber-600">
                  {employeeDevData?.skillGapSummary?.needsImprovementCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Developmental opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-card animate-slide-up stagger-4 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Diagnostic Exam
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100/80 shadow-2xs">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-indigo-600">
                  {employeeDevData?.latestAssessment ? `${employeeDevData.latestAssessment.score}%` : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {employeeDevData?.latestAssessment ? "Latest verified assessment score" : "No assessment taken yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Employee Main Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left: Active Enrolled Courses & Progress */}
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                      <GraduationCap className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">My Active Learning Pathways</CardTitle>
                      <CardDescription className="text-xs">
                        Progress across enrolled curriculum modules
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/my-learning">
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {!employeeDevData?.enrollments || employeeDevData.enrollments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
                    <BookOpen className="h-8 w-8 text-indigo-400 mx-auto opacity-70" />
                    <p className="font-semibold text-foreground">No Active Enrollments</p>
                    <p>Enroll in targeted courses from your recommendations or course catalog.</p>
                    <Link href="/courses">
                      <Button size="sm" variant="outline" className="mt-2 text-xs">
                        Browse Courses
                      </Button>
                    </Link>
                  </div>
                ) : (
                  employeeDevData.enrollments.map((enr: any) => (
                    <div
                      key={enr.id}
                      className="p-3.5 rounded-xl border border-border/80 bg-card hover:bg-slate-50/80 transition-all shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-foreground">{enr.courseTitle}</div>
                          <span className="text-[10px] text-muted-foreground">
                            {enr.completedModules} of {enr.totalModules} modules completed
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">{enr.progressPercent}%</span>
                          <Link href={`/courses/${enr.courseId}/learn`}>
                            <Button size="sm" variant="outline" className="h-6 text-[10px] font-semibold gap-1 px-2">
                              Continue <ArrowRight className="h-2.5 w-2.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            enr.progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${enr.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Right: Quick Links & Development Roadmap */}
            <div className="space-y-6">
              {/* Profile & Roadmap Card */}
              <Card className="border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
                <CardHeader className="pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Skill Development</CardTitle>
                      <CardDescription className="text-xs">
                        Personal competency roadmap
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Designation:</span>
                      <span className="font-semibold text-foreground">
                        {employeeDevData?.employee?.designationTitle ?? "Unassigned"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-semibold text-foreground">
                        {employeeDevData?.employee?.department ?? "General"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {employeeDevData?.employee?.status ?? "ACTIVE"}
                      </Badge>
                    </div>
                  </div>

                  <Link href="/my-development">
                    <Button size="sm" className="w-full h-8 text-xs gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-500 text-white mt-1">
                      <Briefcase className="h-3.5 w-3.5" /> Open My Development Plan
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Reassessment Status */}
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm">Reassessment Queue</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5">
                  {!employeeDevData?.reassessments || employeeDevData.reassessments.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground space-y-1">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto opacity-80" />
                      <p className="font-semibold text-foreground">No Pending Requests</p>
                      <p className="text-[10px]">Complete courses to request official competency level calibration.</p>
                    </div>
                  ) : (
                    employeeDevData.reassessments.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="p-2.5 rounded-lg border bg-slate-50/50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{r.competencyName}</span>
                          <Badge variant="outline" className="text-[9px] font-bold">
                            {r.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          L{r.previousLevel} → L{r.requestedLevel}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* ================= ADMIN & MANAGER DASHBOARD ================= */
        <>
          {/* Top Level KPIs with Staggered Entrance and Hover Lift */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover-lift-card animate-slide-up stagger-1 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Workforce
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 shadow-2xs">
                  <Users className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-foreground">{employees.length}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Active organizational profiles
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-card animate-slide-up stagger-2 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Competency Library
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100/80 shadow-2xs">
                  <BadgeCheck className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-foreground">{competenciesCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Standardized 1–5 rubrics
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-card animate-slide-up stagger-3 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Role Profiles
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100/80 shadow-2xs">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-foreground">{designationsCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mapped designation baselines
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift-card animate-slide-up stagger-4 border border-border/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Readiness Score
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-2xs">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                  <span>{overallReadiness}%</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Target: 80%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${overallReadiness}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Critical Skill Gaps */}
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">High-Priority Skill Gaps</CardTitle>
                      <CardDescription className="text-xs">
                        Developmental opportunities where current competency is below role target
                      </CardDescription>
                    </div>
                  </div>
                  <Link href="/skill-gaps">
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {criticalGaps.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-70" />
                    <p className="font-semibold text-foreground">No Critical Gaps Found</p>
                    <p>All active employees currently meet or exceed designated role requirements.</p>
                  </div>
                ) : (
                  criticalGaps.slice(0, 5).map((gap, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:bg-slate-50/80 transition-all duration-150 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {gap.employeeName}
                          </span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="text-xs text-muted-foreground">{gap.designation}</span>
                        </div>
                        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                          {gap.competencyName}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            Current: L{gap.currentLevel ?? 0} / Target: L{gap.requiredLevel}
                          </span>
                          <Badge variant="warning" className="text-[10px] font-mono mt-0.5">
                            Gap: -{gap.gap} Lvl
                          </Badge>
                        </div>
                        <Link href={`/skill-gaps/${gap.employeeId}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 font-semibold">
                            Resolve
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions & Reassessment Queue */}
            <div className="space-y-6">
              <Card className="shadow-xs">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <CardTitle className="text-sm">Pending Verifications</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold">
                      {pendingReassessments.length} Pending
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Completed course reassessments awaiting manager calibration
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5">
                  {pendingReassessments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground space-y-1">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto opacity-80" />
                      <p className="font-semibold text-foreground">All Caught Up</p>
                      <p className="text-[11px]">All reassessment requests have been reviewed.</p>
                    </div>
                  ) : (
                    pendingReassessments.slice(0, 3).map((r: any) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-xl border border-border/80 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">
                            {r.employeeName}
                          </span>
                          <Badge variant="warning" className="text-[10px] font-mono font-bold">
                            L{r.previousLevel} → L{r.requestedLevel}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {r.competencyName} • {r.courseTitle}
                        </div>
                        <div className="pt-0.5">
                          <Link href="/reassessments">
                            <Button size="sm" className="w-full h-7 text-xs gap-1.5 font-semibold">
                              <ShieldCheck className="h-3 w-3" />
                              Review Request
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recommended Courses Card */}
              <Card className="border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
                <CardHeader className="pb-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">Targeted Pathways</CardTitle>
                      <CardDescription className="text-xs">
                        High-impact pathways for capacity building
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {courses.length === 0 ? (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No courses available yet.
                    </div>
                  ) : (
                    courses.slice(0, 3).map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 transition-colors shadow-2xs"
                      >
                        <div className="space-y-0.5 pr-2">
                          <div className="font-semibold text-xs text-foreground line-clamp-1">
                            {c.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>{c.durationHours} hrs</span>
                            <span>•</span>
                            <span className="text-indigo-700 font-medium">Target L{c.targetLevel}</span>
                          </div>
                        </div>
                        <Link href={`/courses/${c.id}/learn`}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-600">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

