"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Code,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  ListChecks,
  Terminal,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  HelpCircle,
  PlayCircle,
  ExternalLink,
  BookMarked,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
} from "lucide-react";
import {
  type LearningResource,
  type CourseConcept,
  getCourseCurriculum,
} from "@/lib/demo/learning-curriculum";

export interface NormalizedModule {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  summary: string;
  overview: string;
  learningObjectives: string[];
  resources: LearningResource[];
  keyConcepts: CourseConcept[];
  practicalExercise: string;
  competencyVerification: string;
}

interface ModuleLearningRunnerProps {
  module: any | null;
  allModules: any[];
  courseId: string;
  courseTitle: string;
  courseCategory?: string;
  courseTargetLevel?: number;
  isOpen: boolean;
  onClose: () => void;
  onCompleteModule: (module: any) => Promise<void> | void;
  onSelectModule?: (module: any) => void;
}

export function ModuleLearningRunner({
  module,
  allModules,
  courseId,
  courseTitle,
  courseCategory = "Technical / Programming",
  courseTargetLevel = 3,
  isOpen,
  onClose,
  onCompleteModule,
  onSelectModule,
}: ModuleLearningRunnerProps) {
  // Normalize module data safely
  const currentModule: NormalizedModule | null = React.useMemo(() => {
    if (!module) return null;

    const overview =
      module.content?.overview ||
      module.overview ||
      module.summary ||
      `Comprehensive deep-dive into ${module.title || "the module domain"} covering architectural patterns, core mechanics, and production best practices.`;
    const summary = module.summary || module.overview || "";

    const rawConcepts = module.content?.keyConcepts ?? module.keyConcepts;
    const keyConcepts: CourseConcept[] = Array.isArray(rawConcepts) && rawConcepts.length > 0
      ? rawConcepts
      : [
          {
            topic: "Core Architecture & Principles",
            title: `${module.title || "Module"} Core Principles`,
            description: overview,
            whyItMatters: `Establishes Level ${courseTargetLevel} competency and prevents runtime vulnerabilities in production environments.`,
            howItWorks: "Follows standard architectural patterns with modular separation of concerns and clear boundary validation.",
          },
        ];

    const rawObjectives =
      module.learningObjectives ?? module.content?.learningObjectives;
    const learningObjectives: string[] = Array.isArray(rawObjectives) && rawObjectives.length > 0
      ? rawObjectives
      : [
          `Master core architectural foundations and implementation patterns for ${module.title || "this domain"}.`,
          `Apply production-grade error handling and edge-case mitigation techniques.`,
          `Demonstrate practical execution adhering to Level ${courseTargetLevel} industry standards.`,
        ];

    const curriculum = courseId ? getCourseCurriculum(courseId) : null;
    const currMod = curriculum?.modules?.find(
      (m) => m.id === module.id || m.order === module.order
    );

    const rawResources =
      module.resources ??
      module.content?.resources ??
      currMod?.resources;

    const resources: LearningResource[] =
      Array.isArray(rawResources) && rawResources.length > 0
        ? rawResources
        : (currMod?.resources && currMod.resources.length > 0 ? currMod.resources : []);

    const practicalExercise =
      module.content?.practicalExercise ||
      module.practicalExercise ||
      `Practical Hands-On Lab: Implement ${module.title || "Module"} Architecture\n\nScenario: You are tasked with implementing a production-grade component for Capacity Connect.\n\nRequirements:\n1. Construct the core domain logic adhering to architectural guidelines.\n2. Implement edge-case validation and structured error containment.\n3. Write automated tests verifying functionality under high-concurrency conditions.\n4. Ensure compliance with Level ${courseTargetLevel} performance benchmarks.`;

    const competencyVerification =
      module.content?.competencyVerification ||
      module.competencyVerification ||
      `Demonstrates practitioner proficiency meeting Level ${courseTargetLevel} industry standards for ${module.title || "this competency area"}.`;

    return {
      id: module.id,
      order: module.order ?? 1,
      title: module.title || "Module Learning Session",
      durationMinutes: module.durationMinutes || 60,
      summary,
      overview,
      learningObjectives,
      resources,
      keyConcepts,
      practicalExercise,
      competencyVerification,
    };
  }, [module, courseId, courseTargetLevel]);

  // Learning Step Tabs: Overview -> Objectives -> Concepts -> Resources -> Practical Lab -> Verification
  type SectionKey = "overview" | "objectives" | "concepts" | "resources" | "lab" | "verification";
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [activeConceptIndex, setActiveConceptIndex] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false);

  // Group key concepts by their section
  const sectionGroups = React.useMemo(() => {
    if (!currentModule?.keyConcepts || currentModule.keyConcepts.length === 0) return [];
    const groupsMap = new Map<string, { concept: CourseConcept; globalIndex: number }[]>();

    currentModule.keyConcepts.forEach((concept, index) => {
      const secName = concept.section || concept.topic || "Core Curriculum Lessons";
      if (!groupsMap.has(secName)) {
        groupsMap.set(secName, []);
      }
      groupsMap.get(secName)!.push({ concept, globalIndex: index });
    });

    return Array.from(groupsMap.entries()).map(([sectionTitle, concepts]) => ({
      sectionTitle,
      concepts,
    }));
  }, [currentModule?.keyConcepts]);

  // Reset section when a new module is loaded
  useEffect(() => {
    if (isOpen && module) {
      setActiveSection("overview");
      setActiveConceptIndex(0);
      setIsCompletedSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen, module]);

  if (!currentModule) return null;

  const sortedModules = [...(allModules || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const currentIndex = sortedModules.findIndex((m) => m.id === currentModule.id);
  const nextModule =
    currentIndex >= 0 && currentIndex < sortedModules.length - 1
      ? sortedModules[currentIndex + 1]
      : null;
  const prevModule =
    currentIndex > 0 ? sortedModules[currentIndex - 1] : null;

  const durationHours = Math.max(
    1,
    Math.round(currentModule.durationMinutes / 60)
  );

  const sections: { key: SectionKey; label: string; count?: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Overview & Architecture", icon: BookOpen },
    { key: "objectives", label: "Learning Objectives", count: currentModule.learningObjectives.length, icon: ListChecks },
    { key: "concepts", label: "Topics & Deep Dive", count: currentModule.keyConcepts.length, icon: Code },
    { key: "resources", label: "Learning Resources", count: currentModule.resources.length, icon: BookMarked },
    { key: "lab", label: "Practical Hands-On Lab", icon: Terminal },
    { key: "verification", label: "Competency Verification", icon: Award },
  ];

  const currentSectionIndex = sections.findIndex((s) => s.key === activeSection);
  const currentConcept = currentModule.keyConcepts[activeConceptIndex] || currentModule.keyConcepts[0];

  function handleCopySnippet(code: string, idx: number) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  }

  async function handleMarkComplete() {
    setIsSubmitting(true);
    try {
      await onCompleteModule(module);
      setIsCompletedSuccess(true);
    } catch (err: any) {
      console.error("Failed to complete module:", err);
      alert(err.message || "Failed to complete module.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleProceedToNextModule() {
    if (nextModule && onSelectModule) {
      onSelectModule(nextModule);
    } else {
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-full h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl">
        {/* Top Coursera-Style Navigation Bar */}
        <div className="border-b bg-card px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={onClose}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to Course</span>
            </Button>
            <div className="h-4 w-px bg-border/80" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                  {courseTitle}
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                  Level {courseTargetLevel}
                </Badge>
              </div>
              <h2 className="text-sm font-bold text-foreground truncate max-w-md sm:max-w-xl">
                Module {currentModule.order}: {currentModule.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/60">
              <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{currentModule.durationMinutes} mins ({durationHours} hr{durationHours > 1 ? "s" : ""})</span>
            </div>
            <Badge variant="default" className="bg-indigo-600 text-white text-[11px] font-medium px-2.5 py-0.5 shadow-2xs">
              Learning Mode
            </Badge>
          </div>
        </div>

        {/* Main Body: 2-Column Coursera Layout (Sidebar + Reading Canvas) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Navigation Sidebar */}
          <aside className="w-80 border-r border-border/70 bg-muted/20 shrink-0 hidden md:flex flex-col justify-between overflow-y-auto p-4 space-y-4">
            <div className="space-y-3">
              <div className="px-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Module Syllabus
                </span>
                <span className="text-xs text-foreground font-semibold mt-0.5 block">
                  {sections.length} Learning Steps • {currentModule.keyConcepts.length} Lessons
                </span>
              </div>

              <div className="space-y-1">
                {sections.map((sec, idx) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.key;
                  const isPast = idx < currentSectionIndex;

                  return (
                    <div key={sec.key} className="space-y-1">
                      <button
                        onClick={() => setActiveSection(sec.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-xs font-semibold"
                            : isPast
                            ? "text-foreground hover:bg-muted/60"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs ${
                              isActive
                                ? "bg-white/20 text-white"
                                : isPast
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isPast ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                          </div>
                          <span className="truncate">{sec.label}</span>
                        </div>
                        {sec.count !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                              isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sec.count}
                          </span>
                        )}
                      </button>

                      {/* Hierarchical Sub-Sections & Lessons under Topics & Deep Dive */}
                      {sec.key === "concepts" && sectionGroups.length > 0 && (
                        <div className={`ml-3 pl-2.5 border-l-2 border-indigo-200 dark:border-indigo-900/60 space-y-2.5 py-1.5 ${activeSection === "concepts" ? "block" : "hidden"}`}>
                          {sectionGroups.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-1.5 line-clamp-1">
                                {group.sectionTitle}
                              </span>
                              <div className="space-y-0.5">
                                {group.concepts.map(({ concept, globalIndex }) => {
                                  const isConceptActive = activeSection === "concepts" && activeConceptIndex === globalIndex;
                                  const isConceptPast = globalIndex < activeConceptIndex;

                                  return (
                                    <button
                                      key={globalIndex}
                                      onClick={() => {
                                        setActiveSection("concepts");
                                        setActiveConceptIndex(globalIndex);
                                      }}
                                      className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-all flex items-center justify-between gap-1.5 ${
                                        isConceptActive
                                          ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-200 font-bold shadow-2xs border border-indigo-300 dark:border-indigo-800"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-mono text-[10px] opacity-70 shrink-0">
                                          {isConceptPast ? (
                                            <Check className="h-3 w-3 text-emerald-600 inline" />
                                          ) : isConceptActive ? (
                                            "●"
                                          ) : (
                                            `${globalIndex + 1}.`
                                          )}
                                        </span>
                                        <span className="truncate">{concept.title}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Module Context Info Card */}
            <div className="rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-900 dark:to-slate-950 p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Skill Target</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Completing this module advances your verified knowledge toward Level {courseTargetLevel} proficiency.
              </p>
            </div>
          </aside>

          {/* Right Main Learning Content Area */}
          <main className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
            {/* Mobile Tab Stepper Pill */}
            <div className="flex md:hidden overflow-x-auto gap-1.5 pb-2 border-b">
              {sections.map((sec, idx) => (
                <Button
                  key={sec.key}
                  variant={activeSection === sec.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 shrink-0 gap-1"
                  onClick={() => setActiveSection(sec.key)}
                >
                  <span>{idx + 1}.</span> {sec.label}
                </Button>
              ))}
            </div>

            {/* Completion Success Banner */}
            {isCompletedSuccess && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 shadow-sm space-y-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                      Module Completed Successfully!
                    </h3>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                      Your learning progress has been recorded in Capacity Connect.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {nextModule ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-8.5 shadow-xs"
                      onClick={handleProceedToNextModule}
                    >
                      <span>Proceed to Module {nextModule.order}: {nextModule.title}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-8.5 shadow-xs"
                      onClick={onClose}
                    >
                      <Award className="h-4 w-4" />
                      View Completed Course &amp; Reassessment Status
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8.5"
                    onClick={onClose}
                  >
                    Return to Course Roadmap
                  </Button>
                </div>
              </div>
            )}

            {/* 1. OVERVIEW & ARCHITECTURE */}
            {activeSection === "overview" && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold text-indigo-700 border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40">
                      Section 1 of {sections.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Architectural Overview</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {currentModule.title}
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentModule.summary}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <BookOpen className="h-4.5 w-4.5" />
                    <h3>Theoretical Overview &amp; Domain Foundations</h3>
                  </div>
                  <div className="text-sm text-foreground/90 leading-relaxed space-y-3 font-normal">
                    <p className="whitespace-pre-line">{currentModule.overview}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground block">Estimated Time</span>
                    <span className="text-sm font-bold text-foreground block">{currentModule.durationMinutes} Minutes</span>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground block">Target Standard</span>
                    <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400 block font-mono">Level {courseTargetLevel} Practitioner</span>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                    <span className="text-[11px] font-semibold text-muted-foreground block">Key Concepts</span>
                    <span className="text-sm font-bold text-foreground block">{currentModule.keyConcepts.length} Lessons Included</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. LEARNING OBJECTIVES */}
            {activeSection === "objectives" && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold text-indigo-700 border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40">
                      Section 2 of {sections.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Competency Benchmarks</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    What You Will Master in this Module
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    By completing this module, you will demonstrate the following specific, verifiable capabilities:
                  </p>
                </div>

                <div className="space-y-3">
                  {currentModule.learningObjectives.map((obj, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 p-4 rounded-xl border border-border/80 bg-card shadow-2xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-xs font-bold mt-0.5">
                        {i + 1}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                          {obj}
                        </p>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Level {courseTargetLevel} Verification Standard
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. TOPICS & CONCEPTS DEEP DIVE (STRUCTURED 10-PART LESSON READER) */}
            {activeSection === "concepts" && currentConcept && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                {/* Lesson Navigation Header & Tab Strip */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-mono font-bold text-indigo-700 border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40">
                        Lesson {activeConceptIndex + 1} of {currentModule.keyConcepts.length}
                      </Badge>
                      {currentConcept.topic && (
                        <Badge variant="secondary" className="text-xs font-medium bg-muted/40">
                          {currentConcept.topic}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeConceptIndex <= 0}
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => setActiveConceptIndex((prev) => Math.max(0, prev - 1))}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Previous Lesson</span>
                      </Button>
                      <span className="text-xs font-mono px-2 text-muted-foreground">
                        {activeConceptIndex + 1} / {currentModule.keyConcepts.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeConceptIndex >= currentModule.keyConcepts.length - 1}
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => setActiveConceptIndex((prev) => Math.min(currentModule.keyConcepts.length - 1, prev + 1))}
                      >
                        <span className="hidden sm:inline">Next Lesson</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Horizontal Lesson Selector Tabs */}
                  {currentModule.keyConcepts.length > 1 && (
                    <div className="flex overflow-x-auto gap-2 py-1 scrollbar-none">
                      {currentModule.keyConcepts.map((concept, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveConceptIndex(idx)}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                            activeConceptIndex === idx
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-semibold"
                              : "bg-card text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted/40"
                          }`}
                        >
                          <span className="font-mono text-[10px] opacity-80">{idx + 1}.</span>
                          <span className="truncate max-w-[160px] sm:max-w-[220px]">{concept.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Title & Concept Summary */}
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span className="text-primary font-semibold">{currentConcept.section || "Section 1"}</span>
                      <span>•</span>
                      <span>Lesson {activeConceptIndex + 1} of {currentModule.keyConcepts.length}</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      {currentConcept.title}
                    </h1>
                    {currentConcept.description && (
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        {currentConcept.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Structured Educational Components */}
                <div className="space-y-5">
                  {/* PREREQUISITES / CONTEXT (IF SPECIFIED) */}
                  {currentConcept.prerequisites && (
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs flex items-start gap-2.5">
                      <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground block">Prerequisites &amp; Foundational Context:</span>
                        <p className="text-muted-foreground leading-relaxed mt-0.5">{currentConcept.prerequisites}</p>
                      </div>
                    </div>
                  )}

                  {/* 1. WHY IT MATTERS / MOTIVATION */}
                  {currentConcept.whyItMatters && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-300/60 dark:border-amber-900/40 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                        <Lightbulb className="h-4.5 w-4.5" />
                        <h3>1. Why This Concept Matters (Problem &amp; Motivation)</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line pl-6">
                        {currentConcept.whyItMatters}
                      </p>
                    </div>
                  )}

                  {/* 2. HOW IT WORKS / ARCHITECTURAL MECHANICS */}
                  {currentConcept.howItWorks && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/5 border border-indigo-300/60 dark:border-indigo-900/40 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold">
                        <Sparkles className="h-4.5 w-4.5" />
                        <h3>2. How It Works (Algorithmic &amp; Architectural Mechanics)</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line pl-6">
                        {currentConcept.howItWorks}
                      </p>
                    </div>
                  )}

                  {/* 3. STEP-BY-STEP BREAKDOWN */}
                  {currentConcept.stepByStep && currentConcept.stepByStep.length > 0 && (
                    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
                      <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <ListChecks className="h-4.5 w-4.5" />
                        <h3>3. Step-by-Step Execution Breakdown</h3>
                      </div>
                      <div className="space-y-2.5">
                        {currentConcept.stepByStep.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-xs font-bold mt-0.5">
                              {sIdx + 1}
                            </div>
                            <p className="text-foreground/90 leading-relaxed font-normal pt-0.5">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. CONCRETE WORKED EXAMPLE */}
                  {currentConcept.workedExample && (
                    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                        <FileText className="h-4.5 w-4.5" />
                        <h3>4. Worked Example &amp; State Transformation</h3>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 whitespace-pre-line">
                        {currentConcept.workedExample}
                      </div>
                    </div>
                  )}

                  {/* 5. REAL-WORLD INDUSTRY USAGE */}
                  {currentConcept.realWorldUsage && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-300/60 dark:border-blue-900/40 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold">
                        <Layers className="h-4.5 w-4.5" />
                        <h3>5. Real-World Industry Application</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pl-6">
                        {currentConcept.realWorldUsage}
                      </p>
                    </div>
                  )}

                  {/* 6. PRODUCTION IMPLEMENTATION / CODE (WHERE APPLICABLE) */}
                  {currentConcept.codeSnippet && (
                    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <Code className="h-4.5 w-4.5" />
                          <h3>6. Production Implementation</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => handleCopySnippet(currentConcept.codeSnippet!, activeConceptIndex)}
                        >
                          {copiedIndex === activeConceptIndex ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner leading-relaxed">
                        <code>{currentConcept.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* 7. CODE WALKTHROUGH & LINE-BY-LINE MECHANICS */}
                  {currentConcept.codeExplanation && (
                    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                        <BookOpen className="h-4.5 w-4.5" />
                        <h3>7. Code Walkthrough &amp; Key Mechanics</h3>
                      </div>
                      <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line pl-2">
                        {currentConcept.codeExplanation}
                      </div>
                    </div>
                  )}

                  {/* 8. EXPECTED OUTPUT / RUNTIME BEHAVIOR */}
                  {currentConcept.expectedOutput && (
                    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-3 shadow-xs">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                        <Terminal className="h-4.5 w-4.5" />
                        <h3>8. Expected Output / Console Execution</h3>
                      </div>
                      <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                        <code>{currentConcept.expectedOutput}</code>
                      </pre>
                    </div>
                  )}

                  {/* 9. COMMON PITFALLS & ANTI-PATTERNS */}
                  {currentConcept.commonMistakes && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/5 border border-rose-300/60 dark:border-rose-900/40 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                        <AlertTriangle className="h-4.5 w-4.5" />
                        <h3>9. Common Pitfalls &amp; Anti-Patterns to Avoid</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line pl-6">
                        {currentConcept.commonMistakes}
                      </p>
                    </div>
                  )}

                  {/* 10. BEST PRACTICES & PRODUCTION GUIDELINES */}
                  {currentConcept.bestPractices && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-teal-500/5 border border-teal-300/60 dark:border-teal-900/40 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                        <h3>10. Industry Best Practices &amp; Guidelines</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line pl-6">
                        {currentConcept.bestPractices}
                      </p>
                    </div>
                  )}

                  {/* 11. TRY IT YOURSELF / INTERACTIVE PRACTICE */}
                  {currentConcept.practiceTask && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-emerald-50/40 dark:from-indigo-950/40 dark:to-emerald-950/20 border border-indigo-200 dark:border-indigo-800 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
                        <CheckSquare className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                        <h3>11. Try It Yourself (Practice Checkpoint)</h3>
                      </div>
                      <p className="text-foreground/90 leading-relaxed font-medium pl-6">
                        {currentConcept.practiceTask}
                      </p>
                    </div>
                  )}

                  {/* 12. KEY TAKEAWAYS & SECTION RECAP */}
                  {currentConcept.keyTakeaway && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/80 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-bold">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                        <h3>Key Takeaways &amp; Lesson Recap</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pl-6">
                        {currentConcept.keyTakeaway}
                      </p>
                    </div>
                  )}
                </div>

                {/* Lesson Navigation Footer */}
                <div className="pt-4 flex items-center justify-between border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8.5 gap-1.5"
                    onClick={() => {
                      if (activeConceptIndex > 0) {
                        setActiveConceptIndex(activeConceptIndex - 1);
                      } else {
                        setActiveSection("objectives");
                      }
                    }}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>{activeConceptIndex > 0 ? "Previous Lesson" : "Back to Objectives"}</span>
                  </Button>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <span>Lesson {activeConceptIndex + 1} of {currentModule.keyConcepts.length}</span>
                  </div>

                  {activeConceptIndex < currentModule.keyConcepts.length - 1 ? (
                    <Button
                      size="sm"
                      className="text-xs h-8.5 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                      onClick={() => setActiveConceptIndex(activeConceptIndex + 1)}
                    >
                      <span>Next Lesson: {currentModule.keyConcepts[activeConceptIndex + 1]?.title.slice(0, 24)}...</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="text-xs h-8.5 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                      onClick={() => setActiveSection("resources")}
                    >
                      <span>Continue to Resources</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* 4. AUTHORITATIVE LEARNING RESOURCES */}
            {activeSection === "resources" && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold text-indigo-700 border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40">
                      Section 4 of {sections.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Official Documentation &amp; Reference</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Authoritative External Learning Resources
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Deepen your mastery with official specifications, documentation, and industry-standard reference manuals:
                  </p>
                </div>

                {(() => {
                  const relevantResources = (currentModule.resources || []).filter((r) => {
                    if (!r.url) return false;
                    // Filter out generic MDN / GitHub URLs unless course is full-stack web
                    const isGenericWeb = r.url.includes("developer.mozilla.org") || r.url.includes("docs.github.com");
                    const isWebCourse = courseTitle.toLowerCase().includes("web") || courseTitle.toLowerCase().includes("react") || courseTitle.toLowerCase().includes("frontend");
                    if (isGenericWeb && !isWebCourse) return false;
                    return true;
                  });

                  if (relevantResources.length === 0) {
                    return (
                      <div className="rounded-2xl border border-border/80 bg-card p-6 text-center space-y-2">
                        <BookMarked className="h-8 w-8 text-muted-foreground mx-auto opacity-60" />
                        <h3 className="text-sm font-bold text-foreground">
                          Self-Contained Module Material
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          All essential instructional content, algorithmic walkthroughs, and code implementations are contained directly within this module. No external references are required to complete your competency lab.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 gap-4">
                      {relevantResources.map((res, idx) => {
                        const providerName = res.provider || (
                          res.url.includes("realpython.com") ? "Real Python" :
                          res.url.includes("docs.python.org") ? "Python Documentation" :
                          res.url.includes("scikit-learn.org") ? "Scikit-Learn Documentation" :
                          res.url.includes("pytorch.org") ? "PyTorch Documentation" :
                          res.url.includes("huggingface.co") ? "Hugging Face" :
                          res.url.includes("postgresql.org") ? "PostgreSQL Documentation" :
                          res.url.includes("spring.io") ? "Spring Framework" :
                          res.url.includes("oracle.com") ? "Oracle Java Documentation" :
                          res.url.includes("react.dev") ? "React Documentation" :
                          res.url.includes("nextjs.org") ? "Next.js Documentation" :
                          res.url.includes("mlflow.org") ? "MLflow Documentation" :
                          res.url.includes("dvc.org") ? "DVC Documentation" :
                          res.url.includes("docker.com") ? "Docker Documentation" :
                          res.url.includes("kubernetes.io") ? "Kubernetes Documentation" :
                          res.url.includes("typescriptlang.org") ? "TypeScript Documentation" :
                          res.url.includes("developer.mozilla.org") ? "Mozilla MDN" :
                          res.url.includes("sbert.net") ? "Sentence-Transformers (SBERT)" :
                          res.url.includes("stanford.edu") ? "Stanford NLP" :
                          res.url.includes("arxiv.org") ? "arXiv Research" :
                          "Official Reference"
                        );

                        return (
                          <a
                            key={idx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-border/80 bg-card hover:border-indigo-400 hover:shadow-md transition-all space-y-3 sm:space-y-0 gap-4"
                          >
                            <div className="space-y-2 min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {res.title}
                                </h3>
                                <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider">
                                  {res.type}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 font-semibold font-mono">
                                <span className="text-muted-foreground font-sans font-normal">Provider:</span>
                                <span>{providerName}</span>
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {res.description}
                              </p>

                              <span className="text-[11px] text-muted-foreground/70 font-mono block truncate max-w-lg">
                                {res.url}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shrink-0 self-start sm:self-center shadow-xs transition-colors">
                              <span>Open Resource</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 5. PRACTICAL HANDS-ON LAB */}
            {activeSection === "lab" && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold text-indigo-700 border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40">
                      Section 5 of {sections.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Practical Lab Activity</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Hands-On Practical Lab Assignment
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Apply the theoretical principles to execute this concrete engineering workflow:
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white dark:from-slate-900 dark:to-slate-950 p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                    <Terminal className="h-4.5 w-4.5" />
                    <h3>Lab Assignment Scenario &amp; Implementation Requirements</h3>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-border/80 shadow-2xs">
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed font-normal whitespace-pre-line">
                      {currentModule.practicalExercise}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/60">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Complete your code implementation locally or in your organization repository before submitting competency verification.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. COMPETENCY VERIFICATION & COMPLETION */}
            {activeSection === "verification" && (
              <div className="space-y-6 animate-fade-in max-w-4xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono font-bold text-indigo-700 border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40">
                      Section 6 of {sections.length}
                    </Badge>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Evaluation Standard</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Competency Verification &amp; Module Completion
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Verify your alignment against the target domain standards and record your completion:
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white dark:from-slate-900 dark:to-slate-950 p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <Award className="h-4.5 w-4.5" />
                    <h3>Competency Verification Standard</h3>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-border/80 shadow-2xs">
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed font-normal">
                      {currentModule.competencyVerification}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                    <span className="text-xs font-bold text-foreground block">
                      Readiness Checklist:
                    </span>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                      <li>Studied the architecture overview and core concepts</li>
                      <li>Reviewed and practiced the provided code examples</li>
                      <li>Read authoritative external documentation resources</li>
                      <li>Executed the hands-on practical lab assignment</li>
                      <li>Satisfied Level {courseTargetLevel} competency criteria</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Button
                      size="lg"
                      disabled={isSubmitting || isCompletedSuccess}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-2 h-10 px-6 shadow-xs"
                      onClick={handleMarkComplete}
                    >
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      {isSubmitting
                        ? "Recording Progress..."
                        : isCompletedSuccess
                        ? "Module Completed ✓"
                        : "Complete Module & Save Progress"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Bottom Step Navigation Bar */}
        <div className="border-t bg-card px-6 py-3 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled={currentSectionIndex <= 0}
            className="text-xs h-8 gap-1.5"
            onClick={() => {
              const prev = sections[currentSectionIndex - 1];
              if (prev) {
                setActiveSection(prev.key);
              }
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Previous Step</span>
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span>Step {currentSectionIndex + 1} of {sections.length}</span>
          </div>

          {currentSectionIndex < sections.length - 1 ? (
            <Button
              size="sm"
              className="text-xs h-8 gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              onClick={() => {
                const next = sections[currentSectionIndex + 1];
                if (next) {
                  setActiveSection(next.key);
                }
              }}
            >
              <span>Next: {sections[currentSectionIndex + 1]?.label}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={isSubmitting || isCompletedSuccess}
              className="text-xs h-8 gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              onClick={handleMarkComplete}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isCompletedSuccess ? "Completed ✓" : "Complete Module"}</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
