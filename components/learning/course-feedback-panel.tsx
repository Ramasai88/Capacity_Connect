"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api/client";
import {
  Star, Loader2, CheckCircle2, AlertCircle, MessageSquare, Lock,
} from "lucide-react";

interface CourseFeedbackPanelProps {
  courseId: string;
  courseTitle: string;
  /** Only enrolled trainees who can submit feedback */
  isEnrolled?: boolean;
}

function StarRating({ value, onChange, max = 5 }: { value: number; onChange: (v: number) => void; max?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function CourseFeedbackPanel({ courseId, courseTitle, isEnrolled }: CourseFeedbackPanelProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as "ADMIN" | "TRAINER" | "TRAINEE" || "TRAINEE";

  const [existingFeedback, setExistingFeedback] = useState<any | null>(null);
  const [allFeedback, setAllFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [rating, setRating] = useState(0);
  const [contentQuality, setContentQuality] = useState(0);
  const [trainerClarity, setTrainerClarity] = useState(0);
  const [applicability, setApplicability] = useState(0);
  const [comments, setComments] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.feedback.list({ courseId });
        const list: any[] = res.data?.feedback ?? res.data ?? [];
        setAllFeedback(list);

        // Check if current user already submitted
        const userId = (session?.user as any)?.id;
        const mine = list.find((f: any) => f.userId === userId || f.isOwn === true);
        setExistingFeedback(mine ?? null);
      } catch {
        // ignore errors — feedback section should degrade gracefully
      } finally {
        setIsLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError("Please select an overall rating."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.feedback.submit({
        courseId,
        rating,
        contentQualityRating: contentQuality || undefined,
        trainerClarityRating: trainerClarity || undefined,
        applicabilityRating: applicability || undefined,
        comments: comments.trim() || undefined,
        isAnonymous,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading feedback...
        </CardContent>
      </Card>
    );
  }

  const avgRating = allFeedback.length > 0
    ? (allFeedback.reduce((s, f) => s + (f.rating ?? 0), 0) / allFeedback.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {/* Summary strip for ADMIN/TRAINER */}
      {(role === "ADMIN" || role === "TRAINER") && allFeedback.length > 0 && (
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Star className="h-3.5 w-3.5" />
              </div>
              <div>
                <CardTitle className="text-sm">Course Feedback Summary</CardTitle>
                <CardDescription className="text-xs">{allFeedback.length} response(s) for {courseTitle}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-foreground">{avgRating}</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating ?? 0)) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">average from {allFeedback.length} rating(s)</span>
            </div>
            <div className="space-y-1.5">
              {allFeedback.map((f, idx) => (
                <div key={f.id ?? idx} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
                      {f.isAnonymous ? "Anonymous" : (f.employeeName ?? f.userName ?? "Trainee")}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < f.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                  {f.comments && <p className="text-muted-foreground italic">&ldquo;{f.comments}&rdquo;</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trainee feedback form */}
      {role === "TRAINEE" && (
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div>
                <CardTitle className="text-sm">Leave Feedback</CardTitle>
                <CardDescription className="text-xs">Share your experience with this course</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {!isEnrolled ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Enroll in this course to leave feedback.
              </div>
            ) : existingFeedback || success ? (
              <div className="flex items-center gap-2 rounded-xl p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Feedback submitted. Thank you!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl p-3 text-xs bg-rose-50 text-rose-900 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Overall Rating <span className="text-destructive">*</span></Label>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Content Quality", value: contentQuality, onChange: setContentQuality },
                    { label: "Trainer Clarity", value: trainerClarity, onChange: setTrainerClarity },
                    { label: "Applicability", value: applicability, onChange: setApplicability },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground">{item.label}</Label>
                      <StarRating value={item.value} onChange={item.onChange} />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Comments (optional)</Label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="What did you find most valuable? Any suggestions?"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-muted-foreground">Submit anonymously (your name will not be shown to trainers)</span>
                </label>

                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Submit Feedback
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
