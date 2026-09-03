import { describe, it, expect } from "vitest";
import {
  calculateCourseProgress,
  type CourseProgressDetail,
} from "@/lib/demo/enrollment-store";
import { getCourseCurriculum } from "@/lib/demo/learning-curriculum";

describe("Learning Workflow Engine & Completed Module Review", () => {
  it("calculates initial 0% progress when no modules are completed", () => {
    const progress = calculateCourseProgress(
      "course-py-401",
      [
        {
          id: "test-enroll",
          employeeId: "emp-1",
          courseId: "course-py-401",
          courseTitle: "Advanced Python",
          competencyName: "Python",
          enrolledAt: "2024-05-01",
          progressPercent: 0,
          completedLessons: 0,
          totalLessons: 6,
          status: "IN_PROGRESS",
        },
      ],
      { "course-py-401": [] }
    );

    expect(progress.isEnrolled).toBe(true);
    expect(progress.completedCount).toBe(0);
    expect(progress.totalCount).toBe(6);
    expect(progress.progressPercent).toBe(0);
    expect(progress.isCompleted).toBe(false);
    expect(progress.currentModuleId).toBe("py-mod-1");
  });

  it("calculates sequential module progress percentage with sensible rounding", () => {
    // 1 of 6 completed = 17%
    const p1 = calculateCourseProgress(
      "course-py-401",
      [],
      { "course-py-401": ["py-mod-1"] }
    );
    expect(p1.completedCount).toBe(1);
    expect(p1.progressPercent).toBe(17);
    expect(p1.currentModuleId).toBe("py-mod-2");

    // 2 of 6 completed = 33%
    const p2 = calculateCourseProgress(
      "course-py-401",
      [],
      { "course-py-401": ["py-mod-1", "py-mod-2"] }
    );
    expect(p2.completedCount).toBe(2);
    expect(p2.progressPercent).toBe(33);
    expect(p2.currentModuleId).toBe("py-mod-3");

    // 3 of 6 completed = 50%
    const p3 = calculateCourseProgress(
      "course-py-401",
      [],
      { "course-py-401": ["py-mod-1", "py-mod-2", "py-mod-3"] }
    );
    expect(p3.completedCount).toBe(3);
    expect(p3.progressPercent).toBe(50);
    expect(p3.currentModuleId).toBe("py-mod-4");

    // 4 of 6 completed = 67%
    const p4 = calculateCourseProgress(
      "course-py-401",
      [],
      { "course-py-401": ["py-mod-1", "py-mod-2", "py-mod-3", "py-mod-4"] }
    );
    expect(p4.completedCount).toBe(4);
    expect(p4.progressPercent).toBe(67);
    expect(p4.currentModuleId).toBe("py-mod-5");

    // 5 of 6 completed = 83%
    const p5 = calculateCourseProgress(
      "course-py-401",
      [],
      { "course-py-401": ["py-mod-1", "py-mod-2", "py-mod-3", "py-mod-4", "py-mod-5"] }
    );
    expect(p5.completedCount).toBe(5);
    expect(p5.progressPercent).toBe(83);
    expect(p5.currentModuleId).toBe("py-mod-6");
  });

  it("marks course as 100% completed when all modules are finished", () => {
    const p6 = calculateCourseProgress(
      "course-py-401",
      [],
      {
        "course-py-401": [
          "py-mod-1",
          "py-mod-2",
          "py-mod-3",
          "py-mod-4",
          "py-mod-5",
          "py-mod-6",
        ],
      }
    );

    expect(p6.completedCount).toBe(6);
    expect(p6.totalCount).toBe(6);
    expect(p6.progressPercent).toBe(100);
    expect(p6.isCompleted).toBe(true);
  });

  it("retrieves valid curriculum with ordered modules and learning objectives", () => {
    const curriculum = getCourseCurriculum("course-py-401");
    expect(curriculum.modules).toHaveLength(6);
    expect(curriculum.modules[0].order).toBe(1);
    expect(curriculum.modules[5].order).toBe(6);
    expect(curriculum.modules[0].content.keyConcepts.length).toBeGreaterThan(0);
    expect(curriculum.modules[0].learningObjectives.length).toBeGreaterThan(0);
    expect(curriculum.modules[0].content.practicalExercise).toBeDefined();
  });

  it("provides complete module curriculum data for completed module review", () => {
    const curriculum = getCourseCurriculum("course-py-401");
    const module1 = curriculum.modules[0];

    // Verify all fields required by CompletedModuleReviewDialog
    expect(module1.title).toBe("Module 1 — Python Advanced Fundamentals & Data Structures");
    expect(module1.durationMinutes).toBe(240);
    expect(module1.learningObjectives).toContain("Implement custom iterator protocols and generator pipelines");
    expect(module1.content.overview).toBeDefined();
    expect(module1.content.keyConcepts[0].title).toBe("Custom Iterator Protocol & Generators");
    expect(module1.content.keyConcepts[0].codeSnippet).toContain("stream_large_dataset");
    expect(module1.content.practicalExercise).toContain("streaming log parser");
    expect(module1.content.competencyVerification).toContain("Verifies Level 4 Python");
  });

  it("distinguishes completed vs current vs locked roadmap modules", () => {
    const curriculum = getCourseCurriculum("course-py-401");
    const completedIds = ["py-mod-1", "py-mod-2", "py-mod-3", "py-mod-4"];

    const sorted = [...curriculum.modules].sort((a, b) => a.order - b.order);

    // Module 1-4 are completed
    for (let i = 0; i < 4; i++) {
      expect(completedIds.includes(sorted[i].id)).toBe(true);
    }

    // Module 5 is current (not completed, but previous Module 4 is completed)
    const m5 = sorted[4];
    const isM5Done = completedIds.includes(m5.id);
    const isM4Done = completedIds.includes(sorted[3].id);
    expect(isM5Done).toBe(false);
    expect(isM4Done).toBe(true);
    const isM5Current = !isM5Done && isM4Done;
    expect(isM5Current).toBe(true);

    // Module 6 is locked (not completed, and previous Module 5 is not completed)
    const m6 = sorted[5];
    const isM6Done = completedIds.includes(m6.id);
    expect(isM6Done).toBe(false);
    const isM6Locked = !isM6Done && !isM5Done;
    expect(isM6Locked).toBe(true);
  });
});