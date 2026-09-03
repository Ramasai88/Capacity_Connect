"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEnrollments } from "@/lib/demo/enrollment-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Award,
  Loader2,
  Clock,
  Layers,
} from "lucide-react";

export default function MyLearningPage() {
  const demoEnrollmentStore = useEnrollments();
  const [realEnrollments, setRealEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const res = await apiClient.learning.getEnrollments();
      setRealEnrollments(res.data || []);
    } catch (err) {
      console.error("Failed to load real enrollments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  const enrollments: any[] = isDemoMode()
    ? demoEnrollmentStore.enrollments
    : realEnrollments;

  const completedCourses = enrollments.filter((e) => (e.progressPercent ?? 0) === 100);
  const inProgressCourses = enrollments.filter((e) => (e.progressPercent ?? 0) < 100);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">My Learning</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track your enrolled capacity building courses and module completion progress
          </p>
        </div>
        <Link href="/courses">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs shadow-2xs font-semibold">
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            Explore More Courses
          </Button>
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Enrolled Courses
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {enrollments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active pathways in your capacity plan
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              In Progress
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-indigo-700">
              {inProgressCourses.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Modules currently being completed
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Completed
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {completedCourses.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Courses finished and reassessed
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading enrolled courses...
        </div>
      ) : enrollments.length === 0 ? (
        <Card className="border-dashed shadow-xs">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100 shadow-2xs">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No Enrolled Courses Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
              Explore our capacity-building curriculum and enroll in courses aligned to your competency roadmap.
            </p>
            <Link href="/courses">
              <Button size="sm" className="gap-1.5 text-xs font-semibold shadow-xs">
                Browse Course Catalog
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {inProgressCourses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold tracking-tight text-foreground">Active Courses ({inProgressCourses.length})</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {inProgressCourses.map((enr) => {
                  const title = enr.courseTitle || enr.course?.title || "Course Pathway";
                  const code = enr.courseCode || enr.course?.code || "";
                  const category = enr.category || enr.course?.category || "Technical";
                  const courseId = enr.courseId;

                  return (
                    <Card key={enr.id} className="flex flex-col justify-between card-hover shadow-xs border-border/80">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="secondary" className="text-[11px] font-medium">{category}</Badge>
                          <span className="font-mono text-xs text-muted-foreground">{code}</span>
                        </div>
                        <CardTitle className="text-sm font-bold mt-2 text-foreground">{title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {enr.completedLessons ?? 0} of {enr.totalLessons ?? 0} lessons completed
                            </span>
                            <span className="font-bold text-indigo-700 font-mono">{enr.progressPercent ?? 0}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${enr.progressPercent ?? 0}%` }} />
                          </div>
                        </div>
                        <Link href={`/courses/${courseId}/learn`} className="block">
                          <Button size="sm" className="w-full gap-1.5 text-xs font-semibold h-8.5 shadow-xs">
                            <PlayCircle className="h-3.5 w-3.5" />
                            Continue Learning
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {completedCourses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold tracking-tight text-foreground">Completed Courses ({completedCourses.length})</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {completedCourses.map((enr) => {
                  const title = enr.courseTitle || enr.course?.title || "Course Pathway";
                  const code = enr.courseCode || enr.course?.code || "";
                  const category = enr.category || enr.course?.category || "Technical";
                  const courseId = enr.courseId;

                  return (
                    <Card key={enr.id} className="border-emerald-200 bg-gradient-to-b from-emerald-50/30 to-white shadow-xs">
                      <CardHeader className="p-5 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="secondary" className="text-[11px] font-medium">{category}</Badge>
                          <Badge variant="success" className="text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            100% Completed
                          </Badge>
                        </div>
                        <CardTitle className="text-sm font-bold mt-2 text-foreground">{title}</CardTitle>
                        <CardDescription className="text-xs font-mono">{code}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-5 pt-0 space-y-3.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Award className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Reassessment pending manager calibration verification</span>
                        </div>
                        <Link href={`/courses/${courseId}/learn`} className="block">
                          <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 font-semibold h-8.5 shadow-2xs">
                            Review Modules & Curriculum
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
