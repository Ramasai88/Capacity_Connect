import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { SkillGapService } from "@/lib/services/skill-gap.service";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { calculateSkillGap } from "@/lib/skill-gap/calculateSkillGap";
import { TOPIC_CONCEPTS } from "@/lib/assessment/exam-bank";

describe("Individual Employee Skill Development Workflow", () => {
  let testOrgId: string;
  let testEmployeeId: string;
  let otherEmployeeId: string;
  let competencyId: string;
  let designationId: string;

  beforeAll(async () => {
    // 1. Create Test Organization
    const org = await prisma.organization.create({
      data: {
        id: `org-dev-${Date.now()}`,
        name: "Skill Development Test Org",
        code: `DEV-ORG-${Date.now().toString(36).toUpperCase()}`,
        description: "Test Organization for Skill Development",
        industry: "Education",
      },
    });
    testOrgId = org.id;

    // 2. Create Competencies
    const comp1 = await prisma.competency.create({
      data: {
        organizationId: testOrgId,
        name: "Thread Synchronization",
        code: `COMP-TS-${Date.now().toString(36).toUpperCase()}`,
        category: "Technical / Programming",
        description: "Multithreading and sync primitives",
      },
    });
    competencyId = comp1.id;

    const comp2 = await prisma.competency.create({
      data: {
        organizationId: testOrgId,
        name: "AsyncIO Concurrency",
        code: `COMP-ASYNC-${Date.now().toString(36).toUpperCase()}`,
        category: "Technical / Programming",
        description: "Event loops and coroutines",
      },
    });

    // 3. Create Designation with requirements
    const desig = await prisma.designation.create({
      data: {
        organizationId: testOrgId,
        title: "Senior Backend Developer",
        code: `DESIG-SBD-${Date.now().toString(36).toUpperCase()}`,
        department: "Engineering",
        requirements: {
          create: [
            { competencyId: comp1.id, requiredLevel: 4, organizationId: testOrgId },
            { competencyId: comp2.id, requiredLevel: 4, organizationId: testOrgId },
          ],
        },
      },
    });
    designationId = desig.id;

    // 4. Create Main Test Employee
    const emp1 = await prisma.employee.create({
      data: {
        organizationId: testOrgId,
        employeeCode: `EMP-DEV-01-${Date.now().toString(36).toUpperCase()}`,
        name: "Dev Workflow Employee",
        email: `dev.emp1.${Date.now()}@example.com`,
        department: "Engineering",
        designationId: desig.id,
        status: "ACTIVE",
        competencies: {
          create: [
            { competencyId: comp1.id, currentLevel: 2, organizationId: testOrgId, assessedBy: "Manager Baseline" },
            { competencyId: comp2.id, currentLevel: 3, organizationId: testOrgId, assessedBy: "Manager Baseline" },
          ],
        },
      },
    });
    testEmployeeId = emp1.id;

    // 5. Create Other Employee for isolation testing
    const emp2 = await prisma.employee.create({
      data: {
        organizationId: testOrgId,
        employeeCode: `EMP-DEV-02-${Date.now().toString(36).toUpperCase()}`,
        name: "Other Employee",
        email: `dev.emp2.${Date.now()}@example.com`,
        department: "Engineering",
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    otherEmployeeId = emp2.id;

    // 6. Record Diagnostic Assessment for Employee 1
    await RecommendationService.recordAssessment({
      organizationId: testOrgId,
      employeeId: testEmployeeId,
      competencyId: comp1.id,
      title: "Python Diagnostic Exam",
      score: 50,
      totalQuestions: 20,
      correctQuestions: 10,
      topicBreakdown: [
        { topic: "Thread Synchronization", score: 25, totalQuestions: 4, correctQuestions: 1 },
        { topic: "AsyncIO", score: 50, totalQuestions: 4, correctQuestions: 2 },
        { topic: "Variables", score: 100, totalQuestions: 4, correctQuestions: 4 },
      ],
      timeTakenMinutes: 15,
    });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.organization.delete({
      where: { id: testOrgId },
    }).catch(() => {});
  });

  it("calculates accurate canonical skill gaps for individual employee", async () => {
    const summary = await SkillGapService.getEmployeeSkillGaps(testOrgId, testEmployeeId);

    expect(summary).not.toBeNull();
    expect(summary!.employeeId).toBe(testEmployeeId);
    expect(summary!.totalRequired).toBe(2);
    expect(summary!.needsImprovementCount).toBe(2);
    expect(summary!.meetsRequirementCount).toBe(0);

    const tsGap = summary!.gaps.find((g) => g.competencyName === "Thread Synchronization");
    expect(tsGap).toBeDefined();
    expect(tsGap!.requiredLevel).toBe(4);
    expect(tsGap!.currentLevel).toBe(2);
    expect(tsGap!.gap).toBe(2);
    expect(tsGap!.status).toBe("NEEDS_IMPROVEMENT");

    const asyncGap = summary!.gaps.find((g) => g.competencyName === "AsyncIO Concurrency");
    expect(asyncGap).toBeDefined();
    expect(asyncGap!.requiredLevel).toBe(4);
    expect(asyncGap!.currentLevel).toBe(3);
    expect(asyncGap!.gap).toBe(1);
    expect(asyncGap!.status).toBe("NEEDS_IMPROVEMENT");
  });

  it("identifies focus areas and maps canonical study concepts from TOPIC_CONCEPTS", async () => {
    const assessment = await prisma.skillAssessment.findFirst({
      where: { organizationId: testOrgId, employeeId: testEmployeeId },
      orderBy: { completedAt: "desc" },
    });

    expect(assessment).not.toBeNull();
    const rawBreakdown = assessment!.topicBreakdown as any[];
    const weakTopics = rawBreakdown.filter((t) => t.score < 60);

    expect(weakTopics).toHaveLength(2); // Thread Sync (25%) & AsyncIO (50%)

    const threadSyncConcepts = TOPIC_CONCEPTS["Thread Synchronization"];
    expect(threadSyncConcepts).toBeDefined();
    expect(threadSyncConcepts).toContain("Python GIL (Global Interpreter Lock)");
    expect(threadSyncConcepts).toContain("Lock vs RLock (Reentrant Locks)");

    const asyncConcepts = TOPIC_CONCEPTS["AsyncIO"];
    expect(asyncConcepts).toBeDefined();
    expect(asyncConcepts).toContain("Event loop & cooperative multitasking");
  });

  it("recommends courses based on developmental gaps and diagnostic score", async () => {
    const recs = await RecommendationService.getEmployeeRecommendations(testOrgId, testEmployeeId);

    expect(recs.length).toBeGreaterThan(0);
    const topRec = recs[0];
    expect(topRec.priority).toBe("HIGH");
    expect(topRec.scorePercentage).toBe(50);
  });
});
