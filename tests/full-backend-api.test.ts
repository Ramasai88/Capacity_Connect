import { describe, it, expect } from "vitest";
import { CourseService, CourseServiceError } from "@/lib/services/course.service";
import { LearningService, LearningServiceError } from "@/lib/services/learning.service";
import { ReassessmentService } from "@/lib/services/reassessment.service";
import { SkillGapService } from "@/lib/services/skill-gap.service";
import { ReportService } from "@/lib/services/report.service";
import { OrganizationService } from "@/lib/services/organization.service";
import { prisma } from "@/lib/db/prisma";

const TEST_ORG_ID = "org-kl-university";

describe("Complete Real Backend API Domain Services", () => {
  // ==========================================
  // 1. Course Domain
  // ==========================================
  it("retrieves courses with modules and supports search/category filters", async () => {
    const list = await CourseService.getCourses(TEST_ORG_ID, {
      search: "Python",
    });
    expect(list.courses.length).toBeGreaterThanOrEqual(1);
    expect(list.courses[0].title).toContain("Python");
    expect(list.courses[0].modulesCount).toBeGreaterThan(0);
  });

  it("retrieves detailed course with ordered curriculum modules", async () => {
    const courses = await CourseService.getCourses(TEST_ORG_ID, { limit: 1 });
    const firstCourse = courses.courses[0];

    const detailed = await CourseService.getCourseById(TEST_ORG_ID, firstCourse.id);
    expect(detailed).not.toBeNull();
    expect(detailed?.modules.length).toBe(firstCourse.modulesCount);
    expect(detailed?.modules[0].order).toBe(1);
  });

  it("creates, updates, and atomically provisions course modules", async () => {
    const uniqueCode = `CRS-TEST-${Date.now()}`;

    // Create
    const created = await CourseService.createCourse(TEST_ORG_ID, {
      title: "Real-Time Microservices with Go & Kafka",
      code: uniqueCode,
      description: "High-throughput event-driven microservices architecture.",
      category: "Technical / Programming",
      competencyId: "comp-python",
      targetLevel: 4,
      durationHours: 32,
      modules: [
        {
          order: 1,
          title: "Foundations of Event-Driven Systems",
          summary: "Core event log concepts and stream processing fundamentals.",
          durationMinutes: 45,
          overview: "In-depth overview of event brokers.",
          practicalExercise: "Deploy a local Kafka broker using Docker.",
          competencyVerification: "Verify topic creation and event ingestion.",
        },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.modules.length).toBe(1);

    // Update
    const updated = await CourseService.updateCourse(TEST_ORG_ID, created.id, {
      title: "Real-Time Microservices with Go & Kafka (Advanced)",
    });
    expect(updated.title).toBe("Real-Time Microservices with Go & Kafka (Advanced)");

    // Clean up
    await prisma.courseModule.deleteMany({ where: { courseId: created.id } });
    await prisma.course.delete({ where: { id: created.id } });
  });

  // ==========================================
  // 2. Enrollment, Progress & Automated Reassessment
  // ==========================================
  it("manages end-to-end learning lifecycle and auto-triggers reassessments", async () => {
    // Create temporary employee and course
    const empCode = `EMP-LEARN-${Date.now()}`;
    const crsCode = `CRS-LEARN-${Date.now()}`;

    const emp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        name: "Learning Lifecycle Candidate",
        email: `learn.test.${Date.now()}@klu.edu`,
        employeeCode: empCode,
        status: "ACTIVE",
      },
    });

    // Seed baseline competency at Level 2
    await prisma.employeeCompetency.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeId: emp.id,
        competencyId: "comp-python",
        currentLevel: 2,
      },
    });

    const crs = await CourseService.createCourse(TEST_ORG_ID, {
      title: "Automated Calibration Course",
      code: crsCode,
      description: "Test course verifying auto-reassessment on 100% completion.",
      category: "Technical / Programming",
      competencyId: "comp-python",
      targetLevel: 4,
      durationHours: 10,
      modules: [
        {
          order: 1,
          title: "Module 1",
          summary: "Intro",
          durationMinutes: 30,
          overview: "Overview",
          practicalExercise: "Exercise 1",
          competencyVerification: "Verification 1",
        },
        {
          order: 2,
          title: "Module 2",
          summary: "Advanced",
          durationMinutes: 30,
          overview: "Overview",
          practicalExercise: "Exercise 2",
          competencyVerification: "Verification 2",
        },
      ],
    });

    // 1. Enroll
    const enrollment = await LearningService.enrollEmployee(TEST_ORG_ID, emp.id, crs.id);
    expect(enrollment.progressPercent).toBe(0);
    expect(enrollment.status).toBe("IN_PROGRESS");

    // 2. Complete Module 1 -> 50%
    const step1 = await LearningService.completeModule(
      TEST_ORG_ID,
      emp.id,
      crs.id,
      crs.modules[0].id
    );
    expect(step1.progressPercent).toBe(50);
    expect(step1.status).toBe("IN_PROGRESS");

    // 3. Complete Module 2 -> 100% (Completed & Auto-trigger Reassessment)
    const step2 = await LearningService.completeModule(
      TEST_ORG_ID,
      emp.id,
      crs.id,
      crs.modules[1].id
    );
    expect(step2.progressPercent).toBe(100);
    expect(step2.status).toBe("COMPLETED");
    expect(step2.reassessment).not.toBeNull();
    expect(step2.reassessment?.requestedLevel).toBe(4);

    // 4. Review and Approve Reassessment
    const reassessmentId = step2.reassessment!.id;
    const reviewed = await ReassessmentService.reviewReassessment(
      TEST_ORG_ID,
      reassessmentId,
      "Lead Calibration Manager",
      {
        status: "APPROVED",
        reviewerComments: "Demonstrated full async IO proficiency in practical assessment.",
      }
    );

    expect(reviewed.status).toBe("APPROVED");

    // Verify employee competency was atomically elevated in PostgreSQL from Level 2 to Level 4
    const updatedComp = await prisma.employeeCompetency.findUnique({
      where: {
        employeeId_competencyId: {
          employeeId: emp.id,
          competencyId: "comp-python",
        },
      },
    });
    expect(updatedComp?.currentLevel).toBe(4);

    // Clean up test records
    await prisma.reassessment.deleteMany({ where: { employeeId: emp.id } });
    await prisma.moduleProgress.deleteMany({ where: { enrollment: { employeeId: emp.id } } });
    await prisma.courseEnrollment.deleteMany({ where: { employeeId: emp.id } });
    await prisma.courseModule.deleteMany({ where: { courseId: crs.id } });
    await prisma.course.delete({ where: { id: crs.id } });
    await prisma.competencyAssessmentHistory.deleteMany({ where: { employeeId: emp.id } });
    await prisma.employeeCompetency.deleteMany({ where: { employeeId: emp.id } });
    await prisma.employee.delete({ where: { id: emp.id } });
  });

  // ==========================================
  // 3. Skill Gap & Reporting Analytics
  // ==========================================
  it("calculates real-time skill gaps across organization and employee profiles", async () => {
    const summary = await SkillGapService.getOrganizationSummary(TEST_ORG_ID);

    expect(summary.totalEmployees).toBeGreaterThanOrEqual(5);
    expect(summary.totalCompetencies).toBeGreaterThanOrEqual(1);
    expect(summary.totalGapsIdentified).toBeGreaterThanOrEqual(0);
  });

  it("generates comprehensive organizational capacity readiness report", async () => {
    const report = await ReportService.getCapacityReport(TEST_ORG_ID);

    expect(report.organizationId).toBe(TEST_ORG_ID);
    expect(report.metrics.totalEmployees).toBeGreaterThanOrEqual(5);
    expect(report.metrics.overallReadinessPercent).toBeGreaterThanOrEqual(0);
    expect(report.metrics.overallReadinessPercent).toBeLessThanOrEqual(100);
  });

  // ==========================================
  // 4. Organization Settings
  // ==========================================
  it("retrieves and updates organization tenant metadata", async () => {
    const org = await OrganizationService.getOrganization(TEST_ORG_ID);
    expect(org).not.toBeNull();
    expect(typeof org?.name).toBe("string");
    expect(org?.name.length).toBeGreaterThan(0);
    expect(org?.statistics.employeesCount).toBeGreaterThanOrEqual(5);

    const updated = await OrganizationService.updateOrganization(TEST_ORG_ID, {
      industry: "Higher Education & Applied Technology",
    });
    expect(updated.industry).toBe("Higher Education & Applied Technology");
  });
});
