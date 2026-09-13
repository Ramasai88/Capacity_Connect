"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DEMO_COURSES,
  DEMO_EMPLOYEES,
} from "@/lib/demo/data";
import {
  getCourseCurriculum,
} from "@/lib/demo/learning-curriculum";
import { useDemoStore } from "@/lib/demo/demo-store";
import { useCourseProgress } from "@/lib/demo/enrollment-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { CompletedModuleReviewDialog } from "@/components/learning/completed-module-review-dialog";
import { ModuleLearningRunner } from "@/components/learning/module-learning-runner";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  PlayCircle,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Loader2,
} from "lucide-react";

export default function CourseLearningPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { data: session } = useSession();

  const demoStore = useDemoStore();
  const [realCourse, setRealCourse] = useState<any | null>(null);
  const [realEnrollment, setRealEnrollment] = useState<any | null>(null);
  const [realReassessment, setRealReassessment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [crsRes, enrRes, reassessRes] = await Promise.all([
        apiClient.courses.getById(courseId),
        apiClient.learning.getEnrollments({ courseId }),
        apiClient.reassessments.list({ courseId }),
      ]);
      setRealCourse(crsRes.data);
      const enr = enrRes.data && enrRes.data.length > 0 ? enrRes.data[0] : null;
      setRealEnrollment(enr);
      const reass = reassessRes.data && reassessRes.data.length > 0 ? reassessRes.data[0] : null;
      setRealReassessment(reass);
    } catch (err) {
      console.error("Failed to load real course learning data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  // Demo fallback
  const demoProgress = useCourseProgress(courseId);
  const demoCurriculum = getCourseCurriculum(courseId);

  const course = isDemoMode()
    ? demoStore.courses.find((c) => c.id === courseId) || DEMO_COURSES.find((c) => c.id === courseId)
    : realCourse;

  const [activeReviewModule, setActiveReviewModule] = useState<any | null>(null);
  const [activeLearningModule, setActiveLearningModule] = useState<any | null>(null);

  if (!course && !isLoading) {
    notFound();
  }

  if (isLoading || !course) {
    return (
      <div className="flex items-center justify-center py-24 text-xs text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading course curriculum...
      </div>
    );
  }

  // Modules & Progress calculation
  const modulesList: any[] = isDemoMode()
    ? demoCurriculum.modules
    : (course.modules || []).map((m: any) => {
        const currMod = demoCurriculum.modules?.find(
          (cm) => cm.id === m.id || cm.order === m.order
        );
        const resources = (m.resources && m.resources.length > 0)
          ? m.resources
          : (currMod?.resources || []);
        const keyConcepts = (Array.isArray(m.keyConcepts) && m.keyConcepts.length > 0)
          ? m.keyConcepts
          : (currMod?.content?.keyConcepts || currMod?.keyConcepts || m.keyConcepts);

        return {
          ...m,
          resources,
          keyConcepts,
          content: {
            ...m.content,
            overview: m.overview || currMod?.content?.overview || currMod?.overview,
            keyConcepts,
            resources,
            practicalExercise: m.practicalExercise || currMod?.content?.practicalExercise,
            competencyVerification: m.competencyVerification || currMod?.content?.competencyVerification,
          },
        };
      });

  const completedModuleIds = new Set<string>(
    isDemoMode()
      ? demoProgress.completedModuleIds
      : (realEnrollment?.completedLessons ? modulesList.slice(0, realEnrollment.completedLessons).map((m) => m.id) : [])
  );

  const progressPercent = isDemoMode()
    ? demoProgress.progressPercent
    : realEnrollment?.progressPercent ?? 0;

  const isCourseComplete = progressPercent === 100;

  const currentModuleId = isDemoMode()
    ? demoProgress.currentModuleId
    : modulesList.find((m) => !completedModuleIds.has(m.id))?.id || modulesList[modulesList.length - 1]?.id;

  const matchingReassessment = isDemoMode()
    ? demoStore.reassessments.find((r) => r.courseId === course.id)
    : realReassessment;

  async function handleCompleteModule(module: any) {
    if (isDemoMode()) {
      demoProgress.markComplete(module.id);
    } else {
      await apiClient.learning.completeModule(course.id, module.id);
      await loadRealData();
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <Link
          href="/my-learning"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Learning
        </Link>
      </div>

      {/* SKILL GAP ALIGNMENT BANNER */}
      <Card className="border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-2xs">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-bold text-foreground">
                Skill Gap Alignment — Why You Are Taking This Course
              </span>
            </div>
            <Badge variant="outline" className="text-xs font-mono font-bold bg-white">
              Target Level {course.targetLevel}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
            <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-muted-foreground block font-medium">Competency Target</span>
              <span className="font-bold text-xs text-foreground mt-0.5 block">{course.category}</span>
            </div>
            <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-muted-foreground block font-medium">Target Proficiency</span>
              <span className="font-bold text-xs text-indigo-700 mt-0.5 block font-mono">Level {course.targetLevel}</span>
            </div>
            <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-muted-foreground block font-medium">Target Outcome</span>
              <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 block">Auto-Reassessment upon completion</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* COURSE PROGRESS BANNER */}
      <Card className="shadow-xs">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{course.title}</h1>
                <Badge variant="secondary" className="text-xs font-mono">{course.code}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{course.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-indigo-700 font-mono">{progressPercent}%</div>
              <span className="text-[11px] text-muted-foreground font-medium">Course Completion</span>
            </div>
          </div>

          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${isCourseComplete ? "bg-emerald-500" : "bg-indigo-600"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isCourseComplete && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 dark:text-emerald-300 shadow-2xs">
              <Award className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Curriculum 100% Completed! </span>
                <span>Your competency reassessment is logged and queued for manager verification.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODULES CURRICULUM LIST */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Course Modules ({modulesList.length})</h2>
        <div className="space-y-2.5">
          {modulesList.map((m, idx) => {
            const isCompleted = completedModuleIds.has(m.id);
            const isCurrent = m.id === currentModuleId && !isCompleted;
            const isLocked = !isCompleted && !isCurrent;
            const isContinue = isCurrent && progressPercent > 0;

            return (
              <Card
                key={m.id}
                className={`transition-all shadow-2xs ${
                  isCompleted
                    ? "border-emerald-200 bg-emerald-50/20"
                    : isCurrent
                    ? "border-indigo-300 bg-indigo-50/10 shadow-xs"
                    : "opacity-60 bg-slate-50/50"
                }`}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-mono shadow-2xs ${
                        isCompleted
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : isLocked ? <Lock className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{m.title}</span>
                        {isCompleted && <Badge variant="success" className="text-[10px] font-semibold">Completed</Badge>}
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px] bg-indigo-600">
                            {isContinue ? "In Progress" : "Up Next"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.summary || m.overview}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.durationMinutes || 30} mins</span>
                        <span>•</span>
                        <span>Module {idx + 1} of {modulesList.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center self-end">
                    {isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 font-semibold"
                        onClick={() => setActiveReviewModule(m)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Review Content
                      </Button>
                    )}
                    {isCurrent && (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 font-semibold shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => setActiveLearningModule(m)}
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        {isContinue ? "Continue Module" : "Start Module"}
                      </Button>
                    )}
                    {isLocked && (
                      <Button size="sm" variant="ghost" disabled className="h-8 text-xs gap-1 opacity-50">
                        <Lock className="h-3.5 w-3.5" />
                        Locked
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ACTIVE MODULE COURSERA-STYLE LEARNING RUNNER */}
      <ModuleLearningRunner
        module={activeLearningModule}
        allModules={modulesList}
        courseId={course.id}
        courseTitle={course.title}
        courseCategory={course.category}
        courseTargetLevel={course.targetLevel}
        isOpen={!!activeLearningModule}
        onClose={() => setActiveLearningModule(null)}
        onCompleteModule={handleCompleteModule}
        onSelectModule={(mod) => setActiveLearningModule(mod)}
      />

      {/* COMPLETED MODULE REVIEW DIALOG */}
      <CompletedModuleReviewDialog
        module={activeReviewModule}
        curriculum={{
          courseId: course.id,
          totalDurationMinutes: (course.durationHours || 20) * 60,
          modules: modulesList,
        }}
        completedModuleIds={Array.from(completedModuleIds)}
        courseTitle={course.title}
        courseTargetLevel={course.targetLevel}
        courseProgressPercent={progressPercent}
        completedCount={completedModuleIds.size}
        totalCount={modulesList.length}
        isCourseCompleted={isCourseComplete}
        reassessmentStatus={matchingReassessment?.status || null}
        isOpen={!!activeReviewModule}
        onClose={() => setActiveReviewModule(null)}
        onSelectModule={(mod) => setActiveReviewModule(mod)}
      />
    </div>
  );
}