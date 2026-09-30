"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/client";
import {
  ArrowLeft, Loader2, AlertCircle, BarChart2,
  Users, CheckCircle2, TrendingUp, Lock,
} from "lucide-react";

export default function QuestionnaireAnalyticsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string;
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.questionnaires.analytics(id);
      setData(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Trainees cannot see analytics
  if (role === "TRAINEE") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/questionnaires">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
        </Link>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-amber-700">
            <Lock className="h-4 w-4 shrink-0" /> Analytics are not available to trainees.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link href={`/questionnaires/${id}`}>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Questionnaire
          </Button>
        </Link>
        <Button size="sm" variant="outline" onClick={load} disabled={isLoading} className="gap-1.5 text-xs">
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart2 className="h-3 w-3" />}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> Loading analytics...
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex items-center gap-2 p-4 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </CardContent>
        </Card>
      ) : !data ? null : (
        <>
          {/* Title */}
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{data.questionnaire?.title ?? "Questionnaire Analytics"}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Performance summary across all submissions</p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Eligible Trainees", value: data.eligibleTrainees ?? "—", icon: Users, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
              { label: "Submissions", value: data.totalSubmissions ?? "—", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
              { label: "Participation Rate", value: data.participationRate != null ? `${data.participationRate}%` : "—", icon: TrendingUp, color: "bg-sky-50 text-sky-600 border-sky-100" },
              { label: "Average Score", value: data.averageScore != null ? `${data.averageScore}%` : "—", icon: BarChart2, color: "bg-amber-50 text-amber-600 border-amber-100" },
            ].map((item) => (
              <Card key={item.label} className="border border-border/80 shadow-xs">
                <CardHeader className="flex flex-row items-center justify-between pb-1">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</CardTitle>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${item.color}`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold tracking-tight text-foreground">{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Score distribution */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Highest Score", value: data.highestScore != null ? `${data.highestScore}%` : "—", color: "text-emerald-700" },
              { label: "Lowest Score", value: data.lowestScore != null ? `${data.lowestScore}%` : "—", color: "text-rose-700" },
              { label: "Pass / Fail", value: `${data.passCount ?? 0} / ${data.failCount ?? 0}`, color: "text-indigo-700" },
            ].map((item) => (
              <Card key={item.label} className="border border-border/80 shadow-xs text-center">
                <CardContent className="pt-6 pb-4">
                  <div className={`text-3xl font-extrabold ${item.color}`}>{item.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">{item.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Question-level performance */}
          {Array.isArray(data.questionPerformance) && data.questionPerformance.length > 0 && (
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm">Question-Level Performance</CardTitle>
                <CardDescription className="text-xs">Correct response rate per question</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {data.questionPerformance.map((qp: any, idx: number) => {
                  const pct = qp.correctRate ?? 0;
                  return (
                    <div key={qp.questionId ?? idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground line-clamp-1 pr-4">{qp.questionText ?? `Q${idx + 1}`}</span>
                        <span className={`font-mono font-bold ${pct >= 70 ? "text-emerald-700" : pct >= 40 ? "text-amber-700" : "text-rose-700"}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
