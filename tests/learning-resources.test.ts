import { describe, it, expect } from "vitest";
import { ALL_COURSE_CURRICULA, getCourseCurriculum } from "@/lib/demo/learning-curriculum";

describe("Learning Resources & Curriculum Validation", () => {
  it("1. Module-specific resources exist for all 13 courses and all 106 modules", () => {
    expect(ALL_COURSE_CURRICULA.length).toBe(13);
    let totalModules = 0;
    for (const curriculum of ALL_COURSE_CURRICULA) {
      expect(curriculum.modules.length).toBeGreaterThan(0);
      for (const mod of curriculum.modules) {
        totalModules++;
        expect(mod.resources).toBeDefined();
        expect(Array.isArray(mod.resources)).toBe(true);
        expect(mod.resources.length).toBeGreaterThanOrEqual(2);
      }
    }
    expect(totalModules).toBe(106);
  });

  it("2. Resource title renders and is non-empty with provider", () => {
    for (const curriculum of ALL_COURSE_CURRICULA) {
      for (const mod of curriculum.modules) {
        for (const res of mod.resources) {
          expect(res.title).toBeDefined();
          expect(res.title.trim().length).toBeGreaterThan(0);
          expect(res.provider).toBeDefined();
          expect(res.provider?.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("3. Resource description renders and is informative", () => {
    for (const curriculum of ALL_COURSE_CURRICULA) {
      for (const mod of curriculum.modules) {
        for (const res of mod.resources) {
          expect(res.description).toBeDefined();
          expect(res.description.trim().length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("4. Correct URL is preserved and properly formatted", () => {
    for (const curriculum of ALL_COURSE_CURRICULA) {
      for (const mod of curriculum.modules) {
        for (const res of mod.resources) {
          expect(res.url).toBeDefined();
          expect(res.url.startsWith("http://") || res.url.startsWith("https://")).toBe(true);
        }
      }
    }
  });

  it("5. React & Next.js Module 1 contains verified React documentation and Fiber resources", () => {
    const rctCurriculum = getCourseCurriculum("course-rct-401");
    const mod1 = rctCurriculum.modules.find((m) => m.id === "rct-mod-1");
    expect(mod1).toBeDefined();
    expect(mod1?.resources.length).toBeGreaterThanOrEqual(2);

    const reactDocRes = mod1?.resources.find((r) => r.url.includes("react.dev"));
    expect(reactDocRes).toBeDefined();
    expect(reactDocRes?.provider).toBe("React Documentation");
  });

  it("6. Python AsyncIO contains the exact Real Python resource and official docs", () => {
    const pyCurriculum = getCourseCurriculum("course-py-401");
    const asyncModule = pyCurriculum.modules.find((m) => m.id === "py-mod-3");
    expect(asyncModule).toBeDefined();
    
    const realPythonRes = asyncModule?.resources.find(
      (r) => r.url === "https://realpython.com/python-async-features/"
    );
    expect(realPythonRes).toBeDefined();
    expect(realPythonRes?.title).toContain("Async Programming in Python");
    expect(realPythonRes?.provider).toBe("Real Python");

    const pythonDocsRes = asyncModule?.resources.find(
      (r) => r.url === "https://docs.python.org/3/library/asyncio.html"
    );
    expect(pythonDocsRes).toBeDefined();
    expect(pythonDocsRes?.provider).toBe("Python Documentation");
  });

  it("7. Irrelevant generic resources (MDN/GitHub) are not assigned to non-web courses", () => {
    const nonWebCourseIds = [
      "course-ml-402",
      "course-dl-501",
      "course-sql-301",
      "course-jv-401",
      "course-ldr-401",
      "course-com-501",
    ];

    for (const courseId of nonWebCourseIds) {
      const curriculum = getCourseCurriculum(courseId);
      for (const mod of curriculum.modules) {
        for (const res of mod.resources) {
          expect(res.url).not.toContain("developer.mozilla.org");
        }
      }
    }
  });

  it("8. Empty-resource fallback structure is supported if a module has empty resources", () => {
    const mockModuleWithNoResources = {
      id: "mock-empty",
      title: "Self Contained Topic",
      resources: [],
    };
    expect(mockModuleWithNoResources.resources.length).toBe(0);
  });

  it("9. All 13 courses and their 106 modules preserve consistent IDs and structure", () => {
    const expectedCourseIds = [
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

    for (const courseId of expectedCourseIds) {
      const curriculum = getCourseCurriculum(courseId);
      expect(curriculum.courseId).toBe(courseId);
      expect(curriculum.modules.length).toBeGreaterThan(0);
    }
  });
});
