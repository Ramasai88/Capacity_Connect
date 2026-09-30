"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock,
  Lock, Send, ChevronRight, ChevronLeft,
} from "lucide-react";

export default function QuestionnaireAttemptPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [q, setQ] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attempt state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Client-side timer (display only — server deadline is authoritative)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.questionnaires.getById(id);
      const data = res.data;
      setQ(data);

      // Start client-side timer
      if (data.durationMinutes) {
        setSecondsLeft(data.durationMinutes * 60);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load questionnaire.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Tick timer
  useEffect(() => {
    if (secondsLeft === null || result) return;
    if (secondsLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null || s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft !== null && secondsLeft === q?.durationMinutes * 60, result]);

  async function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      if (formattedAnswers.length === 0) {
        setSubmitError("Please answer at least one question before submitting.");
        setSubmitting(false);
        return;
      }

      const res = await apiClient.questionnaires.submit(id, {
        answers: formattedAnswers,
        timeSpentMinutes: q?.durationMinutes && secondsLeft !== null
          ? Math.max(1, Math.round((q.durationMinutes * 60 - secondsLeft) / 60))
          : undefined,
      });
      setResult(res.data);
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading assessment...
    </div>
  );

  if (error || !q) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/questionnaires"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="h-3.5 w-3.5" />Back</Button></Link>
      <Card className="border-rose-200 bg-rose-50/50">
        <CardContent className="flex items-center gap-2 p-4 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />{error || "Not found."}
        </CardContent>
      </Card>
    </div>
  );

  // Guard: non-trainees shouldn't attempt
  if (role !== "TRAINEE") return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/questionnaires"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="h-3.5 w-3.5" />Back</Button></Link>
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="flex items-center gap-2 p-4 text-xs text-amber-700">
          <Lock className="h-4 w-4 shrink-0" />Only trainees can take questionnaires.
        </CardContent>
      </Card>
    </div>
  );

  const isPast = q.deadline && new Date(q.deadline) < new Date();
  const alreadySubmitted = q.hasAttempted || q.submission != null || q.mySubmission != null;
  const questions: any[] = q.questions ?? [];

  // Guard: already submitted
  if (alreadySubmitted && !result) {
    const prevScore = q.submission?.score ?? q.mySubmission?.score;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href={`/questionnaires/${id}`}><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="h-3.5 w-3.5" />Back</Button></Link>
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-5 w-5" /> Already Submitted
            </div>
            <p className="text-sm text-muted-foreground">
              You have already submitted this assessment.
              {prevScore !== undefined && <> Your score was <strong>{prevScore}%</strong>.</>}
            </p>
            <Link href="/questionnaires"><Button size="sm" variant="outline">Back to Questionnaires</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Guard: closed
  if (isPast && !result) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href={`/questionnaires/${id}`}><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="h-3.5 w-3.5" />Back</Button></Link>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-amber-700">
            <Lock className="h-4 w-4 shrink-0" />This assessment deadline has passed.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Guard: no questions
  if (questions.length === 0 && !result) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href={`/questionnaires/${id}`}><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="h-3.5 w-3.5" />Back</Button></Link>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">No questions have been added to this assessment yet.</CardContent>
        </Card>
      </div>
    );
  }

  // Result screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className={`border-2 ${result.passed ? "border-emerald-300" : "border-rose-300"}`}>
          <CardHeader className={`rounded-t-xl ${result.passed ? "bg-emerald-50" : "bg-rose-50"}`}>
            <div className="flex items-center gap-3">
              {result.passed
                ? <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                : <AlertCircle className="h-8 w-8 text-rose-600" />}
              <div>
                <CardTitle className={`text-xl font-extrabold ${result.passed ? "text-emerald-700" : "text-rose-700"}`}>
                  {result.passed ? "Passed!" : "Not Passed"}
                </CardTitle>
                <CardDescription>Assessment complete</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-muted/40 border p-3 space-y-1">
                <div className="text-2xl font-extrabold text-foreground">{result.score ?? "—"}%</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Your Score</div>
              </div>
              <div className="rounded-xl bg-muted/40 border p-3 space-y-1">
                <div className="text-2xl font-extrabold text-foreground">{result.correctAnswers ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Correct</div>
              </div>
              <div className="rounded-xl bg-muted/40 border p-3 space-y-1">
                <div className="text-2xl font-extrabold text-foreground">{result.totalQuestions ?? questions.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Passing score required: <strong>{q.passingScore}%</strong>
            </p>
            <Link href="/questionnaires">
              <Button className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Questionnaires
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQ];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPct = (answeredCount / totalQ) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href={`/questionnaires/${id}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Exit
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">
            {currentQ + 1} / {totalQ}
          </span>
          {secondsLeft !== null && (
            <span className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
              secondsLeft < 120 ? "text-rose-700 bg-rose-50 border-rose-300 animate-pulse" : "text-indigo-700 bg-indigo-50 border-indigo-200"
            }`}>
              <Clock className="h-3 w-3" /> {formatTime(secondsLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Question Card */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Question {currentQ + 1}</span>
            {currentQuestion.competency && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium">
                {currentQuestion.competency.name}
              </span>
            )}
          </div>
          <CardTitle className="text-base font-bold leading-snug mt-1">
            {currentQuestion.questionText || currentQuestion.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 pb-6">
          {(currentQuestion.options ?? []).map((opt: any, idx: number) => {
            const isSelected = answers[currentQuestion.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: idx }))}
                className={`w-full text-left p-3.5 rounded-xl border text-sm font-medium transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-400"
                    : "border-border hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold mr-2.5 ${
                  isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-300"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {typeof opt === "string" ? opt : opt.text}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="gap-1.5 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Button>

        <span className="text-[11px] text-muted-foreground">
          {answeredCount} of {totalQ} answered
        </span>

        {currentQ < totalQ - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentQ((p) => Math.min(totalQ - 1, p + 1))}
            className="gap-1.5 text-xs"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Submit Assessment
          </Button>
        )}
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs border font-medium bg-rose-50 text-rose-800 border-rose-200">
          <AlertCircle className="h-4 w-4" />{submitError}
        </div>
      )}
    </div>
  );
}
