import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { RecommendationService, RecommendationEngine } from "@/lib/services/recommendation.service";
import { LearningService } from "@/lib/services/learning.service";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMPLOYEE_IDS: string[] = [];
const CLEANUP_ENROLLMENT_IDS: string[] = [];
const CLEANUP_DESIGNATION_IDS: string[] = [];

function trackEmployee(id: string): string {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

function trackEnrollment(id: string): string {
  CLEANUP_ENROLLMENT_IDS.push(id);
  return id;
}

function trackDesignation(id: string): string {
  CLEANUP_DESIGNATION_IDS.push(id);
  return id;
}

afterEach(async () => {
  if (CLEANUP_ENROLLMENT_IDS.length > 0) {
    await prisma.moduleProgress.deleteMany({
      where: { enrollmentId: { in: CLEANUP_ENROLLMENT_IDS } },
    });
    await prisma.courseEnrollment.deleteMany({
      where: { id: { in: CLEANUP_ENROLLMENT_IDS } },
    });
    CLEANUP_ENROLLMENT_IDS.length = 0;
  }

  if (CLEANUP_EMPLOYEE_IDS.length > 0) {
    await prisma.skillRecommendation.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.skillAssessment.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.employeeCompetency.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.employee.deleteMany({
      where: { id: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    CLEANUP_EMPLOYEE_IDS.length = 0;
  }

  if (CLEANUP_DESIGNATION_IDS.length > 0) {
    await prisma.designationCompetency.deleteMany({
      where: { designationId: { in: CLEANUP_DESIGNATION_IDS } },
    });
    await prisma.designation.deleteMany({
      where: { id: { in: CLEANUP_DESIGNATION_IDS } },
    });
    CLEANUP_DESIGNATION_IDS.length = 0;
  }
});

describe("AI/ML Skill Recommendation Engine", () => {
  it("stores diagnostic assessment with topic breakdown in PostgreSQL", async () => {
    const comp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(comp).not.toBeNull();

    const emp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-REC-1-${Date.now().toString(36).toUpperCase()}`,
        name: "Recommendation Test Employee 1",
        email: `rec.emp1.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    const assessment = await RecommendationService.recordAssessment({
      organizationId: TEST_ORG_ID,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: "Python Architecture Diagnostic Exam",
      score: 42,
      totalQuestions: 20,
      correctQuestions: 8,
      topicBreakdown: [
        { topic: "Variables & Syntax", score: 90, totalQuestions: 4, correctQuestions: 4 },
        { topic: "OOP Architecture", score: 75, totalQuestions: 4, correctQuestions: 3 },
        { topic: "AsyncIO & Event Loops", score: 40, totalQuestions: 4, correctQuestions: 2 },
        { topic: "Concurrency & Threading", score: 25, totalQuestions: 4, correctQuestions: 1 },
      ],
      timeTakenMinutes: 20,
    });

    expect(assessment.id).toBeDefined();
    expect(assessment.score).toBe(42);
    expect(assessment.employeeId).toBe(emp.id);

    const dbAssessment = await prisma.skillAssessment.findUnique({
      where: { id: assessment.id },
    });
    expect(dbAssessment).not.toBeNull();
    expect(dbAssessment?.score).toBe(42);
  });

  it("calculates priority, extracts weak topics, and generates explainable recommendations", async () => {
    const comp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(comp).not.toBeNull();

    // Create self-contained test designation
    const desig = await prisma.designation.create({
      data: {
        organizationId: TEST_ORG_ID,
        code: `DSG-REC-TEST-${Date.now().toString(36).toUpperCase()}`,
        title: "Test AI Role",
        requirements: {
          create: [
            {
              organizationId: TEST_ORG_ID,
              competencyId: comp!.id,
              requiredLevel: 4,
            },
          ],
        },
      },
    });
    trackDesignation(desig.id);

    const emp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-REC-2-${Date.now().toString(36).toUpperCase()}`,
        name: "Recommendation Test Employee 2",
        email: `rec.emp2.${Date.now()}@example.com`,
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    // Record low diagnostic score (38%)
    await RecommendationService.recordAssessment({
      organizationId: TEST_ORG_ID,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: "Diagnostic Assessment",
      score: 38,
      totalQuestions: 10,
      correctQuestions: 3,
      topicBreakdown: [
        { topic: "Core Basics", score: 80, totalQuestions: 5, correctQuestions: 4 },
        { topic: "Advanced Concurrency", score: 20, totalQuestions: 5, correctQuestions: 1 },
      ],
    });

    const recs = await RecommendationService.getEmployeeRecommendations(TEST_ORG_ID, emp.id);
    expect(recs.length).toBeGreaterThan(0);

    const targetRec = recs.find((r) => r.competencyId === comp!.id);
    expect(targetRec).toBeDefined();
    expect(targetRec?.priority).toBe("HIGH");
    expect(targetRec?.weakTopics).toContain("Advanced Concurrency");
    expect(targetRec?.reason).toContain("Critical priority");
    expect(targetRec?.confidenceScore).toBeGreaterThanOrEqual(0.85);

    // Official EmployeeCompetency level must NOT be altered by recommendations
    const empComp = await prisma.employeeCompetency.findFirst({
      where: { employeeId: emp.id, competencyId: comp!.id },
    });
    expect(empComp).toBeNull();
  });

  it("provides multi-user isolation with distinct personalized recommendations", async () => {
    const comp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(comp).not.toBeNull();

    const desig = await prisma.designation.create({
      data: {
        organizationId: TEST_ORG_ID,
        code: `DSG-ISO-TEST-${Date.now().toString(36).toUpperCase()}`,
        title: "Isolated AI Test Role",
        requirements: {
          create: [
            {
              organizationId: TEST_ORG_ID,
              competencyId: comp!.id,
              requiredLevel: 4,
            },
          ],
        },
      },
    });
    trackDesignation(desig.id);

    // Employee A (Score 35% -> HIGH Priority)
    const empA = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-ISO-REC-A-${Date.now().toString(36).toUpperCase()}`,
        name: "Isolated Employee Alpha",
        email: `iso.rec.a.${Date.now()}@example.com`,
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    trackEmployee(empA.id);

    await RecommendationService.recordAssessment({
      organizationId: TEST_ORG_ID,
      employeeId: empA.id,
      competencyId: comp!.id,
      title: "Diagnostic Exam",
      score: 35,
      totalQuestions: 10,
      correctQuestions: 3,
      topicBreakdown: [{ topic: "Concurrency", score: 35, totalQuestions: 10, correctQuestions: 3 }],
    });

    // Employee B (Score 88% and meets requiredLevel -> LOW Priority)
    const empB = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-ISO-REC-B-${Date.now().toString(36).toUpperCase()}`,
        name: "Isolated Employee Beta",
        email: `iso.rec.b.${Date.now()}@example.com`,
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    trackEmployee(empB.id);

    await prisma.employeeCompetency.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeId: empB.id,
        competencyId: comp!.id,
        currentLevel: 4,
      },
    });

    await RecommendationService.recordAssessment({
      organizationId: TEST_ORG_ID,
      employeeId: empB.id,
      competencyId: comp!.id,
      title: "Diagnostic Exam",
      score: 88,
      totalQuestions: 10,
      correctQuestions: 9,
      topicBreakdown: [{ topic: "Concurrency", score: 88, totalQuestions: 10, correctQuestions: 9 }],
    });

    const recsA = await RecommendationService.getEmployeeRecommendations(TEST_ORG_ID, empA.id);
    const recsB = await RecommendationService.getEmployeeRecommendations(TEST_ORG_ID, empB.id);

    const recA = recsA.find((r) => r.competencyId === comp!.id);
    const recB = recsB.find((r) => r.competencyId === comp!.id);

    expect(recA?.priority).toBe("HIGH");
    expect(recB?.priority).toBe("LOW");
    expect(recA?.scorePercentage).toBe(35);
    expect(recB?.scorePercentage).toBe(88);
  });

  it("connects recommended course directly to existing learning enrollment", async () => {
    let course = await prisma.course.findUnique({
      where: { id: "course-py-401" },
    });
    if (!course) {
      course = await prisma.course.findFirst({
        where: { organizationId: TEST_ORG_ID },
      });
    }
    expect(course).not.toBeNull();

    const emp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-ENR-REC-${Date.now().toString(36).toUpperCase()}`,
        name: "Enrollment Integration Employee",
        email: `enr.rec.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    const enrollment = await LearningService.enrollEmployee(TEST_ORG_ID, emp.id, course!.id);
    trackEnrollment(enrollment.id);

    expect(enrollment.employeeId).toBe(emp.id);
    expect(enrollment.courseId).toBe(course!.id);
    expect(enrollment.status).toBe("IN_PROGRESS");
  });

  it("extracts ML feature vectors ready for future model training", () => {
    const features = RecommendationEngine.extractMLFeatures(45, [90, 75, 40, 25], 2, 4, 2, 1);

    expect(features.feat_assessment_score_norm).toBe(0.45);
    expect(features.feat_min_topic_score_norm).toBe(0.25);
    expect(features.feat_current_level_norm).toBe(0.4);
    expect(features.feat_required_level_norm).toBe(0.8);
    expect(features.feat_skill_gap).toBe(2);
    expect(features.feat_completed_courses).toBe(1);
  });

  it("ensures personal recommendations and assessment history are strictly scoped to authenticated employee", async () => {
    const comp = await prisma.competency.findFirst({ where: { organizationId: TEST_ORG_ID } });

    const desig = await prisma.designation.create({
      data: {
        organizationId: TEST_ORG_ID,
        code: `DSG-ISO-${Date.now().toString(36).toUpperCase()}`,
        title: "Isolation Test Role",
        requirements: {
          create: [
            {
              organizationId: TEST_ORG_ID,
              competencyId: comp!.id,
              requiredLevel: 4,
            },
          ],
        },
      },
    });
    trackDesignation(desig.id);

    const empA = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-ISO-A-${Date.now().toString(36).toUpperCase()}`,
        name: "Personal Employee A",
        email: `emp.iso.a.${Date.now()}@example.com`,
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    trackEmployee(empA.id);

    const empB = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-ISO-B-${Date.now().toString(36).toUpperCase()}`,
        name: "Personal Employee B",
        email: `emp.iso.b.${Date.now()}@example.com`,
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    trackEmployee(empB.id);

    // Record assessment for Employee A only
    await RecommendationService.recordAssessment({
      organizationId: TEST_ORG_ID,
      employeeId: empA.id,
      competencyId: comp!.id,
      title: "Employee A Diagnostic Exam",
      score: 30,
      totalQuestions: 20,
      correctQuestions: 6,
      topicBreakdown: [{ topic: "Thread Synchronization", score: 25, totalQuestions: 4, correctQuestions: 1 }],
      timeTakenMinutes: 15,
    });

    // Employee A's assessments
    const assessA = await RecommendationService.getEmployeeAssessments(TEST_ORG_ID, empA.id);
    expect(assessA.length).toBe(1);
    expect(assessA[0].employeeId).toBe(empA.id);
    expect(assessA[0].score).toBe(30);

    // Employee B's assessments must NOT contain Employee A's results
    const assessB = await RecommendationService.getEmployeeAssessments(TEST_ORG_ID, empB.id);
    expect(assessB.length).toBe(0);

    // Refresh recommendations for Employee A using their verified employeeId
    const recsA = await RecommendationService.generateRecommendationsForEmployee(TEST_ORG_ID, empA.id);
    expect(recsA.length).toBeGreaterThan(0);
    expect(recsA[0].employeeId).toBe(empA.id);
  });
});
