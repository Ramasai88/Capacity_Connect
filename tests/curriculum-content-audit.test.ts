import { describe, it, expect } from "vitest";
import { COURSE_CURRICULA, ALL_COURSE_CURRICULA, getCourseCurriculum } from "../lib/demo/learning-curriculum";

describe("Curriculum Content Quality & Role-Relevant Audit", () => {
  it("should contain all 13 courses in the organization catalog", () => {
    const courseIds = Object.keys(COURSE_CURRICULA);
    expect(courseIds).toHaveLength(13);
    expect(courseIds).toEqual(
      expect.arrayContaining([
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
      ])
    );
  });

  it("should verify exact 106 total modules across all 13 courses", () => {
    let totalModules = 0;
    for (const curriculum of ALL_COURSE_CURRICULA) {
      totalModules += curriculum.modules.length;
    }
    expect(totalModules).toBe(106);
  });

  it("should verify that non-technical courses have NO artificial programming code snippets", () => {
    const nonTechnicalCourses = ["course-com-501", "course-ldr-401"];

    for (const courseId of nonTechnicalCourses) {
      const curriculum = getCourseCurriculum(courseId);
      for (const mod of curriculum.modules) {
        const concepts = mod.content?.keyConcepts || mod.keyConcepts || [];
        for (const concept of concepts) {
          expect(concept.codeSnippet).toBeUndefined();
          expect(concept.description).not.toContain("ProductionComponent");
          expect(concept.description).not.toContain("process_workload");
        }
      }
    }
  });

  it("should verify that Executive Communication Module 1 contains authentic Pyramid Principle content", () => {
    const comCurriculum = getCourseCurriculum("course-com-501");
    const mod1 = comCurriculum.modules.find((m) => m.id === "com-mod-1");
    expect(mod1).toBeDefined();
    expect(mod1?.title).toContain("The Pyramid Principle");

    const concepts = mod1?.content?.keyConcepts || [];
    expect(concepts.length).toBeGreaterThanOrEqual(3);

    const firstConcept = concepts[0];
    expect(firstConcept.title).toContain("Pyramid Principle");
    expect(firstConcept.description).toContain("Barbara Minto");
    expect(firstConcept.codeSnippet).toBeUndefined();
    expect(firstConcept.workedExample).toContain("Poor Bottom-Up Communication");
  });

  it("should verify that Strategic Team Leadership Module 1 contains authentic 1-on-1 coaching content", () => {
    const ldrCurriculum = getCourseCurriculum("course-ldr-401");
    const mod1 = ldrCurriculum.modules.find((m) => m.id === "ldr-mod-1");
    expect(mod1).toBeDefined();
    expect(mod1?.title).toContain("High-Performance Engineering Mentorship");

    const concepts = mod1?.content?.keyConcepts || [];
    expect(concepts.length).toBeGreaterThanOrEqual(3);

    const firstConcept = concepts[0];
    expect(firstConcept.title).toContain("The 10/10/10 Developmental 1-on-1 Framework");
    expect(firstConcept.codeSnippet).toBeUndefined();
    expect(firstConcept.workedExample).toContain("1-on-1");
  });

  it("should verify zero occurrences of generic template leakage across all 106 modules", () => {
    const forbiddenPatterns = [
      "ProductionComponent",
      "process_workload",
      "Component inactive",
      "execute_pipeline_step",
      "execute_resilient_operation",
    ];

    for (const curriculum of ALL_COURSE_CURRICULA) {
      for (const mod of curriculum.modules) {
        const serialized = JSON.stringify(mod);
        for (const pattern of forbiddenPatterns) {
          expect(serialized).not.toContain(pattern);
        }
      }
    }
  });

  it("should verify that every module has valid, topic-relevant learning resources with non-empty URLs and descriptions", () => {
    for (const curriculum of ALL_COURSE_CURRICULA) {
      for (const mod of curriculum.modules) {
        const resources = mod.content?.resources || mod.resources || [];
        expect(resources.length).toBeGreaterThanOrEqual(1);

        for (const res of resources) {
          expect(res.title.trim().length).toBeGreaterThan(0);
          expect(res.url.startsWith("http")).toBe(true);
          expect(res.description.trim().length).toBeGreaterThan(15);
          expect(res.type).toBeDefined();
        }
      }
    }
  });

  it("should verify Java course contains authentic Java/Spring code and not Python", () => {
    const javaCurriculum = getCourseCurriculum("course-jv-401");
    for (const mod of javaCurriculum.modules) {
      const concepts = mod.content?.keyConcepts || [];
      for (const c of concepts) {
        if (c.codeSnippet) {
          expect(c.codeSnippet).not.toContain("def ");
          expect(c.codeSnippet).not.toContain("import torch");
        }
      }
    }
  });

  it("should verify React course contains authentic TypeScript/TSX code", () => {
    const rctCurriculum = getCourseCurriculum("course-rct-401");
    for (const mod of rctCurriculum.modules) {
      const concepts = mod.content?.keyConcepts || [];
      for (const c of concepts) {
        if (c.codeSnippet) {
          expect(c.codeSnippet).not.toContain("def ");
          expect(c.codeSnippet).not.toContain("package com.");
        }
      }
    }
  });
});
