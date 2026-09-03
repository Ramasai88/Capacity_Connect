"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_EMPLOYEES } from "@/lib/demo/data";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { GapStatusBadge } from "@/components/skill-gaps/gap-status-badge";
import { LevelIndicator } from "@/components/skill-gaps/level-indicator";
import { User, ArrowLeft, Calendar, Briefcase, TrendingUp, GraduationCap, Sparkles, Pencil, CheckCircle2, X, Loader2, Compass } from "lucide-react";

export default function EmployeeProfilePage() {
  const params = useParams();
  const employeeId = params.id as string;
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "ADMIN";

  const demoStore = useDemoStore();
  const [realEmployee, setRealEmployee] = useState<any | null>(null);
  const [realSummary, setRealSummary] = useState<any | null>(null);
  const [realCourses, setRealCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const [editingCompetency, setEditingCompetency] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string>("1");
  const [levelFeedback, setLevelFeedback] = useState<{ competencyId: string; message: string } | null>(null);

  const [realAssessments, setRealAssessments] = useState<any[]>([]);

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [empRes, gapRes, crsRes, assessRes] = await Promise.all([
        apiClient.employees.getById(employeeId),
        apiClient.skillGaps.getForEmployee(employeeId),
        apiClient.courses.list(),
        fetch(`/api/assessments?employeeId=${employeeId}`).then((r) => (r.ok ? r.json() : { assessments: [] })),
      ]);
      setRealEmployee(empRes.data);
      setRealSummary(gapRes.data);
      setRealCourses(crsRes.data || []);
      setRealAssessments(assessRes.assessments || []);
    } catch (err) {
      console.error("Failed to load employee profile:", err);
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
    ? demoStore.employees.find((e) => e.id === employeeId) || DEMO_EMPLOYEES[0]
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
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading employee profile...
      </div>
    );
  }

  const designationTitle = employee.designationTitle || employee.designation?.title || "Unassigned";
  const department = employee.department || employee.designation?.department || "—";
  const joiningDate = employee.joiningDate || (employee.createdAt ? employee.createdAt.split("T")[0] : "—");
  const initials = employee.name.split(" ").map((n: string) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const weakGaps = summary ? summary.gaps.filter((g: any) => g.status !== "MEETS_REQUIREMENT") : [];
  const recommendations = weakGaps.map((gap: any) => {
    const matchingCourse = courses.find((c: any) => c.competencyId === gap.competencyId && c.status === "PUBLISHED");
    return { gap, course: matchingCourse || null };
  });

  const canEditLevel = role === "ADMIN" || role === "MANAGER";

  function startEdit(competencyId: string, currentLevel: number | null) {
    setEditingCompetency(competencyId);
    setEditingLevel(String(currentLevel ?? 1));
  }

  function cancelEdit() {
    setEditingCompetency(null);
    setLevelFeedback(null);
  }

  async function saveLevel(competencyId: string) {
    if (isDemoMode()) {
      const result = demoStore.updateEmployeeCompetencyLevel(
        employee.id,
        competencyId,
        parseInt(editingLevel),
        role === "ADMIN" ? "Administrator" : "Manager"
      );
      if (result.success) {
        setLevelFeedback({ competencyId, message: `Level updated to L${editingLevel}` });
        setEditingCompetency(null);
        setTimeout(() => setLevelFeedback(null), 2000);
      }
    } else {
      try {
        await apiClient.employees.update(employee.id, {
          competencies: [
            {
              competencyId,
              currentLevel: parseInt(editingLevel),
            },
          ],
        });
        setLevelFeedback({ competencyId, message: `Level updated to L${editingLevel}` });
        setEditingCompetency(null);
        setTimeout(() => setLevelFeedback(null), 2000);
        await loadRealData();
      } catch (err: any) {
        setLevelFeedback({ competencyId, message: err.message || "Failed to update level" });
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <Link href="/employees" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />Back to Employees
        </Link>
      </div>

      {/* Hero Profile Card */}
      <Card className="shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-indigo-700 text-white font-bold text-lg shadow-sm">
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
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono font-semibold text-slate-700"><User className="h-3 w-3" />{employee.employeeCode}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{designationTitle} ({department})</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined: {joiningDate}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/my-development?employeeId=${employee.id}`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold shadow-xs">
                  <Compass className="h-3.5 w-3.5 text-indigo-600" />Skill Development Journey
                </Button>
              </Link>
              <Link href={`/skill-gaps/${employee.id}`}>
                <Button size="sm" className="gap-1.5 text-xs font-semibold shadow-xs">
                  <TrendingUp className="h-3.5 w-3.5" />Full Skill Gap Breakdown
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competency Assessment Table */}
      <Card className="shadow-xs">
        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base">Role Competency Assessment ({designationTitle})</CardTitle>
              <CardDescription className="text-xs">
                Calculated using: <code className="text-[11px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">gap = max(0, Required - Current)</code>
              </CardDescription>
            </div>
            {summary && (
              <div className="flex gap-2">
                <Badge variant="success" className="text-xs font-semibold">{summary.meetsRequirementCount} Meets</Badge>
                {summary.needsImprovementCount > 0 && <Badge variant="warning" className="text-xs font-semibold">{summary.needsImprovementCount} Gaps</Badge>}
                {summary.notAssessedCount > 0 && <Badge variant="secondary" className="text-xs font-semibold">{summary.notAssessedCount} Unassessed</Badge>}
              </div>
            )}
          </div>
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
                {canEditLevel && <TableHead className="text-right">Calibrate</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!summary || summary.gaps.length === 0) ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">No designation requirements mapped yet.</TableCell></TableRow>
              ) : (
                summary.gaps.map((gap: any) => {
                  const isEditing = editingCompetency === gap.competencyId;
                  const feedback = levelFeedback && levelFeedback.competencyId === gap.competencyId ? levelFeedback.message : null;
                  return (
                    <TableRow key={gap.competencyId}>
                      <TableCell className="font-semibold text-xs">
                        <Link href={`/competencies/${gap.competencyId}`} className="hover:underline text-indigo-700 dark:text-indigo-400">
                          {gap.competencyName}
                        </Link>
                        {feedback && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="h-3 w-3" /> {feedback}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{gap.category || "Technical"}</TableCell>
                      <TableCell className="w-48"><LevelIndicator currentLevel={gap.requiredLevel} requiredLevel={gap.requiredLevel} showLabels={false} /></TableCell>
                      <TableCell className="w-48">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Select value={editingLevel} onValueChange={setEditingLevel}>
                              <SelectTrigger className="h-7 w-20 text-xs font-mono"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((lvl) => (
                                  <SelectItem key={lvl} value={String(lvl)} className="text-xs font-mono">L{lvl}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => saveLevel(gap.competencyId)}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-1 text-xs" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
                          </div>
                        ) : (
                          <LevelIndicator currentLevel={gap.currentLevel} requiredLevel={gap.requiredLevel} showLabels={false} />
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono text-xs font-bold ${gap.gap > 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                          {gap.gap > 0 ? `-${gap.gap}` : "0"}
                        </span>
                      </TableCell>
                      <TableCell><GapStatusBadge status={gap.status} /></TableCell>
                      {canEditLevel && (
                        <TableCell className="text-right">
                          {!isEditing && (
                            <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground font-medium" onClick={() => startEdit(gap.competencyId, gap.currentLevel)}>
                              <Pencil className="h-3 w-3" />Calibrate
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diagnostic Assessments & Topic Performance */}
      {realAssessments.length > 0 && (
        <Card className="shadow-xs border border-border/80">
          <CardHeader className="pb-3 border-b border-border/40 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">Diagnostic Assessment Performance</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Real exam submissions and topic-wise evaluation breakdown
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold bg-indigo-50/50 text-indigo-700 border-indigo-200">
                {realAssessments.length} Attempt{realAssessments.length > 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {realAssessments.map((assess: any) => (
              <div key={assess.id} className="p-4 rounded-xl border bg-card space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{assess.title}</h4>
                    <span className="text-[11px] text-muted-foreground">
                      Completed {new Date(assess.completedAt).toLocaleDateString()} at {new Date(assess.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-extrabold ${
                        assess.score >= 75
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : assess.score >= 50
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-rose-50 text-rose-700 border-rose-300"
                      }`}
                    >
                      Score: {assess.score}% ({assess.correctQuestions}/{assess.totalQuestions})
                    </Badge>
                  </div>
                </div>

                {/* Topic Breakdown */}
                {Array.isArray(assess.topicBreakdown) && assess.topicBreakdown.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Topic Performance Breakdown
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {assess.topicBreakdown.map((t: any, idx: number) => (
                        <div key={idx} className="p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                            <span>{t.topic}</span>
                            <span
                              className={`font-bold ${
                                t.score >= 75
                                  ? "text-emerald-600"
                                  : t.score >= 50
                                  ? "text-amber-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {t.score}% ({t.correctQuestions}/{t.totalQuestions})
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                t.score >= 75 ? "bg-emerald-500" : t.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                              }`}
                              style={{ width: `${t.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {recommendations.length > 0 && (
        <Card className="border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
          <CardHeader className="pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div>
                <CardTitle className="text-sm">Recommended Upskilling Courses</CardTitle>
                <CardDescription className="text-xs">Curated curriculum to close active skill gaps for {employee.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {recommendations.map(({ gap, course }: any) => (
              <div key={gap.competencyId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 gap-3 shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">{gap.competencyName}</span>
                    <Badge variant="warning" className="text-[10px] font-mono font-bold">Gap: -{gap.gap} Lvl</Badge>
                  </div>
                  {course ? (
                    <div className="text-xs text-muted-foreground">
                      Matched Course: <span className="font-semibold text-foreground">{course.title}</span> ({course.durationHours} hrs)
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">No dedicated course mapped for this competency yet.</div>
                  )}
                </div>
                {course && (
                  <Link href={`/courses/${course.id}/learn`}>
                    <Button size="sm" className="h-7 text-xs gap-1 font-semibold"><GraduationCap className="h-3.5 w-3.5" />View Course</Button>
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