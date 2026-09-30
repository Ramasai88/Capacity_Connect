"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api/client";
import {
  ClipboardList, Plus, Search, Loader2, AlertCircle, CheckCircle2, Pencil,
  ArrowRight, Archive, Send, BarChart2, RefreshCcw, Clock, Lock,
} from "lucide-react";

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-slate-100 text-slate-600 border-slate-300" },
  PUBLISHED: { label: "Published", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  ARCHIVED: { label: "Archived", color: "bg-amber-50 text-amber-600 border-amber-300" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, color: "bg-slate-100 text-slate-600 border-slate-300" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${m.color}`}>{m.label}</span>;
}

interface QForm {
  title: string;
  description: string;
  durationMinutes: string;
  passingScore: string;
  deadline: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: number;
}

const BLANK_Q: QForm = {
  title: "",
  description: "",
  durationMinutes: "30",
  passingScore: "60",
  deadline: "",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: 0,
};

export default function QuestionnairesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as "ADMIN" | "TRAINER" | "TRAINEE" || "TRAINEE";
  const canManage = role === "ADMIN" || role === "TRAINER";

  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<QForm>(BLANK_Q);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Action feedback
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.questionnaires.list({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        search: search || undefined,
      });
      setQuestionnaires(res.data?.questionnaires ?? res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load questionnaires.");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.description.trim()) { setFormError("Description is required."); return; }
    if (!form.questionText.trim()) { setFormError("First question text is required."); return; }
    if (!form.optionA.trim() || !form.optionB.trim()) {
      setFormError("At least options A and B are required.");
      return;
    }

    const options = [form.optionA.trim(), form.optionB.trim()];
    if (form.optionC.trim()) options.push(form.optionC.trim());
    if (form.optionD.trim()) options.push(form.optionD.trim());

    if (form.correctOption >= options.length) {
      setFormError("Selected correct option is invalid.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.questionnaires.create({
        title: form.title.trim(),
        description: form.description.trim(),
        durationMinutes: parseInt(form.durationMinutes) || 30,
        passingScore: parseInt(form.passingScore) || 60,
        deadline: form.deadline || undefined,
        questions: [
          {
            order: 1,
            questionText: form.questionText.trim(),
            options,
            correctOption: form.correctOption,
            points: 1,
          },
        ],
      });
      setCreateOpen(false);
      setForm(BLANK_Q);
      await load();
      setActionMsg({ type: "success", msg: "Questionnaire created successfully." });
    } catch (err: any) {
      setFormError(err.message || "Failed to create questionnaire.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await apiClient.questionnaires.publish(id);
      setActionMsg({ type: "success", msg: "Questionnaire published." });
      await load();
    } catch (err: any) {
      setActionMsg({ type: "error", msg: err.message || "Failed to publish." });
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function handleArchive(id: string) {
    try {
      await apiClient.questionnaires.archive(id);
      setActionMsg({ type: "success", msg: "Questionnaire archived." });
      await load();
    } catch (err: any) {
      setActionMsg({ type: "error", msg: err.message || "Failed to archive." });
    }
    setTimeout(() => setActionMsg(null), 3000);
  }

  const statusFilters = canManage ? ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] : ["PUBLISHED"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg border border-slate-800/80">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-indigo-200 border border-white/15">
              <ClipboardList className="h-3 w-3" />
              Competency Assessments
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Questionnaires</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {role === "TRAINEE"
                ? "View and take published assessments assigned to you."
                : "Create, manage, and publish competency questionnaires."}
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => { setForm(BLANK_Q); setFormError(null); setCreateOpen(true); }}
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> Create Questionnaire
            </Button>
          )}
        </div>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs border font-medium ${
          actionMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {actionMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {actionMsg.msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search questionnaires..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8.5 text-xs shadow-2xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                statusFilter === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-700"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={isLoading} className="h-8.5 text-xs gap-1.5">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          Loading questionnaires...
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </CardContent>
        </Card>
      ) : questionnaires.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300" />
            <p className="font-semibold text-sm">No questionnaires found</p>
            <p className="text-xs text-muted-foreground">
              {canManage ? "Create your first questionnaire." : "No published questionnaires are available for you yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {questionnaires.map((q) => {
            const isPast = q.deadline && new Date(q.deadline) < new Date();
            const submitted = q.hasAttempted || q.submission != null || q.mySubmission != null;

            return (
              <Card key={q.id} className="border border-border/80 shadow-xs hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold truncate">{q.title}</CardTitle>
                      <CardDescription className="text-[11px]">
                        {q.trainer?.name ?? "Unknown Trainer"}
                        {q.course ? ` · ${q.course.title}` : ""}
                      </CardDescription>
                    </div>
                    <StatusBadge status={q.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {q.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{q.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {q.durationMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {q.durationMinutes} min
                      </span>
                    )}
                    {q.passingScore && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Pass: {q.passingScore}%
                      </span>
                    )}
                    {q.deadline && (
                      <span className={`flex items-center gap-1 font-medium ${isPast ? "text-rose-600" : "text-amber-700"}`}>
                        {isPast ? <Lock className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {isPast ? "Closed" : `Due ${new Date(q.deadline).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    {/* TRAINEE actions */}
                    {role === "TRAINEE" && q.status === "PUBLISHED" && !isPast && (
                      submitted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                        </span>
                      ) : (
                        <Link href={`/questionnaires/${q.id}/attempt`}>
                          <Button size="sm" className="h-7 text-xs gap-1.5 font-semibold">
                            <Send className="h-3 w-3" /> Take Assessment
                          </Button>
                        </Link>
                      )
                    )}
                    {role === "TRAINEE" && q.status === "PUBLISHED" && isPast && (
                      <span className="text-xs text-muted-foreground italic">Assessment closed</span>
                    )}

                    {/* ADMIN/TRAINER actions */}
                    {canManage && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {q.status === "DRAFT" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handlePublish(q.id)}>
                            <Send className="h-3 w-3" /> Publish
                          </Button>
                        )}
                        {q.status === "PUBLISHED" && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleArchive(q.id)}>
                            <Archive className="h-3 w-3" /> Archive
                          </Button>
                        )}
                        <Link href={`/questionnaires/${q.id}/analytics`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                            <BarChart2 className="h-3 w-3" /> Analytics
                          </Button>
                        </Link>
                      </div>
                    )}

                    <Link href={`/questionnaires/${q.id}`} className="ml-auto">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full hover:bg-indigo-50 hover:text-indigo-700">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-600" />
              Create Questionnaire
            </DialogTitle>
            <DialogDescription className="text-xs">
              New questionnaires start as DRAFT and require at least one initial question.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 mt-1">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl p-3 text-xs bg-rose-50 text-rose-900 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />{formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Title <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Python Fundamentals Assessment" className="h-8.5 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Description <span className="text-destructive">*</span></Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What will this questionnaire assess?"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Duration (minutes)</Label>
                <Input type="number" min={5} value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} className="h-8.5 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Passing Score (%)</Label>
                <Input type="number" min={1} max={100} value={form.passingScore} onChange={(e) => setForm((p) => ({ ...p, passingScore: e.target.value }))} className="h-8.5 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Deadline (optional)</Label>
              <Input type="datetime-local" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} className="h-8.5 text-xs" />
            </div>

            {/* Initial MCQ Question */}
            <div className="border-t border-border/70 pt-3 space-y-2.5">
              <div className="text-xs font-bold text-foreground">Initial Assessment Question</div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Question Text <span className="text-destructive">*</span></Label>
                <Input
                  value={form.questionText}
                  onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
                  placeholder="e.g. What is the output of print(type([]))?"
                  className="h-8.5 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Option A (Index 0)</Label>
                  <Input value={form.optionA} onChange={(e) => setForm((p) => ({ ...p, optionA: e.target.value }))} placeholder="Option A" className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Option B (Index 1)</Label>
                  <Input value={form.optionB} onChange={(e) => setForm((p) => ({ ...p, optionB: e.target.value }))} placeholder="Option B" className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Option C (Optional)</Label>
                  <Input value={form.optionC} onChange={(e) => setForm((p) => ({ ...p, optionC: e.target.value }))} placeholder="Option C" className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Option D (Optional)</Label>
                  <Input value={form.optionD} onChange={(e) => setForm((p) => ({ ...p, optionD: e.target.value }))} placeholder="Option D" className="h-7 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-muted-foreground">Correct Option</Label>
                <select
                  value={form.correctOption}
                  onChange={(e) => setForm((p) => ({ ...p, correctOption: parseInt(e.target.value) }))}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                  <option value={3}>Option D</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create Questionnaire
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
