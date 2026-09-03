"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  type DemoCourse,
  type DemoEnrollment,
} from "@/lib/demo/data";
import { getCourseCurriculum, type CourseModule } from "@/lib/demo/learning-curriculum";

const STORAGE_ENROLLMENTS_KEY = "capacity_connect_enrollments_v2";
const STORAGE_COMPLETED_MODULES_KEY = "capacity_connect_completed_modules_v2";
const EVENT_ENROLLMENT_UPDATED = "capacity_connect_global_state_change";

export interface CourseProgressDetail {
  isEnrolled: boolean;
  enrollment: DemoEnrollment | null;
  completedModuleIds: string[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  isCompleted: boolean;
  currentModuleId: string | null;
  currentModuleOrder: number;
  estimatedRemainingMinutes: number;
}

// Initial state for Ravi Kumar's default progress (4 of 6 completed in Python, 2 of 7 in Java)
const DEFAULT_COMPLETED_MODULES: Record<string, string[]> = {
  "course-py-401": ["py-mod-1", "py-mod-2", "py-mod-3", "py-mod-4"],
  "course-jv-401": ["jv-mod-1", "jv-mod-2"],
};

function getStoredEnrollments(): DemoEnrollment[] {
  if (typeof window === "undefined") {
    return DEMO_ENROLLMENTS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_ENROLLMENTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ENROLLMENTS_KEY, JSON.stringify(DEMO_ENROLLMENTS));
      return DEMO_ENROLLMENTS;
    }
    return JSON.parse(raw) as DemoEnrollment[];
  } catch {
    return DEMO_ENROLLMENTS;
  }
}

function getStoredCompletedModules(): Record<string, string[]> {
  if (typeof window === "undefined") {
    return DEFAULT_COMPLETED_MODULES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_COMPLETED_MODULES_KEY);
    if (!raw) {
      localStorage.setItem(
        STORAGE_COMPLETED_MODULES_KEY,
        JSON.stringify(DEFAULT_COMPLETED_MODULES)
      );
      return DEFAULT_COMPLETED_MODULES;
    }
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return DEFAULT_COMPLETED_MODULES;
  }
}

function saveStoredEnrollments(enrollments: DemoEnrollment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_ENROLLMENTS_KEY, JSON.stringify(enrollments));
    window.dispatchEvent(new Event(EVENT_ENROLLMENT_UPDATED));
  } catch (err) {
    console.error("Failed to save enrollments to localStorage:", err);
  }
}

function saveStoredCompletedModules(modulesMap: Record<string, string[]>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_COMPLETED_MODULES_KEY, JSON.stringify(modulesMap));
    window.dispatchEvent(new Event(EVENT_ENROLLMENT_UPDATED));
  } catch (err) {
    console.error("Failed to save completed modules to localStorage:", err);
  }
}

/**
 * Calculates current progress details for a course.
 */
export function calculateCourseProgress(
  courseId: string,
  enrollmentsList?: DemoEnrollment[],
  completedMap?: Record<string, string[]>
): CourseProgressDetail {
  const enrollments = enrollmentsList ?? getStoredEnrollments();
  const completedModulesMap = completedMap ?? getStoredCompletedModules();

  const enrollment = enrollments.find((e) => e.courseId === courseId) ?? null;
  const isEnrolled = !!enrollment;

  const curriculum = getCourseCurriculum(courseId);
  const totalCount = curriculum.modules.length;
  const completedIds = completedModulesMap[courseId] ?? [];

  // Filter completedIds to only those that exist in this course curriculum
  const validCompletedIds = completedIds.filter((id) =>
    curriculum.modules.some((m) => m.id === id)
  );

  const completedCount = validCompletedIds.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCompleted = completedCount >= totalCount && totalCount > 0;

  // Find first uncompleted module in order
  const sortedModules = [...curriculum.modules].sort((a, b) => a.order - b.order);
  const firstUncompleted = sortedModules.find((m) => !validCompletedIds.includes(m.id));
  const currentModuleId = firstUncompleted?.id ?? (isCompleted ? sortedModules[sortedModules.length - 1]?.id ?? null : sortedModules[0]?.id ?? null);
  const currentModuleOrder = firstUncompleted?.order ?? (isCompleted ? totalCount : 1);

  // Remaining minutes from uncompleted modules
  const remainingMinutes = sortedModules
    .filter((m) => !validCompletedIds.includes(m.id))
    .reduce((acc, m) => acc + m.durationMinutes, 0);

  return {
    isEnrolled,
    enrollment,
    completedModuleIds: validCompletedIds,
    completedCount,
    totalCount,
    progressPercent: Math.min(100, progressPercent),
    isCompleted,
    currentModuleId,
    currentModuleOrder,
    estimatedRemainingMinutes: remainingMinutes,
  };
}

/**
 * Enrolls an employee into a course.
 */
export function enrollInCourse(
  course: DemoCourse,
  employeeId = "emp-1"
): { success: boolean; isNew: boolean; enrollment: DemoEnrollment } {
  const enrollments = getStoredEnrollments();
  const existing = enrollments.find((e) => e.courseId === course.id);

  if (existing) {
    return { success: true, isNew: false, enrollment: existing };
  }

  const curriculum = getCourseCurriculum(course.id);
  const newEnrollment: DemoEnrollment = {
    id: `enroll-${Date.now()}`,
    employeeId,
    courseId: course.id,
    courseTitle: course.title ?? "Untitled Course",
    competencyName: course.competencyName ?? "Competency",
    enrolledAt: new Date().toISOString().split("T")[0] ?? "2024-06-01",
    progressPercent: 0,
    completedLessons: 0,
    totalLessons: curriculum.modules.length,
    status: "IN_PROGRESS",
  };

  const updated = [newEnrollment, ...enrollments];
  saveStoredEnrollments(updated);

  // Initialize empty completed modules list for this course if not present
  const completedMap = getStoredCompletedModules();
  if (!completedMap[course.id]) {
    completedMap[course.id] = [];
    saveStoredCompletedModules(completedMap);
  }

  return { success: true, isNew: true, enrollment: newEnrollment };
}

/**
 * Marks a module as completed and updates course percentage & status.
 */
export function completeCourseModule(
  courseId: string,
  moduleId: string
): CourseProgressDetail {
  const completedMap = getStoredCompletedModules();
  const existingCompleted = completedMap[courseId] ?? [];

  if (!existingCompleted.includes(moduleId)) {
    completedMap[courseId] = [...existingCompleted, moduleId];
    saveStoredCompletedModules(completedMap);
  }

  // Update enrollment record progress
  const enrollments = getStoredEnrollments();
  const curriculum = getCourseCurriculum(courseId);
  const totalCount = curriculum.modules.length;
  const newCompletedCount = (completedMap[courseId] ?? []).length;
  const newPercent = Math.min(100, Math.round((newCompletedCount / totalCount) * 100));
  const isDone = newCompletedCount >= totalCount;


  const updatedEnrollments = enrollments.map((e) => {
    if (e.courseId === courseId) {
      return {
        ...e,
        completedLessons: newCompletedCount,
        progressPercent: newPercent,
        status: isDone ? ("COMPLETED" as const) : ("IN_PROGRESS" as const),
      };
    }
    return e;
  });

  saveStoredEnrollments(updatedEnrollments);

  // If newly completed (100%), auto-submit manager reassessment request
  if (isDone && typeof window !== "undefined") {
    try {
      const reassessmentsRaw = localStorage.getItem("capacity_connect_reassessments_v2");
      const reassessments = reassessmentsRaw ? JSON.parse(reassessmentsRaw) : [];
      const coursesRaw = localStorage.getItem("capacity_connect_courses_v2");
      const courses = coursesRaw ? JSON.parse(coursesRaw) : DEMO_COURSES;
      const employeesRaw = localStorage.getItem("capacity_connect_employees_v2");
      const employees = employeesRaw ? JSON.parse(employeesRaw) : [];

      const course = courses.find((c: any) => c.id === courseId) || DEMO_COURSES.find((c) => c.id === courseId);
      const employee = employees.find((e: any) => e.id === "emp-1") || {
        id: "emp-1",
        name: "Ravi Kumar",
        email: "ravi.kumar@capacityconnect.demo",
        designationTitle: "Software Engineer",
      };

      const alreadySubmitted = reassessments.some(
        (r: any) => r.courseId === courseId && r.employeeId === employee.id
      );

      if (!alreadySubmitted && course) {
        const newReassessment = {
          id: `reassess-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          employeeEmail: employee.email,
          designationTitle: employee.designationTitle,
          courseId: course.id,
          courseTitle: course.title,
          competencyId: course.competencyId,
          competencyName: course.competencyName,
          previousLevel: 2,
          requestedLevel: course.targetLevel,
          status: "PENDING_REASSESSMENT",
          submittedAt: new Date().toISOString().split("T")[0] ?? "2024-06-01",
        };

        localStorage.setItem(
          "capacity_connect_reassessments_v2",
          JSON.stringify([newReassessment, ...reassessments])
        );
        window.dispatchEvent(new Event("capacity_connect_global_state_change"));
      }
    } catch (err) {
      console.error("Error creating reassessment request:", err);
    }
  }

  return calculateCourseProgress(courseId, updatedEnrollments, completedMap);

}

/**
 * Custom React hook for tracking all enrollments with live update listeners.
 */
export function useEnrollments() {
  const [enrollments, setEnrollments] = useState<DemoEnrollment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    const list = getStoredEnrollments();
    const completedMap = getStoredCompletedModules();

    // Dynamically recompute progress stats for each enrollment
    const recomputed = list.map((e) => {
      const prog = calculateCourseProgress(e.courseId, list, completedMap);
      return {
        ...e,
        completedLessons: prog.completedCount,
        totalLessons: prog.totalCount,
        progressPercent: prog.progressPercent,
        status: prog.isCompleted ? ("COMPLETED" as const) : ("IN_PROGRESS" as const),
      };
    });

    setEnrollments(recomputed);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener(EVENT_ENROLLMENT_UPDATED, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT_ENROLLMENT_UPDATED, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  return {
    enrollments,
    isLoaded,
    refresh,
    enroll: (course: DemoCourse) => {
      const res = enrollInCourse(course);
      refresh();
      return res;
    },
  };
}

/**
 * Custom React hook for tracking progress on a single course.
 */
export function useCourseProgress(courseId: string) {
  const [progress, setProgress] = useState<CourseProgressDetail>(() =>
    calculateCourseProgress(courseId)
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(() => {
    setProgress(calculateCourseProgress(courseId));
    setIsLoaded(true);
  }, [courseId]);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener(EVENT_ENROLLMENT_UPDATED, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT_ENROLLMENT_UPDATED, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [courseId, refresh]);

  const markComplete = useCallback(
    (moduleId: string) => {
      const updated = completeCourseModule(courseId, moduleId);
      setProgress(updated);
      return updated;
    },
    [courseId]
  );

  return {
    ...progress,
    isLoaded,
    markComplete,
    refresh,
  };
}
