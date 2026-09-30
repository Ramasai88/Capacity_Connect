"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api/client";
import {
  ClipboardList, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Clock,
  Lock, Send, BarChart2, Archive, BookOpen,
} from "lucide-react";

export default function QuestionnaireDetailPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as "ADMIN" | "TRAINER" | "TRAINEE" || "TRAINEE";
  const canManage = role === "ADMIN" || role === "TRAINER";
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [q, setQ] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.questionnaires.getById(id);
      setQ(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load questionnaire.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handlePublish() {
    try { await apiClient.questionnaires.publish(id); setActionMsg("Published."); load(); }
    catch (err: any) { setActionMsg(err.message); }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleArchive() {
    try { await apiClient.questionnaires.archive(id); setActionMsg("Archived."); load(); }
    catch (err: any) { setActionMsg(err.message); }
    setTimeout(() => setActionMsg(null), 3000);
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
      <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading questionnaire...
    </div>
  );

  if (error || !q) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/questionnaires"><Button variant="outline" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="h-3.5 w-3.5" />Back</Button></Link>
      <Card className="border-rose-200 bg-rose-50/50">
        <CardContent className="flex items-center gap-2 p-4 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />{error || "Questionnaire not found."}
        </CardContent>
      </Card>
    </div>
  );

  const isPast = q.deadline && new Date(q.deadline) < new Date();
  const submitted = q.hasAttempted || q.submission != null || q.mySubmission != null;
  const questions: any[] = q.questions ?? [];
  const questionCount = questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/questionnaires">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> All Questionnaires
        </Button>
      </Link>

      {actionMsg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs border font-medium bg-indigo-50 text-indigo-800 border-indigo-200">
          <CheckCircle2 className="h-4 w-4" />{actionMsg}
        </div>
      )}

      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-lg font-bold">{q.title}</CardTitle>
              <CardDescription className="text-xs">
                Created by {q.trainer?.name ?? "Unknown"}
                {q.course && <> · Course: <strong>{q.course.title}</strong></>}
                {q.competency && <> · Competency: <strong>{q.competency.name}</strong></>}
              </CardDescription>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${
              q.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : q.status === "ARCHIVED" ? "bg-amber-50 text-amber-600 border-amber-300"
              : "bg-slate-100 text-slate-600 border-slate-300"
            }`}>{q.status}</span>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {q.description && <p className="text-sm text-muted-foreground leading-relaxed">{q.description}</p>}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Questions", value: questionCount, icon: BookOpen },
              { label: "Duration", value: q.durationMinutes ? `${q.durationMinutes} min` : "No limit", icon: Clock },
              { label: "Passing Score", value: q.passingScore ? `${q.passingScore}%` : "—", icon: CheckCircle2 },
              { label: "Deadline", value: q.deadline ? new Date(q.deadline).toLocaleDateString() : "None", icon: Lock },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/30 border border-border/60 p-3 text-center space-y-1">
                <item.icon className="h-4 w-4 text-indigo-600 mx-auto" />
                <div className="text-lg font-extrabold text-foreground">{item.value}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Trainee actions */}
          {role === "TRAINEE" && q.status === "PUBLISHED" && (
            <div className="border-t border-border/60 pt-4">
              {submitted ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Assessment Submitted
                  </div>
                  {(q.submission || q.mySubmission) && (
                    <p className="text-xs text-emerald-800">
                      Score: <strong>{(q.submission || q.mySubmission).score}%</strong>
                      {(q.submission || q.mySubmission).isPassed !== undefined && (
                        <> · <strong>{(q.submission || q.mySubmission).isPassed ? "✅ Passed" : "❌ Not Passed"}</strong></>
                      )}
                    </p>
                  )}
                </div>
              ) : isPast ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" /> This assessment deadline has passed.
                </div>
              ) : questionCount === 0 ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
                  No questions have been added to this questionnaire yet.
                </div>
              ) : (
                <Link href={`/questionnaires/${id}/attempt`}>
                  <Button className="gap-2 font-semibold">
                    <Send className="h-4 w-4" /> Begin Assessment
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Admin/Trainer actions */}
          {canManage && (
            <div className="border-t border-border/60 pt-4 flex flex-wrap gap-2">
              {q.status === "DRAFT" && (
                <Button size="sm" onClick={handlePublish} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Publish Questionnaire
                </Button>
              )}
              {q.status === "PUBLISHED" && (
                <Button size="sm" variant="outline" onClick={handleArchive} className="gap-1.5">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </Button>
              )}
              <Link href={`/questionnaires/${id}/analytics`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" /> View Analytics
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin/Trainer Questions Preview */}
      {canManage && (
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Assessment Questions ({questionCount})</CardTitle>
                <CardDescription className="text-xs">Questions configured for this questionnaire</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {questions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No questions added yet.</p>
            ) : (
              questions.map((qn: any, idx: number) => (
                <div key={qn.id ?? idx} className="p-3.5 rounded-xl border border-border/80 bg-slate-50/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-foreground">
                      Q{idx + 1}. {qn.questionText || qn.text}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                      {qn.points ?? 1} pt(s)
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {(qn.options ?? []).map((opt: string, optIdx: number) => {
                      const isCorrect = qn.correctOption === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`text-xs p-2 rounded-lg border font-medium ${
                            isCorrect
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="font-mono text-[10px] mr-1.5 uppercase font-bold text-muted-foreground">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                          {isCorrect && <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">(Correct)</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
