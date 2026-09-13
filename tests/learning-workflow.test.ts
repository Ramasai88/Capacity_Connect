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
    expect(completedIds.includes(m6.id)).toBe(false);
    expect(completedIds.includes(m5.id)).toBe(false);
  });

  it("handles database-backed module format with flat properties (no content object)", () => {
    // Database modules returned by Prisma/CourseService have flat fields
    const dbModule = {
      id: "db-mod-1",
      order: 1,
      title: "PostgreSQL Advanced Queries",
      summary: "Master query planning and indexing.",
      durationMinutes: 120,
      learningObjectives: ["Understand EXPLAIN ANALYZE"],
      overview: "Deep dive into PostgreSQL query engine internals.",
      keyConcepts: [{ title: "B-Tree Indexes", description: "O(log N) lookup mechanics." }],
      practicalExercise: "Optimize a query from 500ms to 2ms.",
      competencyVerification: "Verifies DB query optimization competency.",
    };

    // Verify extraction logic used in CompletedModuleReviewDialog
    const overview = (dbModule as any).content?.overview || dbModule.overview || null;
    const rawConcepts = (dbModule as any).content?.keyConcepts ?? dbModule.keyConcepts;
    const keyConcepts = Array.isArray(rawConcepts) ? rawConcepts : [];
    const practicalExercise = (dbModule as any).content?.practicalExercise || dbModule.practicalExercise || null;
    const competencyVerification = (dbModule as any).content?.competencyVerification || dbModule.competencyVerification || null;

    expect(overview).toBe("Deep dive into PostgreSQL query engine internals.");
    expect(keyConcepts).toHaveLength(1);
    expect(keyConcepts[0].title).toBe("B-Tree Indexes");
    expect(practicalExercise).toBe("Optimize a query from 500ms to 2ms.");
    expect(competencyVerification).toBe("Verifies DB query optimization competency.");
  });

  it("gracefully handles module with missing/null content and empty objectives", () => {
    const incompleteModule = {
      id: "incomplete-mod-1",
      order: 1,
      title: "Incomplete Module",
      summary: "Module with missing overview and concepts",
      durationMinutes: 60,
      learningObjectives: [],
    };

    // Safe extraction
    const overview = (incompleteModule as any).content?.overview || (incompleteModule as any).overview || null;
    const rawConcepts = (incompleteModule as any).content?.keyConcepts ?? (incompleteModule as any).keyConcepts;
    const keyConcepts = Array.isArray(rawConcepts) ? rawConcepts : [];
    const practicalExercise = (incompleteModule as any).content?.practicalExercise || (incompleteModule as any).practicalExercise || null;
    const competencyVerification = (incompleteModule as any).content?.competencyVerification || (incompleteModule as any).competencyVerification || null;

    expect(overview).toBeNull();
    expect(keyConcepts).toHaveLength(0);
    expect(practicalExercise).toBeNull();
    expect(competencyVerification).toBeNull();
    expect(incompleteModule.learningObjectives).toHaveLength(0);
  });

  it("distinguishes Start Module vs Continue Module vs Review Content action states", () => {
    const curriculum = getCourseCurriculum("course-py-401");
    const completedIds = ["py-mod-1", "py-mod-2"];
    const progressPercent = 33;
    const currentModuleId = "py-mod-3";

    const modulesState = curriculum.modules.map((m) => {
      const isCompleted = completedIds.includes(m.id);
      const isCurrent = m.id === currentModuleId && !isCompleted;
      const isLocked = !isCompleted && !isCurrent;
      const isContinue = isCurrent && progressPercent > 0;

      let actionType: "REVIEW_CONTENT" | "CONTINUE_MODULE" | "START_MODULE" | "LOCKED";
      if (isCompleted) {
        actionType = "REVIEW_CONTENT";
      } else if (isCurrent) {
        actionType = isContinue ? "CONTINUE_MODULE" : "START_MODULE";
      } else {
        actionType = "LOCKED";
      }

      return {
        id: m.id,
        order: m.order,
        isCompleted,
        isCurrent,
        isLocked,
        actionType,
      };
    });

    // Module 1 & 2 -> Review Content
    expect(modulesState[0].actionType).toBe("REVIEW_CONTENT");
    expect(modulesState[1].actionType).toBe("REVIEW_CONTENT");

    // Module 3 -> Continue Module (since progressPercent > 0)
    expect(modulesState[2].actionType).toBe("CONTINUE_MODULE");

    // Module 4, 5, 6 -> Locked
    expect(modulesState[3].actionType).toBe("LOCKED");
    expect(modulesState[4].actionType).toBe("LOCKED");
    expect(modulesState[5].actionType).toBe("LOCKED");
  });

  it("safely normalizes complete and incomplete module payloads for the Coursera-style learning runner", () => {
    // 1. Full structured module
    const fullModule = {
      id: "mod-full",
      order: 2,
      title: "Advanced React & Next.js Architecture",
      durationMinutes: 180,
      summary: "Server components, server actions, and caching.",
      learningObjectives: ["Understand RSC wire protocol", "Implement Server Actions"],
      content: {
        overview: "Detailed overview of React Server Components.",
        keyConcepts: [
          {
            topic: "RSC Internals",
            title: "RSC Payload Streaming",
            description: "JSON-like flight payload format streamed over HTTP.",
            codeSnippet: "export async function ServerComponent() { return <div>RSC</div>; }",
          },
        ],
        practicalExercise: "Build an interactive dashboard utilizing RSC.",
        competencyVerification: "Demonstrates Level 4 React Mastery.",
      },
    };

    const overview = fullModule.content?.overview || (fullModule as any).overview || fullModule.summary;
    const keyConcepts = fullModule.content?.keyConcepts ?? (fullModule as any).keyConcepts ?? [];
    const learningObjectives = fullModule.learningObjectives ?? [];
    const practicalExercise = fullModule.content?.practicalExercise || (fullModule as any).practicalExercise;
    const competencyVerification = fullModule.content?.competencyVerification || (fullModule as any).competencyVerification;

    expect(overview).toBe("Detailed overview of React Server Components.");
    expect(keyConcepts).toHaveLength(1);
    expect(keyConcepts[0].title).toBe("RSC Payload Streaming");
    expect(keyConcepts[0].codeSnippet).toContain("ServerComponent");
    expect(learningObjectives).toHaveLength(2);
    expect(practicalExercise).toContain("interactive dashboard");
    expect(competencyVerification).toContain("Level 4");

    // 2. Flat database-backed module with missing optional fields
    const flatModule = {
      id: "mod-flat",
      order: 1,
      title: "Core Java Memory Management",
      durationMinutes: 120,
      summary: "JVM Heap, Stack, and GC.",
      overview: "JVM heap memory regions and garbage collection algorithms.",
      keyConcepts: [{ title: "G1 Collector", description: "Region-based generational garbage collection." }],
      practicalExercise: "Profile a JVM application and analyze heap dumps.",
      competencyVerification: "Verifies JVM Memory Management standard.",
    };

    const flatOverview = (flatModule as any).content?.overview || flatModule.overview || flatModule.summary;
    const flatConcepts = (flatModule as any).content?.keyConcepts ?? flatModule.keyConcepts ?? [];
    const flatObjectives = (flatModule as any).learningObjectives ?? [];
    const flatExercise = (flatModule as any).content?.practicalExercise || flatModule.practicalExercise;
    const flatVerification = (flatModule as any).content?.competencyVerification || flatModule.competencyVerification;

    expect(flatOverview).toBe("JVM heap memory regions and garbage collection algorithms.");
    expect(flatConcepts).toHaveLength(1);
    expect(flatObjectives).toHaveLength(0); // Safely defaulted to empty array
    expect(flatExercise).toContain("Profile a JVM application");
    expect(flatVerification).toContain("JVM Memory Management");
  });

  it("ensures ALL 13 courses in COURSE_CURRICULA have rich, authentic educational content and official resources", () => {
    const all13CourseIds = [
      "course-fsw-401",
      "course-jv-401",
      "course-ts-301",
      "course-rct-401",
      "course-api-401",
      "course-py-401",
      "course-ml-402",
      "course-dl-501",
      "course-nlp-501",
      "course-mlops-501",
      "course-sql-301",
      "course-com-501",
      "course-ldr-401",
    ];

    expect(all13CourseIds).toHaveLength(13);

    for (const courseId of all13CourseIds) {
      const curriculum = getCourseCurriculum(courseId);
      expect(curriculum.modules.length).toBeGreaterThan(0);

      for (const mod of curriculum.modules) {
        // Module Introduction & Summary
        expect(mod.title.length).toBeGreaterThan(5);
        expect(mod.summary.length).toBeGreaterThan(15);
        expect(mod.durationMinutes).toBeGreaterThanOrEqual(60);

        // Learning Objectives
        expect(mod.learningObjectives).toBeDefined();
        expect(mod.learningObjectives!.length).toBeGreaterThanOrEqual(2);

        // Content & Concepts
        const overview = mod.content?.overview || mod.overview;
        expect(overview).toBeDefined();
        expect(overview!.length).toBeGreaterThan(30);

        // Verify NOT generic fallback text
        expect(overview).not.toContain("Foundational Architecture & Core Domain Principles");
        expect(overview).not.toContain("Capstone evaluation matching target competency level requirements and enterprise standards.");

        const concepts = mod.content?.keyConcepts || mod.keyConcepts || [];
        expect(concepts.length).toBeGreaterThan(0);
        expect(concepts[0].title).toBeDefined();
        expect(concepts[0].description).toBeDefined();

        // Learning Resources
        const resources = mod.resources || mod.content?.resources || [];
        expect(resources.length).toBeGreaterThan(0);
        expect(resources[0].title).toBeDefined();
        expect(resources[0].url).toMatch(/^https?:\/\//);
        expect(resources[0].description).toBeDefined();

        // Hands-on Lab & Competency Verification
        const exercise = mod.content?.practicalExercise || mod.practicalExercise;
        expect(exercise).toBeDefined();
        expect(exercise!.length).toBeGreaterThan(20);

        const verification = mod.content?.competencyVerification || mod.competencyVerification;
        expect(verification).toBeDefined();
        expect(verification!.length).toBeGreaterThan(15);
      }
    }

    // Specific check for Machine Learning Fundamentals Module 3 (previously generic fallback)
    const mlCurriculum = getCourseCurriculum("course-ml-402");
    expect(mlCurriculum.modules).toHaveLength(8);
    const mlMod3 = mlCurriculum.modules[2];
    expect(mlMod3.title).toContain("Supervised Learning: Regression Algorithms & Regularization");
    expect(mlMod3.content.overview).toContain("Regression algorithms");
    expect(mlMod3.content.keyConcepts[0].title).toContain("Regularization");
    expect(mlMod3.resources[0].url).toContain("scikit-learn.org");
    expect(mlMod3.content.practicalExercise).toContain("Ridge and Lasso Regression");

    // Specific check for Deep Learning Module 1
    const dlCurriculum = getCourseCurriculum("course-dl-501");
    expect(dlCurriculum.modules).toHaveLength(10);
    expect(dlCurriculum.modules[0].title).toContain("Perceptrons");

    // Specific check for NLP Module 1
    const nlpCurriculum = getCourseCurriculum("course-nlp-501");
    expect(nlpCurriculum.modules).toHaveLength(11);
    expect(nlpCurriculum.modules[0].title).toContain("Tokenization");

    // Specific check for MLOps Module 1
    const mlopsCurriculum = getCourseCurriculum("course-mlops-501");
    expect(mlopsCurriculum.modules).toHaveLength(11);
    expect(mlopsCurriculum.modules[0].title).toContain("Production ML Lifecycle");
  });
});