"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDemoStore } from "@/lib/demo/demo-store";
import { isDemoMode } from "@/lib/demo/config";
import { apiClient } from "@/lib/api/client";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { EditCourseDialog } from "@/components/courses/edit-course-dialog";
import { EnrollmentSuccessDialog } from "@/components/learning/enrollment-dialog";
import { exportCoursesCSV } from "@/lib/export/csv-export";
import { Clock, BookOpen, Star, ArrowRight, CheckCircle, PlayCircle, Download, Pencil, Archive, Loader2, Sparkles } from "lucide-react";

export default function CoursesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "EMPLOYEE";
  const demoStore = useDemoStore();

  const [realCourses, setRealCourses] = useState<any[]>([]);
  const [realEnrollments, setRealEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemoMode());

  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const loadRealData = useCallback(async () => {
    if (isDemoMode()) return;
    try {
      setIsLoading(true);
      const [crsRes, enrRes] = await Promise.all([
        apiClient.courses.list(),
        apiClient.learning.getEnrollments(),
      ]);
      setRealCourses(crsRes.data || []);
      setRealEnrollments(enrRes.data || []);
    } catch (err) {
      console.error("Failed to load real courses:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemoMode()) {
      loadRealData();
    }
  }, [loadRealData]);

  const courses: any[] = isDemoMode() ? demoStore.courses : realCourses;
  const enrollments: any[] = isDemoMode() ? demoStore.enrollments : realEnrollments;

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const canManageCourse = role === "ADMIN" || role === "MANAGER";

  async function handleEnroll(course: any) {
    setEnrollError(null);
    if (isDemoMode()) {
      demoStore.enrollCourse(course);
      setSelectedCourse(course);
      setIsDialogOpen(true);
    } else {
      try {
        await apiClient.learning.enroll(course.id);
        setSelectedCourse(course);
        setIsDialogOpen(true);
        await loadRealData();
      } catch (err: any) {
        setEnrollError(err.message || "Failed to enroll in course.");
        alert(err.message || "Failed to enroll in course.");
      }
    }
  }

  async function handleArchive(course: any) {
    if (isDemoMode()) {
      const result = demoStore.archiveCourse(course.id);
      if (result.activeEnrollmentCount && result.activeEnrollmentCount > 0) {
        alert(`Course archived. Note: ${result.activeEnrollmentCount} learner(s) are currently enrolled. Their progress is preserved.`);
      }
    } else {
      try {
        await apiClient.courses.update(course.id, { status: "ARCHIVED" });
        await loadRealData();
      } catch (err: any) {
        alert(err.message || "Failed to archive course.");
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Capacity Building Courses</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Targeted learning catalog mapped directly to organizational competencies and skill gaps
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === "EMPLOYEE" && (
            <Link href="/my-learning">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shadow-2xs font-semibold">
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />My Learning ({enrollments.length})
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={() => exportCoursesCSV(courses)} className="h-8 text-xs gap-1.5 shadow-2xs">
            <Download className="h-3.5 w-3.5" />Export CSV
          </Button>
          {canManageCourse && <CreateCourseDialog onSuccess={loadRealData} />}
        </div>
      </div>

      {enrollError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 shadow-2xs font-medium">
          {enrollError}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading course catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const enrolledRecord = enrollments.find((e) => e.courseId === course.id);
            const isDraft = course.status === "DRAFT";

            return (
              <Card key={course.id} className={`flex flex-col justify-between card-hover shadow-xs border-border/80 ${isDraft ? "opacity-75 border-dashed" : ""}`}>
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-[11px] font-medium">{course.category}</Badge>
                    <div className="flex items-center gap-1.5">
                      {isDraft && <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">Draft</Badge>}
                      <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-bold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {course.rating ?? 4.8}
                      </Badge>
                      {canManageCourse && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => { setEditTarget(course); setEditOpen(true); }} title="Edit Course">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600" onClick={() => handleArchive(course)} title="Archive Course">
                            <Archive className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-sm font-bold leading-snug mt-2 text-foreground">{course.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 text-muted-foreground mt-1">{course.description}</CardDescription>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-y border-border/60 py-2.5">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-500" />{course.durationHours} hours</span>
                    <span className="flex items-center gap-1.5 font-medium text-indigo-700"><BookOpen className="h-3.5 w-3.5" />Target Level {course.targetLevel}</span>
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Progress</span>
                        <span className="font-bold text-indigo-700 font-mono">{enrolledRecord?.progressPercent ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${enrolledRecord?.progressPercent ?? 0}%` }} />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="success" className="text-[10px] font-semibold flex items-center gap-1 py-1">
                          <CheckCircle className="h-3 w-3" />Enrolled
                        </Badge>
                        <Link href={`/courses/${course.id}/learn`} className="flex-1">
                          <Button size="sm" className="w-full h-8 text-xs gap-1.5 font-semibold">
                            <PlayCircle className="h-3.5 w-3.5" />Continue Learning
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Button className="w-full h-10 gap-2 text-xs font-semibold shadow-xs" onClick={() => handleEnroll(course)}>
                      Enroll Now <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EditCourseDialog course={editTarget} open={editOpen} onOpenChange={setEditOpen} onSuccess={loadRealData} />
      <EnrollmentSuccessDialog course={selectedCourse} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
