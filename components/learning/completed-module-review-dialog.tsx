"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CourseModule, CourseCurriculum } from "@/lib/demo/learning-curriculum";
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Code,
  FileCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Lock,
  ArrowRight,
  ListChecks,
  ExternalLink,
  BookMarked,
} from "lucide-react";

interface CompletedModuleReviewDialogProps {
  module: CourseModule | null;
  curriculum: CourseCurriculum;
  completedModuleIds: string[];
  courseTitle: string;
  courseTargetLevel: number;
  courseProgressPercent: number;
  completedCount: number;
  totalCount: number;
  isCourseCompleted: boolean;
  reassessmentStatus?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectModule?: (module: CourseModule) => void;
}

export function CompletedModuleReviewDialog({
  module,
  curriculum,
  completedModuleIds,
  courseTitle,
  courseTargetLevel,
  courseProgressPercent,
  completedCount,
  totalCount,
  isCourseCompleted,
  reassessmentStatus,
  isOpen,
  onClose,
  onSelectModule,
}: CompletedModuleReviewDialogProps) {
  if (!module) return null;

  const sortedModules = [...(curriculum?.modules || [])].sort((a, b) => a.order - b.order);
  const currentIndex = sortedModules.findIndex((m) => m.id === module.id);
  const prevModule = currentIndex > 0 ? sortedModules[currentIndex - 1] : null;
  const nextModule = currentIndex < sortedModules.length - 1 ? sortedModules[currentIndex + 1] : null;

  const isPrevCompleted = prevModule ? completedModuleIds.includes(prevModule.id) : false;
  const isNextCompleted = nextModule ? completedModuleIds.includes(nextModule.id) : false;

  const durationHours = Math.max(1, Math.round((module.durationMinutes || 60) / 60));
  const remainingModulesCount = Math.max(0, totalCount - completedCount);

  const learningObjectives = Array.isArray(module.learningObjectives)
    ? module.learningObjectives
    : [];

  const overview = module.content?.overview || module.overview || null;

  const rawConcepts = module.content?.keyConcepts ?? module.keyConcepts;
  const keyConcepts = Array.isArray(rawConcepts) ? rawConcepts : [];

  const practicalExercise = module.content?.practicalExercise || module.practicalExercise || null;

  const competencyVerification =
    module.content?.competencyVerification || module.competencyVerification || null;

  const rawResources = module.resources ?? module.content?.resources;
  const resources = Array.isArray(rawResources) ? rawResources : [];

  // Find first uncompleted module to show as "Current Module" in evidence
  const firstUncompleted = sortedModules.find((m) => !completedModuleIds.includes(m.id));
  const currentModuleName = firstUncompleted
    ? `Module ${firstUncompleted.order}: ${firstUncompleted.title}`
    : "All Modules Completed";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="border-b bg-muted/20 p-6 pb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                Module {module.order} of {totalCount}
              </Badge>
              <Badge variant="success" className="gap-1 text-xs py-0.5 px-2.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                COMPLETED
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {durationHours} Hours Duration
              </span>
              <span>•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                Completed in Curriculum
              </span>
            </div>
          </div>

          <div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {module.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {module.summary}
            </DialogDescription>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 text-xs leading-relaxed">
          {/* 1. Completion Summary Card */}
          <div className="rounded-xl border border-emerald-300 bg-emerald-500/10 p-5 space-y-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                    Module Completed
                  </h3>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                    All curriculum components and practical verification benchmarks met
                  </p>
                </div>
              </div>

              <Badge variant="success" className="self-start sm:self-center font-mono text-xs py-1 px-3">
                Module Progress: 100%
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-emerald-900 dark:text-emerald-300">
                <span>Module Content Mastery</span>
                <span>100% Complete</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-emerald-200/60 dark:bg-emerald-950">
                <div className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full w-full" />
              </div>
            </div>

            {/* 4 Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="rounded-lg bg-background/80 border border-emerald-200 dark:border-emerald-900/40 p-2.5 text-center">
                <div className="font-bold text-foreground text-sm">
                  {learningObjectives.length} / {learningObjectives.length}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Objectives Met</div>
              </div>

              <div className="rounded-lg bg-background/80 border border-emerald-200 dark:border-emerald-900/40 p-2.5 text-center">
                <div className="font-bold text-foreground text-sm">{durationHours} Hours</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Duration Logged</div>
              </div>

              <div className="rounded-lg bg-background/80 border border-emerald-200 dark:border-emerald-900/40 p-2.5 text-center">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Completed</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Module Status</div>
              </div>

              <div className="rounded-lg bg-background/80 border border-emerald-200 dark:border-emerald-900/40 p-2.5 text-center">
                <div className="font-bold text-primary text-sm">Level {courseTargetLevel}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Target Standard</div>
              </div>
            </div>
          </div>

          {/* 2. "What You Completed" Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <ListChecks className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                What You Completed
              </h3>
            </div>

            {learningObjectives.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {learningObjectives.map((objective, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-xs"
                  >
                    <div className="mt-0.5 shrink-0 rounded-full bg-emerald-100 p-0.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-xs leading-snug">
                        {objective}
                      </p>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 dark:text-emerald-300 py-0 px-1.5 font-normal">
                        ✓ Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/20 p-3 text-center">
                <p className="text-muted-foreground text-xs italic">
                  No specific learning objectives listed for this module.
                </p>
              </div>
            )}
          </div>

          {/* 3. Topics & Concepts Covered */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Topics &amp; Concepts Covered
              </h3>
            </div>

            {/* Overview */}
            <div className="rounded-lg border bg-muted/20 p-4 space-y-1.5">
              <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Architecture &amp; Theoretical Overview
              </span>
              {overview ? (
                <p className="text-muted-foreground leading-relaxed">
                  {overview}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  No overview available for this module.
                </p>
              )}
            </div>

            {/* Key Concepts with Code Snippets */}
            {keyConcepts.length > 0 ? (
              <div className="space-y-3">
                {keyConcepts.map((concept, idx) => (
                  <div key={idx} className="rounded-lg border bg-card p-4 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        <Code className="h-3.5 w-3.5 text-primary" />
                        {concept.title}
                      </h4>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Reviewed
                      </Badge>
                    </div>

                    {concept.description && (
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {concept.description}
                      </p>
                    )}

                    {concept.codeSnippet && (
                      <div className="pt-1">
                        <pre className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
                          <code>{concept.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-card p-3 shadow-xs">
                <p className="text-muted-foreground text-xs italic">
                  No key concepts listed for this module.
                </p>
              </div>
            )}
          </div>

          {/* Learning Resources & References */}
          {resources.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <BookMarked className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Authoritative Learning Resources
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {resources.map((res: any, idx: number) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between p-3 rounded-lg border bg-card hover:border-indigo-400 hover:shadow-xs transition-all gap-2"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {res.title}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 font-mono">
                          {res.type}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {res.description}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 4. Practical Implementation Exercise */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Practical Implementation Exercise
              </h3>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-primary" />
                  Hands-On Benchmark Exercise
                </span>
                <Badge variant="success" className="text-[10px] gap-1 py-0.5 px-2">
                  <CheckCircle2 className="h-3 w-3" />
                  ✓ Module exercise completed
                </Badge>
              </div>

              {practicalExercise ? (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {practicalExercise}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs italic">
                  No practical exercise specified for this module.
                </p>
              )}

              <div className="rounded-md bg-background/80 border p-2.5 text-[11px] text-foreground font-medium flex items-center gap-2">
                <span className="text-primary font-bold">🎯 Verification Standard:</span>
                <span>{competencyVerification || "Standard target level competency verification"}</span>
              </div>
            </div>
          </div>

          {/* 5. Completion Evidence Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Completion Evidence &amp; Learning State
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border bg-muted/20 p-3 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Module Status</div>
                <div className="font-bold text-emerald-600 text-xs">COMPLETED</div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Course Progress</div>
                <div className="font-mono font-bold text-primary text-xs">{courseProgressPercent}%</div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Modules Completed</div>
                <div className="font-bold text-foreground text-xs">{completedCount} of {totalCount}</div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Remaining Modules</div>
                <div className="font-bold text-foreground text-xs">{remainingModulesCount} Remaining</div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Course Status</div>
                <div className="font-bold text-foreground text-xs">
                  {isCourseCompleted ? "COMPLETED" : "IN_PROGRESS"}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Reassessment Status</div>
                <div className="font-bold text-xs">
                  {reassessmentStatus ? (
                    <span className="text-amber-600 dark:text-amber-400">{reassessmentStatus}</span>
                  ) : isCourseCompleted ? (
                    <span className="text-amber-600 dark:text-amber-400">PENDING_REASSESSMENT</span>
                  ) : (
                    <span className="text-muted-foreground">Unlocks at 100%</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. "Your Course Journey" Roadmap Context */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Your Course Journey ({courseTitle})
              </h3>
            </div>

            <div className="space-y-2">
              {sortedModules.map((m, idx) => {
                const isThisDone = completedModuleIds.includes(m.id);
                const prev = idx > 0 ? sortedModules[idx - 1] : null;
                const isPrevDone = idx === 0 || (prev ? completedModuleIds.includes(prev.id) : false);
                const isThisCurrent = !isThisDone && isPrevDone;
                const isThisLocked = !isThisDone && !isPrevDone;
                const isSelected = m.id === module.id;

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : isThisDone
                        ? "border-emerald-200 bg-emerald-500/5 dark:border-emerald-950"
                        : isThisCurrent
                        ? "border-border bg-background"
                        : "border-border/40 bg-muted/20 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isThisDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : isThisCurrent ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-bold text-[10px]">
                          {m.order}
                        </div>
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}

                      <span className={`font-medium ${isSelected ? "text-primary font-bold" : "text-foreground"}`}>
                        Module {m.order} — {m.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isThisDone ? (
                        <Badge variant="success" className="text-[10px] py-0 px-1.5">
                          ✓ Completed
                        </Badge>
                      ) : isThisCurrent ? (
                        <Badge variant="default" className="text-[10px] py-0 px-1.5">
                          → Current
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                          🔒 Locked
                        </Badge>
                      )}

                      {isThisDone && onSelectModule && m.id !== module.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] px-2"
                          onClick={() => onSelectModule(m)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer: Read-Only Navigation Buttons */}
        <DialogFooter className="border-t bg-muted/10 p-4 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {prevModule && isPrevCompleted && onSelectModule && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1 h-8 w-full sm:w-auto"
                onClick={() => onSelectModule(prevModule)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous Module (Module {prevModule.order})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 w-full sm:w-auto"
            >
              {currentIndex === sortedModules.length - 1 ? "Back to Course" : "Close Review"}
            </Button>

            {nextModule && isNextCompleted && onSelectModule && (
              <Button
                type="button"
                size="sm"
                className="text-xs gap-1 h-8 w-full sm:w-auto bg-primary text-primary-foreground font-semibold"
                onClick={() => onSelectModule(nextModule)}
              >
                Next Module (Module {nextModule.order})
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}