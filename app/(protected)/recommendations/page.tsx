"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  BrainCircuit,
  TrendingUp,
  RefreshCw,
  Loader2,
  Award,
  GraduationCap,
  Clock,
  HelpCircle,
  BarChart3,
  Check,
  Lightbulb,
  Target
} from "lucide-react";
import { TOPIC_CONCEPTS } from "@/lib/assessment/exam-bank";

interface Competency {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface CourseModule {
  id: string;
  title: string;
  order: number;
}

interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  targetLevel: number;
  durationHours: number;
  modules: CourseModule[];
}

interface SkillRecommendation {
  id: string;
  competencyId: string;
  courseId: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  weakTopics: string[];
  scorePercentage: number | null;
  currentLevel: number | null;
  requiredLevel: number | null;
  gap: number | null;
  reason: string;
  status: string;
  confidenceScore: number;
  competency: Competency;
  course: Course | null;
}

interface ClientQuestion {
  id: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question: string;
  options: Array<{ id: "A" | "B" | "C" | "D"; text: string }>;
}

interface ExamData {
  id: string;
  title: string;
  description: string;
  competencyCode: string;
  durationMinutes: number;
  totalQuestions: number;
  topics: string[];
  questions: ClientQuestion[];
}

interface EvaluationResult {
  score: number;
  totalQuestions: number;
  correctQuestions: number;
  topicBreakdown: Array<{
    topic: string;
    score: number;
    totalQuestions: number;
    correctQuestions: number;
  }>;
}

const PRIORITY_CONFIG = {
  HIGH: {
    label: "High Priority",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
    icon: Flame,
    iconColor: "text-rose-600",
    borderClass: "border-rose-200/80 hover:border-rose-300",
  },
  MEDIUM: {
    label: "Medium Priority",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    borderClass: "border-amber-200/80 hover:border-amber-300",
  },
  LOW: {
    label: "Skill Enhancement",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
    icon: TrendingUp,
    iconColor: "text-emerald-600",
    borderClass: "border-emerald-200/80 hover:border-emerald-300",
  },
};

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  // Diagnostic Exam Interactive State
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examMode, setExamMode] = useState<"INTRO" | "IN_PROGRESS" | "RESULT">("INTRO");
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittingExam, setSubmittingExam] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [examError, setExamError] = useState<string | null>(null);

  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, assessRes] = await Promise.all([
        fetch("/api/recommendations"),
        fetch("/api/assessments"),
      ]);
      if (recRes.ok) {
        const data = await recRes.json();
        setRecommendations(data.recommendations || []);
      }
      if (assessRes.ok) {
        const data = await assessRes.json();
        setAssessmentHistory(data.assessments || []);
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      // Explicit click on "Refresh Analysis" resets the currently displayed analysis state
      setRecommendations([]);
      setAssessmentHistory([]);
      setEvaluationResult(null);
      setUserAnswers({});
    } catch (err) {
      console.error("Failed to refresh recommendations:", err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleStartLearning(courseId: string) {
    try {
      setEnrollingCourseId(courseId);
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok || res.status === 409) {
        router.push(`/courses/${courseId}/learn`);
      } else {
        const data = await res.json();
        alert(data?.error?.message || "Failed to start course.");
      }
    } catch (err) {
      console.error("Enrollment error:", err);
    } finally {
      setEnrollingCourseId(null);
    }
  }

  // Load Exam Questions when modal opens or exam starts
  async function handleOpenExam() {
    setExamModalOpen(true);
    setExamMode("INTRO");
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setEvaluationResult(null);
    setExamError(null);

    if (!examData) {
      try {
        setLoadingQuestions(true);
        const res = await fetch("/api/assessments/exam?examId=exam-python-advanced");
        if (res.ok) {
          const data = await res.json();
          setExamData(data.exam);
        } else {
          setExamError("Failed to load exam questions from server.");
        }
      } catch {
        setExamError("Network error loading questions.");
      } finally {
        setLoadingQuestions(false);
      }
    }
  }

  function handleSelectOption(questionId: string, optionId: string) {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  async function handleSubmitExam() {
    if (!examData) return;

    // Check for unanswered questions
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < examData.totalQuestions) {
      const confirmIncomplete = confirm(
        `You have answered ${answeredCount} of ${examData.totalQuestions} questions. Unanswered questions will be scored as incorrect. Proceed with submission?`
      );
      if (!confirmIncomplete) return;
    }

    try {
      setSubmittingExam(true);
      setExamError(null);

      const answersPayload = Object.entries(userAnswers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      const res = await fetch("/api/assessments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: examData.id,
          answers: answersPayload,
          timeTakenMinutes: 20,
        }),
      });

      const data = await res.json();
      if (res.ok && data.evaluation) {
        setEvaluationResult(data.evaluation);
        setExamMode("RESULT");
        // Update live recommendations in parent view
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } else {
        setExamError(data?.error?.message || "Failed to submit exam.");
      }
    } catch {
      setExamError("An error occurred during submission. Please try again.");
    } finally {
      setSubmittingExam(false);
    }
  }

  const answeredCount = Object.keys(userAnswers).length;
  const currentQuestion = examData?.questions[currentQuestionIdx];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800/80 animate-slide-up">
        {/* Floating Decorative Glow Orbs */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-float-reverse" />
        <div className="absolute inset-0 hero-mesh-pattern opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold backdrop-blur-md text-indigo-200 border border-white/15 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300 animate-pulse" />
              <span>Adaptive Skill Synthesis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Skill Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Targeted upskilling roadmaps derived from your real diagnostic assessment evaluations, current competencies, and role baseline requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              size="sm"
              onClick={handleOpenExam}
              className="text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md btn-premium border border-indigo-400/30"
            >
              <Award className="h-3.5 w-3.5" />
              Take Diagnostic Exam
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="text-xs font-semibold gap-1.5 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white transition-all btn-premium"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Analysis
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive Exam Modal */}
      <Dialog open={examModalOpen} onOpenChange={setExamModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* INTRO SCREEN */}
          {examMode === "INTRO" && (
            <div className="space-y-5 py-2">
              <DialogHeader>
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <BrainCircuit className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Diagnostic Evaluation</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {examData?.title || "Python Advanced Architecture Exam"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  {examData?.description ||
                    "Evaluates Variables & Memory Models, OOP Architecture, AsyncIO Event Loops, Thread Synchronization, and Microservices design."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-border/60 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium block">Total Questions</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-indigo-600" />
                    20 Questions
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground font-medium block">Estimated Time</span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    25 Minutes
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Topics Evaluated (4 Questions Each):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    "1. Variables & Memory Reference Models",
                    "2. OOP & Metaclass Architecture",
                    "3. AsyncIO & Non-Blocking Event Loops",
                    "4. Thread Synchronization & Mutex Primitives",
                    "5. Microservices & Resilient Architecture",
                  ].map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg border bg-card/60 text-muted-foreground font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {examError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{examError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setExamModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setExamMode("IN_PROGRESS")}
                  disabled={loadingQuestions || !examData}
                  className="text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loadingQuestions ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading Questions...</>
                  ) : (
                    <><BookOpen className="h-3.5 w-3.5" /> Start Exam</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* IN_PROGRESS EXAM SCREEN */}
          {examMode === "IN_PROGRESS" && currentQuestion && (
            <div className="space-y-5 py-2">
              {/* Question Header & Counter */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      Question {currentQuestionIdx + 1} of {examData?.totalQuestions || 20}
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {currentQuestion.topic}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Progress: {Math.round((answeredCount / (examData?.totalQuestions || 20)) * 100)}% ({answeredCount} answered)
                  </span>
                </div>

                <Badge variant="outline" className="text-[10px] font-mono border-indigo-200 text-indigo-700 bg-indigo-50/50">
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / (examData?.totalQuestions || 20)) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/30 p-4">
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const isSelected = userAnswers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all text-xs font-medium ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-600/30 font-semibold"
                          : "border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-900/40 text-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-300 text-slate-600 bg-slate-100"
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Question Navigator Grid */}
              <div className="border-t border-border/60 pt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Question Navigator</span>
                  <span>{answeredCount}/20 Answered</span>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {examData?.questions.map((q, idx) => {
                    const isAnswered = !!userAnswers[q.id];
                    const isCurrent = idx === currentQuestionIdx;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`h-7 text-[11px] font-bold rounded-md transition-all flex items-center justify-center ${
                          isCurrent
                            ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400"
                            : isAnswered
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-border"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {examError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{examError}</span>
                </div>
              )}

              {/* Navigation Footer */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestionIdx === 0}
                  className="text-xs font-semibold gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </Button>

                {currentQuestionIdx < (examData?.totalQuestions || 20) - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQuestionIdx((prev) => prev + 1)}
                    className="text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmitExam}
                    disabled={submittingExam}
                    className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    {submittingExam ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Evaluating Results...</>
                    ) : (
                      <><Check className="h-3.5 w-3.5" /> Submit Exam</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* RESULT SCREEN */}
          {examMode === "RESULT" && evaluationResult && (
            <div className="space-y-6 py-2">
              <DialogHeader>
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Evaluation Complete</span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Diagnostic Assessment Result
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Your assessment has been evaluated server-side. Review your topic-by-topic breakdown and targeted learning recommendations below.
                </DialogDescription>
              </DialogHeader>

              {/* A. Overall Performance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-border/60">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Diagnostic Score
                  </span>
                  <span
                    className={`text-2xl font-extrabold ${
                      evaluationResult.score >= 75
                        ? "text-emerald-600"
                        : evaluationResult.score >= 50
                        ? "text-amber-600"
                        : "text-rose-600"
                    }`}
                  >
                    {evaluationResult.score}%
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Questions Correct
                  </span>
                  <span className="text-2xl font-extrabold text-foreground">
                    {evaluationResult.correctQuestions} / {evaluationResult.totalQuestions}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Completed On
                  </span>
                  <span className="text-sm font-bold text-foreground pt-1 block">
                    {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* F. Dynamic Result Explanation */}
              {(() => {
                const breakdown = evaluationResult.topicBreakdown || [];
                if (breakdown.length > 0) {
                  const sorted = [...breakdown].sort((a, b) => b.score - a.score);
                  const strongest = sorted[0];
                  const weakest = sorted[sorted.length - 1];
                  if (!strongest || !weakest) return null;
                  return (
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed flex items-start gap-2.5">
                      <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Diagnostic Summary:</strong> You scored <strong>{evaluationResult.score}%</strong> overall ({evaluationResult.correctQuestions}/{evaluationResult.totalQuestions} correct). Your strongest area was <strong>{strongest.topic} ({strongest.score}%)</strong>, while your primary improvement area is <strong>{weakest.topic} ({weakest.score}%)</strong>. We recommend strengthening your knowledge in weak topics before attempting official reassessment.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* B. Topic-by-Topic Performance */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  Topic-by-Topic Performance
                </h4>
                <div className="space-y-2.5">
                  {evaluationResult.topicBreakdown.map((t, idx) => {
                    const tier =
                      t.score >= 75
                        ? { label: "Strong", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", bar: "bg-emerald-500" }
                        : t.score >= 60
                        ? { label: "Good", badge: "bg-indigo-100 text-indigo-800 border-indigo-300", bar: "bg-indigo-500" }
                        : t.score >= 40
                        ? { label: "Needs Improvement", badge: "bg-amber-100 text-amber-800 border-amber-300", bar: "bg-amber-500" }
                        : { label: "High Priority", badge: "bg-rose-100 text-rose-800 border-rose-300", bar: "bg-rose-500" };

                    return (
                      <div key={idx} className="p-3 rounded-lg border bg-card space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                          <span className="font-bold">{t.topic}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {t.correctQuestions}/{t.totalQuestions} ({t.score}%)
                            </span>
                            <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${tier.badge}`}>
                              {tier.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${tier.bar}`}
                            style={{ width: `${t.score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* C & D. Topics That Need Focus & Relevant Concepts to Study */}
              {(() => {
                const weakTopics = evaluationResult.topicBreakdown.filter((t) => t.score < 60);
                if (weakTopics.length === 0) return null;

                return (
                  <div className="space-y-3 bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/70 p-4 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600" />
                      Topics That Need Focus & Relevant Concepts to Study
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Focus on mastering these essential architectural concepts from your assessment before proceeding:
                    </p>

                    <div className="space-y-3 pt-1">
                      {weakTopics.map((t, idx) => {
                        const concepts = TOPIC_CONCEPTS[t.topic] || [
                          "Core topic architecture and design patterns",
                          "Edge cases and error handling",
                          "Performance and optimization techniques",
                        ];

                        const isHighPriority = t.score < 40;

                        return (
                          <div key={idx} className="p-3 rounded-lg bg-white dark:bg-card border border-amber-200/60 shadow-2xs space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${isHighPriority ? "bg-rose-500 animate-pulse" : "bg-amber-500"}`} />
                                <span className="text-xs font-bold text-foreground">{t.topic}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold ${
                                  isHighPriority
                                    ? "bg-rose-50 text-rose-700 border-rose-300"
                                    : "bg-amber-50 text-amber-700 border-amber-300"
                                }`}
                              >
                                {isHighPriority ? "🔴 High Priority" : "🟠 Needs Improvement"} ({t.score}%)
                              </Badge>
                            </div>

                            <div className="text-[11px] space-y-1">
                              <span className="font-semibold text-muted-foreground">Focus on:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">
                                {concepts.map((concept, cIdx) => (
                                  <div key={cIdx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <span className="text-indigo-600 font-bold">•</span>
                                    <span>{concept}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* E. Learning Recommendation Action */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                    <GraduationCap className="h-4 w-4" />
                    Recommended Next Step
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Personalized learning modules addressing your weak topics are available in your course roadmap.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setExamModalOpen(false);
                    router.push("/courses");
                  }}
                  className="text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shrink-0 btn-premium"
                >
                  <BookOpen className="h-3.5 w-3.5" /> Start Learning <ArrowRight className="h-3 w-3" />
                </Button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExamModalOpen(false)}
                  className="text-xs font-semibold gap-1.5"
                >
                  Close & View Full Dashboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Recommendations List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium text-muted-foreground">
            Analyzing assessment metrics and calculating personalized recommendations...
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No active recommendations</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Take the Python Advanced Architecture Diagnostic Exam to generate your personalized learning recommendations.
            </p>
            <Button size="sm" onClick={handleOpenExam} className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
              Take Diagnostic Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {recommendations.map((rec) => {
            const config = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.LOW;
            const Icon = config.icon;

            return (
              <Card
                key={rec.id}
                className={`overflow-hidden border transition-all duration-200 shadow-xs ${config.borderClass}`}
              >
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/40 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-2xs border border-border/60 ${config.iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">
                          {rec.competency.name}
                        </CardTitle>
                        <CardDescription className="text-[11px] text-muted-foreground">
                          Category: {rec.competency.category}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs font-semibold px-2.5 py-0.5 ${config.badgeClass}`}>
                        {config.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {(rec.confidenceScore * 100).toFixed(0)}% Confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-4">
                  {/* Analysis Breakdown Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-3.5 border border-border/60">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Diagnostic Score
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {rec.scorePercentage != null ? `${rec.scorePercentage.toFixed(0)}%` : "Not Assessed"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Current Level
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        Level {rec.currentLevel || 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Required Baseline
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        Level {rec.requiredLevel || 0}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Identified Gap
                      </span>
                      <span className={`text-sm font-bold ${rec.gap && rec.gap > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {rec.gap && rec.gap > 0 ? `${rec.gap} Level${rec.gap > 1 ? "s" : ""}` : "None"}
                      </span>
                    </div>
                  </div>

                  {/* Explainability Section ("Why this was recommended") */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <BrainCircuit className="h-3.5 w-3.5 text-indigo-600" />
                      Recommendation Explanation
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/30 p-3 rounded-lg">
                      {rec.reason}
                    </p>
                  </div>

                  {/* Weak Topics Identified */}
                  {rec.weakTopics && rec.weakTopics.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Focus Topics to Master:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.weakTopics.map((topic, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-[11px] font-medium bg-slate-100 text-slate-800 border-slate-200"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Course & 1-Click Enrollment */}
                  {rec.course ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 pt-4 bg-muted/20 -mx-5 -mb-5 p-5 mt-2 rounded-b-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs font-bold text-foreground">
                            {rec.course.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {rec.course.modules?.length || 0} Comprehensive Modules • {rec.course.durationHours} Hours Duration
                        </p>
                      </div>

                      <Button
                        size="sm"
                        className="text-xs font-semibold gap-1.5 shrink-0 shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleStartLearning(rec.course!.id)}
                        disabled={enrollingCourseId === rec.course.id}
                      >
                        {enrollingCourseId === rec.course.id ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enrolling...</>
                        ) : (
                          <><BookOpen className="h-3.5 w-3.5" /> Start Learning <ArrowRight className="h-3 w-3 ml-1" /></>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground border-t border-border/60 pt-3">
                      No matching course catalog published for this specific competency yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diagnostic Assessment History & Topic Performance */}
      {assessmentHistory.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Your Diagnostic Assessment History
              </h2>
              <p className="text-xs text-muted-foreground">
                Past examination attempts and topic-level mastery evaluations.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
              {assessmentHistory.length} Recorded Attempt{assessmentHistory.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {assessmentHistory.map((assess: any) => (
              <Card key={assess.id} className="border border-border/80 shadow-xs">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-border/40 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-bold text-foreground">{assess.title}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Completed on {new Date(assess.completedAt).toLocaleDateString()} at{" "}
                        {new Date(assess.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Duration: {assess.timeTakenMinutes || 15} mins
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-extrabold px-3 py-1 ${
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
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {Array.isArray(assess.topicBreakdown) && assess.topicBreakdown.length > 0 && (
                    <div className="space-y-4">
                      {/* Topic Breakdown Meters */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Topic Performance Breakdown
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {assess.topicBreakdown.map((t: any, idx: number) => {
                            const tier =
                              t.score >= 75
                                ? { label: "Strong", badge: "bg-emerald-100 text-emerald-800 border-emerald-300", bar: "bg-emerald-500" }
                                : t.score >= 60
                                ? { label: "Good", badge: "bg-indigo-100 text-indigo-800 border-indigo-300", bar: "bg-indigo-500" }
                                : t.score >= 40
                                ? { label: "Needs Improvement", badge: "bg-amber-100 text-amber-800 border-amber-300", bar: "bg-amber-500" }
                                : { label: "High Priority", badge: "bg-rose-100 text-rose-800 border-rose-300", bar: "bg-rose-500" };

                            return (
                              <div key={idx} className="p-3 rounded-lg border bg-card space-y-1.5 shadow-2xs">
                                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                  <span className="truncate pr-1">{t.topic}</span>
                                  <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 rounded-full shrink-0 ${tier.badge}`}>
                                    {tier.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                                  <span>{t.correctQuestions}/{t.totalQuestions} correct</span>
                                  <span className="font-bold text-foreground">{t.score}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${tier.bar}`}
                                    style={{ width: `${t.score}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Weak Focus Areas & Study Concepts */}
                      {(() => {
                        const weakTopics = assess.topicBreakdown.filter((t: any) => t.score < 60);
                        if (weakTopics.length === 0) return null;

                        return (
                          <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                              <Target className="h-3.5 w-3.5 text-amber-600" />
                              Focus Areas & Key Concepts to Study
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {weakTopics.map((wt: any, wIdx: number) => {
                                const concepts = TOPIC_CONCEPTS[wt.topic] || ["Core architecture & error handling", "Edge cases & optimization"];
                                return (
                                  <div key={wIdx} className="p-2.5 rounded-lg bg-white dark:bg-card border border-amber-200/60 space-y-1 shadow-2xs">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
                                      <span>{wt.topic}</span>
                                      <span className={wt.score < 40 ? "text-rose-600" : "text-amber-600"}>{wt.score}%</span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground space-y-0.5 pt-0.5">
                                      {concepts.slice(0, 3).map((c, cIdx) => (
                                        <div key={cIdx} className="flex items-center gap-1">
                                          <span className="text-indigo-600">•</span>
                                          <span className="truncate">{c}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
