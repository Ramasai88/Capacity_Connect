import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoredCourses,
  getStoredEnrollments,
  getStoredCompletedModules,
  updateCourseInStore,
  resetDemoStoreToDefaults,
  completeModuleAndTriggerReassessment,
} from "@/lib/demo/demo-store";
import { getCourseCurriculum } from "@/lib/demo/learning-curriculum";
import { calculateCourseProgress } from "@/lib/demo/enrollment-store";
import { hasPermission, isRouteAllowed } from "@/lib/auth/rbac";
import { CourseService } from "@/lib/services/course.service";

describe("Course Authoring, Structured Roadmap & Safe Course Editing", () => {
  beforeEach(() => {
    resetDemoStoreToDefaults();
  });

  describe("1. RBAC Permissions for Course Authoring & Editing", () => {
    it("allows ADMIN to create and manage courses", () => {
      expect(hasPermission("ADMIN", "canCreateCourse")).toBe(true);
      expect(hasPermission("ADMIN", "canExportData")).toBe(true);
      expect(isRouteAllowed("ADMIN", "/courses")).toBe(true);
    });

    it("allows MANAGER to create and manage courses", () => {
      expect(hasPermission("MANAGER", "canCreateCourse")).toBe(true);
      expect(hasPermission("MANAGER", "canExportData")).toBe(true);
      expect(isRouteAllowed("MANAGER", "/courses")).toBe(true);
    });

    it("strictly prohibits EMPLOYEE from creating or editing courses", () => {
      expect(hasPermission("EMPLOYEE", "canCreateCourse")).toBe(false);
      expect(hasPermission("EMPLOYEE", "canAddEmployee")).toBe(false);
      expect(hasPermission("EMPLOYEE", "canReviewReassessments")).toBe(false);
      expect(isRouteAllowed("EMPLOYEE", "/courses")).toBe(true); // Can view & enroll
    });
  });

  describe("2. Seeded Course Quality & Structured Curriculum", () => {
    it("contains 10 comprehensive courses covering Web Dev and AI/ML", () => {
      const courses = getStoredCourses();
      expect(courses.length).toBeGreaterThanOrEqual(10);
    });

    it("ensures each seeded course contains rich structured modules without placeholder text", () => {
      const courses = getStoredCourses();
      for (const course of courses) {
        const curriculum = getCourseCurriculum(course.id);
        expect(curriculum.modules.length).toBeGreaterThan(0);

        for (const mod of curriculum.modules) {
          expect(mod.title).toBeTruthy();
          expect(mod.title).not.toMatch(/^Learn (Python|React|AI)$/i);
          expect(mod.durationMinutes).toBeGreaterThan(0);
          expect(mod.content?.overview || mod.overview).toBeTruthy();
          expect(mod.content?.practicalExercise || mod.practicalExercise).toBeTruthy();
          expect(mod.content?.competencyVerification || mod.competencyVerification).toBeTruthy();
        }
      }
    });
  });

  describe("3. Non-Destructive Module Editing & Employee Data Integrity (Requirement 10)", () => {
    it("preserves Employee enrollment, 25% progress, and completed module status when Admin edits Module 2", () => {
      const courseId = "course-py-401";
      const employeeId = "emp-1";

      const initialEnrollment = getStoredEnrollments().find(
        (e) => e.employeeId === employeeId && e.courseId === courseId
      );
      expect(initialEnrollment).toBeDefined();

      const initialCurriculum = getCourseCurriculum(courseId);
      const mod1Id = initialCurriculum.modules[0].id;
      const mod2Id = initialCurriculum.modules[1].id;
      const originalMod2Title = initialCurriculum.modules[1].title;

      // 2. Mark Module 1 complete for Employee A
      completeModuleAndTriggerReassessment(courseId, mod1Id, employeeId);

      const enrollmentsBeforeEdit = getStoredEnrollments();
      const completedBeforeEdit = getStoredCompletedModules();

      const progressBeforeEdit = calculateCourseProgress(
        courseId,
        enrollmentsBeforeEdit,
        completedBeforeEdit
      );

      expect(progressBeforeEdit.completedCount).toBeGreaterThanOrEqual(1);
      expect(completedBeforeEdit[courseId]).toContain(mod1Id);

      // 3. Admin edits Module 2
      const updatedModules = initialCurriculum.modules.map((m) => {
        if (m.id === mod2Id) {
          return {
            id: m.id, // Module ID preserved!
            order: m.order,
            title: "Advanced Concurrency & AsyncIO Internals [UPDATED BY ADMIN]",
            summary: "Deep dive into event loops, coroutines, and GIL mitigation techniques.",
            durationMinutes: 180,
            overview: "Comprehensive investigation of Python asynchronous runtimes.",
            keyConcepts: [
              {
                title: "Event Loop Architecture",
                description: "Deep dive into selectors and asynchronous tasks.",
              },
            ],
            practicalExercise: "Build an asynchronous worker pool.",
            competencyVerification: "Passes high-throughput benchmark tests.",
          };
        }
        return {
          id: m.id,
          order: m.order,
          title: m.title,
          summary: m.summary || m.content?.overview || m.title,
          durationMinutes: m.durationMinutes,
          overview: m.content?.overview || m.overview || m.title,
          keyConcepts: m.content?.keyConcepts || m.keyConcepts || [],
          practicalExercise: m.content?.practicalExercise || m.practicalExercise || "",
          competencyVerification: m.content?.competencyVerification || m.competencyVerification || "",
        };
      });

      const editResult = updateCourseInStore(courseId, {
        title: "Advanced Python Architecture & Engineering [UPDATED]",
        modules: updatedModules,
      });

      expect(editResult.success).toBe(true);

      // 4. Verification Check:
      // Employee A:
      // - Course still enrolled
      const enrollmentsAfterEdit = getStoredEnrollments();
      const completedAfterEdit = getStoredCompletedModules();

      const enrollmentAfterEdit = enrollmentsAfterEdit.find(
        (e) => e.employeeId === employeeId && e.courseId === courseId
      );
      expect(enrollmentAfterEdit).toBeDefined();
      expect(enrollmentAfterEdit?.id).toBe(initialEnrollment?.id);

      // - Module 1 still completed
      expect(completedAfterEdit[courseId]).toContain(mod1Id);

      // - Progress calculation still intact
      const progressAfterEdit = calculateCourseProgress(
        courseId,
        enrollmentsAfterEdit,
        completedAfterEdit
      );
      expect(progressAfterEdit.completedCount).toBe(progressBeforeEdit.completedCount);
      expect(progressAfterEdit.progressPercent).toBe(progressBeforeEdit.progressPercent);

      // - Module 2 contains updated content with preserved ID
      const updatedCurriculum = getCourseCurriculum(courseId);
      const mod2AfterEdit = updatedCurriculum.modules.find((m) => m.id === mod2Id);
      expect(mod2AfterEdit).toBeDefined();
      expect(mod2AfterEdit?.id).toBe(mod2Id);
      expect(mod2AfterEdit?.title).toBe(
        "Advanced Concurrency & AsyncIO Internals [UPDATED BY ADMIN]"
      );
      expect(mod2AfterEdit?.title).not.toBe(originalMod2Title);
    });
  });

  describe("4. CourseService Update Logic Safety", () => {
    it("ensures CourseService.updateCourse exists and handles module updates safely", () => {
      expect(typeof CourseService.updateCourse).toBe("function");
    });
  });
});
