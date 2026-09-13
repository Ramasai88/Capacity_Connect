"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
import { apiClient } from "@/lib/api/client";
import { GapStatusBadge } from "@/components/skill-gaps/gap-status-badge";
import { LevelIndicator } from "@/components/skill-gaps/level-indicator";
import { AccessDenied } from "@/components/auth/access-denied";
import {
  User,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Bot,
  Loader2,
  Calendar,
  Briefcase,
  Layers,
  BarChart3,
  Target,
  Clock,
  Compass,
  ArrowUpRight,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

export default function MyDevelopmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (sessionStatus === "loading") return;
    if (userRole !== "EMPLOYEE") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.myDevelopment.get();
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load development profile:", err);
      setError(err.message || "Failed to load employee skill development profile.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, userRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-xs text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span>Loading employee skill development profile...</span>
      </div>
    );
  }

  if (session && userRole !== "EMPLOYEE") {
    return (
      <AccessDenied
        requiredRole="EMPLOYEE"
        currentRole={userRole}
        resourceName="the Employee Self-Service Skill Development page"
      />
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-4">
        <Card className="border-rose-200 bg-rose-50/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Unable to Load Development Profile
            </CardTitle>
            <CardDescription className="text-xs text-rose-600">{error || "Employee record not found."}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm" onClick={() => router.push("/dashboard")} variant="outline">
              Return to Dashboard
            </Button>
            <Button size="sm" onClick={() => loadData()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    employee,
    skillGapSummary,
    latestAssessment,
    assessmentsCount,
    focusAreas,
    recommendations,
    enrollments,
    reassessments,
    history,
    currentStage,
  } = data;

  const gaps = skillGapSummary?.gaps || [];

  // Journey milestones definition
  const journeyMilestones = [
    { stage: 1, title: "Profile", desc: "Workforce identity & department active" },
    { stage: 2, title: "Role Rubric", desc: "Baseline competency requirements mapped" },
    { stage: 3, title: "Diagnostic", desc: "Skill assessment evaluated server-side" },
    { stage: 4, title: "Gap Analysis", desc: "Developmental gaps calculated" },
    { stage: 5, title: "AI Plan", desc: "Targeted course recommendations generated" },
    { stage: 6, title: "Learning", desc: "Curriculum modules in progress" },
    { stage: 7, title: "Completion", desc: "Curriculum finished with 100% progress" },
    { stage: 8, title: "Reassessment", desc: "Manager verified & competency calibrated" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Hero Header & Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-wider">
                Individual Skill Development
              </Badge>
              <Badge variant="outline" className="text-slate-300 border-slate-700 text-[10px]">
                {employee.status}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              My Skill Development
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                {employee.designationTitle} ({employee.department})
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-indigo-200">Code: {employee.employeeCode}</span>
              {employee.joiningDate && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    Joined {new Date(employee.joiningDate).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Button
              size="sm"
              onClick={() => router.push("/recommendations")}
              className="text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> Diagnostic Exam
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/assistant")}
              className="text-xs font-semibold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs"
            >
              <Bot className="h-3.5 w-3.5 text-indigo-300" /> Ask AI Assistant
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/my-learning")}
              className="text-xs font-semibold gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-300" /> My Learning
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Required
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {skillGapSummary?.totalRequired || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Role Competencies</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Meets Requirement
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {skillGapSummary?.meetsRequirementCount || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">At or above required level</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Needs Improvement
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {skillGapSummary?.needsImprovementCount || 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active developmental gaps</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Diagnostic Score
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {latestAssessment ? `${latestAssessment.score}%` : "—"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {latestAssessment ? `${latestAssessment.correctQuestions}/${latestAssessment.totalQuestions} correct` : "Not assessed yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 1: Visual Development Journey */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/50 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-indigo-600" />
                Continuous Development Journey
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time milestone progression across assessment, AI recommendation, learning, and manager verification.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              Stage {currentStage} of 8
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {journeyMilestones.map((m) => {
              const isPassed = currentStage > m.stage;
              const isCurrent = currentStage === m.stage;
              return (
                <div
                  key={m.stage}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? "bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs"
                      : isPassed
                      ? "bg-emerald-50/40 border-emerald-200/80 text-slate-800"
                      : "bg-slate-50/50 border-slate-200 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-center mb-1.5">
                    {isPassed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <div className="h-4 w-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {m.stage}
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center">
                        {m.stage}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-bold leading-tight">{m.title}</div>
                  <div className="text-[9px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                    {m.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 & 3: Competencies Matrix & Diagnostic Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: My Competencies & Skill Gaps (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" />
                    Role Competencies & Skill Gaps
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current evaluated level vs. designation baseline requirement (<code>gap = max(0, Required - Current)</code>).
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {gaps.length} Competencies
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {gaps.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No competency requirements mapped for this designation yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Competency</TableHead>
                      <TableHead className="text-xs text-center">Required</TableHead>
                      <TableHead className="text-xs text-center">Current</TableHead>
                      <TableHead className="text-xs text-center">Gap</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gaps.map((g: any) => (
                      <TableRow key={g.competencyId}>
                        <TableCell className="font-medium text-xs">
                          <div>{g.competencyName}</div>
                          {g.category && <div className="text-[10px] text-muted-foreground">{g.category}</div>}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[11px] font-bold bg-slate-50">
                            L{g.requiredLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {g.currentLevel !== null ? (
                            <Badge variant="outline" className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                              L{g.currentLevel}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-mono text-xs font-bold ${
                              g.gap === 0 ? "text-emerald-600" : g.gap >= 2 ? "text-rose-600 font-extrabold" : "text-amber-600"
                            }`}
                          >
                            {g.gap}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <GapStatusBadge status={g.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Historical Competency Progress (Before vs Current Comparison) */}
          {history && history.length > 0 && (
            <Card className="shadow-xs">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Verified Competency Improvements & History
                </CardTitle>
                <CardDescription className="text-xs">
                  Historical progression recorded from validated reassessments and evaluations.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <div key={h.id} className="p-3 rounded-lg border bg-slate-50/50 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-foreground">{h.competency?.name || "Competency"}</span>
                        <div className="text-[10px] text-muted-foreground">
                          Assessed on {new Date(h.assessedAt).toLocaleDateString()} by {h.assessedBy || "Manager Review"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        {h.previousLevel != null && (
                          <>
                            <Badge variant="outline" className="text-[10px] bg-white text-muted-foreground">
                              L{h.previousLevel}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </>
                        )}
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-300">
                          L{h.newLevel}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Diagnostic Performance & Focus Areas (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Diagnostic Assessment Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Diagnostic Exam Performance
                </CardTitle>
                {latestAssessment && (
                  <Badge variant="outline" className="text-xs font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                    {latestAssessment.score}% Score
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {latestAssessment ? latestAssessment.title : "Evaluates Variables, OOP, AsyncIO, and Architecture."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {latestAssessment ? (
                <>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Correct Answers</span>
                      <span className="text-base font-bold text-foreground">
                        {latestAssessment.correctQuestions} / {latestAssessment.totalQuestions}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Completed</span>
                      <span className="text-xs font-semibold text-foreground pt-0.5 block">
                        {new Date(latestAssessment.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Topic Breakdowns */}
                  {Array.isArray(latestAssessment.topicBreakdown) && (
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Topic Performance Breakdown
                      </span>
                      {latestAssessment.topicBreakdown.map((t: any, idx: number) => {
                        const tier =
                          t.score >= 75
                            ? { label: "Strong", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", bar: "bg-emerald-500" }
                            : t.score >= 60
                            ? { label: "Good", badge: "bg-indigo-100 text-indigo-800 border-indigo-300", bar: "bg-indigo-500" }
                            : t.score >= 40
                            ? { label: "Needs Improvement", badge: "bg-amber-100 text-amber-800 border-amber-300", bar: "bg-amber-500" }
                            : { label: "High Priority", badge: "bg-rose-100 text-rose-800 border-rose-300", bar: "bg-rose-500" };

                        return (
                          <div key={idx} className="p-2.5 rounded-lg border bg-card space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold">{t.topic}</span>
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="text-[11px] text-muted-foreground">{t.score}%</span>
                                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded-full font-bold ${tier.badge}`}>
                                  {tier.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${tier.bar}`} style={{ width: `${t.score}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground space-y-3">
                  <p>No diagnostic exams completed yet.</p>
                  <Button size="sm" onClick={() => router.push("/recommendations")} className="text-xs font-bold gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Take Diagnostic Exam
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Focus Areas & Study Concepts */}
          {focusAreas && focusAreas.length > 0 && (
            <Card className="border-amber-200/80 bg-amber-50/20 shadow-xs">
              <CardHeader className="pb-3 border-b border-amber-200/40">
                <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-600" />
                  Identified Focus Areas & Concepts to Study
                </CardTitle>
                <CardDescription className="text-xs text-amber-800">
                  Targeted conceptual topics scoring under 60% in diagnostic assessment.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {focusAreas.map((fa: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-white border border-amber-200 shadow-2xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{fa.topic}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          fa.priority === "HIGH_PRIORITY"
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        {fa.priority === "HIGH_PRIORITY" ? "🔴 High Priority" : "🟠 Needs Improvement"} ({fa.score}%)
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Key Concepts:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
                        {fa.concepts.map((c: string, cIdx: number) => (
                          <div key={cIdx} className="flex items-center gap-1.5">
                            <span className="text-indigo-600 font-bold">•</span>
                            <span className="truncate">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* SECTION 4: AI Learning Recommendations */}
      <Card className="shadow-xs">
        <CardHeader className="bg-slate-50/50 border-b border-border/50 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                AI Learning Recommendations & Courses
              </CardTitle>
              <CardDescription className="text-xs">
                Generated from multi-factor analysis: Competency Gaps, Diagnostic Performance, and Course Curricula.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              {recommendations.length} Active Plan{recommendations.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {recommendations.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No active learning recommendations currently generated.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec: any) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border bg-card shadow-2xs hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          rec.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : rec.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-blue-50 text-blue-700 border-blue-300"
                        }`}
                      >
                        {rec.priority} Priority
                      </Badge>
                      {rec.confidenceScore && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {Math.round(rec.confidenceScore * 100)}% Match Confidence
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-foreground">{rec.competencyName}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                    </div>

                    {rec.weakTopics && rec.weakTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rec.weakTopics.map((wt: string, wIdx: number) => (
                          <Badge key={wIdx} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700">
                            {wt}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {rec.course && (
                    <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200/60 flex items-center justify-between gap-2 mt-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-indigo-950 block">{rec.course.title}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {rec.course.modulesCount} Modules • {rec.course.durationHours} Hours
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push("/my-learning")}
                        className="text-xs font-bold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-2xs h-7"
                      >
                        <BookOpen className="h-3 w-3" /> Start
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 5 & 6: My Learning Progress & Reassessment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Course Learning Progress (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600" />
                  My Course Learning Progress
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  {enrollments.length} Enrolled Course{enrollments.length === 1 ? "" : "s"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {enrollments.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                  <p>You have not enrolled in any courses yet.</p>
                  <Button size="sm" variant="outline" onClick={() => router.push("/courses")} className="text-xs gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Explore Course Catalog
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enr: any) => (
                    <div key={enr.id} className="p-3.5 rounded-xl border bg-card shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{enr.courseTitle}</h4>
                          <span className="text-[10px] text-muted-foreground">
                            {enr.completedModules} of {enr.totalModules} modules completed
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">{enr.progressPercent}%</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/courses/${enr.courseId}/learn`)}
                            className="h-6 text-[10px] font-semibold gap-1 px-2"
                          >
                            Continue <ArrowRight className="h-2.5 w-2.5" />
                          </Button>
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reassessment Status (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Reassessment & Verification Status
              </CardTitle>
              <CardDescription className="text-xs">
                Official level calibration requests reviewed by authorized managers.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {reassessments.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                  <p>No reassessment requests submitted yet.</p>
                  <span className="text-[10px] text-muted-foreground block">
                    Complete all modules in your recommended course to request an official reassessment.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reassessments.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-lg border bg-card space-y-1.5 text-xs shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{r.competencyName}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold ${
                            r.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                              : r.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border-rose-300"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                          }`}
                        >
                          {r.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                        <span>Level L{r.previousLevel}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-bold text-foreground">Requested L{r.requestedLevel}</span>
                      </div>

                      {r.reviewerComments && (
                        <div className="p-2 rounded bg-slate-50 text-[10px] text-slate-700 border border-slate-200">
                          <strong>Manager Notes:</strong> {r.reviewerComments}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 7: Ask AI Learning Assistant Entry Point */}
      <Card className="border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/30 shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-indigo-700">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-base font-bold">Ask Capacity Connect Learning Assistant</CardTitle>
          </div>
          <CardDescription className="text-xs text-indigo-950">
            Interact with our read-only AI mentor to understand your skill gaps, recommendations, and study roadmaps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div className="flex flex-wrap gap-2">
            {[
              "What is my biggest skill gap?",
              "What concepts should I study for my weak topics?",
              "Why was this course recommended to me?",
              "How am I progressing in my enrolled courses?",
              "What should I study before requesting a reassessment?",
            ].map((prompt, pIdx) => (
              <Button
                key={pIdx}
                size="sm"
                variant="outline"
                onClick={() => router.push(`/assistant`)}
                className="text-xs bg-white hover:bg-indigo-50 text-indigo-950 border-indigo-200 shadow-2xs h-8"
              >
                <Lightbulb className="h-3 w-3 text-indigo-600 mr-1.5" />
                {prompt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
