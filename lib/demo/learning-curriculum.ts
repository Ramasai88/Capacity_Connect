export {
  type LearningResource,
  type CourseConcept,
  type CourseModule,
  type CourseCurriculum,
} from "./curriculum/types";

import type { CourseCurriculum, CourseModule } from "./curriculum/types";
import { courseFsw401 } from "./curriculum/course-fsw-401";
import { courseJv401 } from "./curriculum/course-jv-401";
import { courseTs301 } from "./curriculum/course-ts-301";
import { courseRct401 } from "./curriculum/course-rct-401";
import { courseApi401 } from "./curriculum/course-api-401";
import { coursePy401 } from "./curriculum/course-py-401";
import { courseMl402 } from "./curriculum/course-ml-402";
import { courseDl501 } from "./curriculum/course-dl-501";
import { courseNlp501 } from "./curriculum/course-nlp-501";
import { courseMlops501 } from "./curriculum/course-mlops-501";
import { courseSql301 } from "./curriculum/course-sql-301";
import { courseCom501 } from "./curriculum/course-com-501";
import { courseLdr401 } from "./curriculum/course-ldr-401";

export const COURSE_CURRICULA: Record<string, CourseCurriculum> = {
  "course-fsw-401": courseFsw401,
  "course-jv-401": courseJv401,
  "course-ts-301": courseTs301,
  "course-rct-401": courseRct401,
  "course-api-401": courseApi401,
  "course-py-401": coursePy401,
  "course-ml-402": courseMl402,
  "course-dl-501": courseDl501,
  "course-nlp-501": courseNlp501,
  "course-mlops-501": courseMlops501,
  "course-sql-301": courseSql301,
  "course-com-501": courseCom501,
  "course-ldr-401": courseLdr401,
};

export const ALL_COURSE_CURRICULA: CourseCurriculum[] = Object.values(COURSE_CURRICULA);

/**
 * Returns curriculum for a given course ID, falling back to a structured default curriculum if needed.
 */
export function getCourseCurriculum(courseId: string): CourseCurriculum {
  if (COURSE_CURRICULA[courseId]) {
    return COURSE_CURRICULA[courseId];
  }

  // Generic fallback curriculum with meaningful structure for dynamically added custom courses
  return {
    courseId,
    totalDurationMinutes: 720,
    modules: [
      {
        id: `${courseId}-mod-1`,
        order: 1,
        title: "Module 1 — Foundational Architecture & Core Domain Principles",
        durationMinutes: 180,
        summary: "Comprehensive introduction to fundamental concepts, domain architecture, and industry standards.",
        learningObjectives: [
          "Master core architectural principles and domain terminology.",
          "Identify foundational execution patterns and industry best practices.",
          "Apply standard diagnostic methodologies across domain workflows.",
        ],
        resources: [
          {
            title: "Official Industry Documentation & Standards",
            url: "https://developer.mozilla.org/en-US/",
            description: "Authoritative reference for modern technical standards and architectural principles.",
            type: "documentation",
          },
        ],
        content: {
          overview: "Understanding core domain foundations provides the theoretical and practical framework required for professional implementation and execution.",
          keyConcepts: [
            {
              topic: "Domain Foundations",
              title: "Core Execution Principles & Architecture",
              description: "Detailed breakdown of foundational patterns, lifecycle mechanics, and implementation guidelines.",
              whyItMatters: "Establishes baseline practitioner competency and prevents common anti-patterns.",
              howItWorks: "Follows standard industry reference architectures with modular separation of concerns.",
            },
          ],
          practicalExercise: "Practical Lab: Implement and verify foundational domain workflow components adhering to established technical criteria.",
          competencyVerification: "Verifies foundational prerequisite compliance and domain standards.",
        },
      },
      {
        id: `${courseId}-mod-2`,
        order: 2,
        title: "Module 2 — Advanced Implementation, System Patterns & Error Resilience",
        durationMinutes: 180,
        summary: "Hands-on execution, real-world system patterns, edge-case mitigation, and error recovery.",
        learningObjectives: [
          "Implement production-grade domain workflows with robust error handling.",
          "Construct scalable subsystem patterns meeting target performance criteria.",
        ],
        resources: [
          {
            title: "Advanced Engineering Best Practices Guide",
            url: "https://docs.github.com/en",
            description: "Guidelines and workflows for building resilient production systems.",
            type: "guide",
          },
        ],
        content: {
          overview: "Hands-on implementation of core technical workflows with focus on fault tolerance and maintainability.",
          keyConcepts: [
            {
              topic: "Advanced Patterns",
              title: "Resilient System Implementation",
              description: "Architectural patterns for high-reliability execution and automated fault recovery.",
              whyItMatters: "Ensures production stability under dynamic real-world workloads.",
              howItWorks: "Decouples execution stages with boundary validation and structured error containment.",
            },
          ],
          practicalExercise: "Practical Lab: Build an end-to-end practical solution with automated validation and error logging.",
          competencyVerification: "Verifies intermediate implementation skill and fault-tolerant architecture.",
        },
      },
      {
        id: `${courseId}-mod-3`,
        order: 3,
        title: "Module 3 — Enterprise Integration, Observability & Capstone Qualification",
        durationMinutes: 180,
        summary: "Enterprise integration, monitoring, and target competency qualification milestone.",
        learningObjectives: [
          "Integrate multi-system domain pipelines with centralized observability.",
          "Demonstrate complete mastery satisfying target competency verification criteria.",
        ],
        resources: [
          {
            title: "Enterprise Architecture & Integration Standards",
            url: "https://www.w3.org/standards/",
            description: "Specifications and guidelines for enterprise integration and interoperability.",
            type: "specification",
          },
        ],
        content: {
          overview: "Capstone evaluation matching target competency level requirements and enterprise standards.",
          keyConcepts: [
            {
              topic: "Enterprise Integration",
              title: "System Verification & Production Readiness",
              description: "Comprehensive qualification criteria, observability pipelines, and validation milestones.",
              whyItMatters: "Proves practitioner capability to deliver enterprise-ready solutions.",
              howItWorks: "Validates all subsystem components against level rubrics and operational standards.",
            },
          ],
          practicalExercise: "Practical Lab: Execute capstone integration workflow and submit verified artifact for evaluation.",
          competencyVerification: "Final verification milestone for target level elevation.",
        },
      },
    ],
  };
}

/**
 * Registers a newly created course curriculum in memory.
 */
export function registerCourseCurriculum(
  courseId: string,
  curriculum: {
    courseId: string;
    courseTitle: string;
    targetCompetency: string;
    targetLevel: number;
    modules: CourseModule[];
  }
) {
  const totalMinutes = curriculum.modules.reduce(
    (acc, m) => acc + (m.durationMinutes || 60),
    0
  );

  COURSE_CURRICULA[courseId] = {
    courseId,
    totalDurationMinutes: totalMinutes,
    modules: curriculum.modules,
  };
}
