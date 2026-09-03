import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { evaluateExam, PYTHON_ADVANCED_EXAM } from "@/lib/assessment/exam-bank";

const ORG_A = "org-kl-university";
const ORG_B = "org-other-corp";

const CLEANUP_EMPLOYEE_IDS: string[] = [];
const CLEANUP_USER_IDS: string[] = [];
const CLEANUP_ORG_IDS: string[] = [];

function trackEmployee(id: string): string {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

function trackUser(id: string): string {
  CLEANUP_USER_IDS.push(id);
  return id;
}

function trackOrg(id: string): string {
  CLEANUP_ORG_IDS.push(id);
  return id;
}

afterEach(async () => {
  if (CLEANUP_EMPLOYEE_IDS.length > 0) {
    await prisma.skillRecommendation.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.skillAssessment.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.employeeCompetency.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.user.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.employee.deleteMany({ where: { id: { in: CLEANUP_EMPLOYEE_IDS } } });
    CLEANUP_EMPLOYEE_IDS.length = 0;
  }

  if (CLEANUP_USER_IDS.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: CLEANUP_USER_IDS } } });
    CLEANUP_USER_IDS.length = 0;
  }

  if (CLEANUP_ORG_IDS.length > 0) {
    await prisma.organization.deleteMany({ where: { id: { in: CLEANUP_ORG_IDS } } });
    CLEANUP_ORG_IDS.length = 0;
  }
});

describe("Diagnostic Exam Submission & Role-Based Performance Visibility", () => {
  // =========================================================================
  // PART 1: Diagnostic Exam Submission & Integrity
  // =========================================================================
  it("submits exam, calculates score server-side, and stores SkillAssessment linked strictly to employee", async () => {
    const comp = await prisma.competency.findFirst({ where: { organizationId: ORG_A } });
    expect(comp).not.toBeNull();

    const emp = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-SUB-${Date.now().toString(36).toUpperCase()}`,
        name: "Exam Submitter",
        email: `submitter.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    // 12 of 20 answers correct (60%)
    const answers: Array<{ questionId: string; selectedOption: string }> = [];
    for (let i = 0; i < 12; i++) {
      answers.push({
        questionId: PYTHON_ADVANCED_EXAM.questions[i].id,
        selectedOption: PYTHON_ADVANCED_EXAM.questions[i].correctAnswer,
      });
    }
    for (let i = 12; i < 20; i++) {
      answers.push({
        questionId: PYTHON_ADVANCED_EXAM.questions[i].id,
        selectedOption: "WRONG",
      });
    }

    const evalResult = evaluateExam("exam-python-advanced", answers);
    expect(evalResult.score).toBe(60);
    expect(evalResult.correctQuestions).toBe(12);

    const assessment = await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: evalResult.title,
      score: evalResult.score,
      totalQuestions: evalResult.totalQuestions,
      correctQuestions: evalResult.correctQuestions,
      topicBreakdown: evalResult.topicBreakdown,
      timeTakenMinutes: 20,
    });

    expect(assessment.id).toBeDefined();
    expect(assessment.employeeId).toBe(emp.id);
    expect(assessment.score).toBe(60);

    const storedInDb = await prisma.skillAssessment.findUnique({ where: { id: assessment.id } });
    expect(storedInDb).not.toBeNull();
    expect(storedInDb?.employeeId).toBe(emp.id);
    expect(storedInDb?.organizationId).toBe(ORG_A);
  });

  // =========================================================================
  // PART 2: Employee A vs Employee B Isolation
  // =========================================================================
  it("strictly isolates Employee A assessments from Employee B", async () => {
    const comp = await prisma.competency.findFirst({ where: { organizationId: ORG_A } });

    const empA = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-A-${Date.now().toString(36).toUpperCase()}`,
        name: "Employee A",
        email: `emp.a.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(empA.id);

    const empB = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-B-${Date.now().toString(36).toUpperCase()}`,
        name: "Employee B",
        email: `emp.b.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(empB.id);

    // Record assessment for Employee A (80%)
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: empA.id,
      competencyId: comp!.id,
      title: "Python Exam A",
      score: 80,
      totalQuestions: 20,
      correctQuestions: 16,
      topicBreakdown: [{ topic: "Variables", score: 80, totalQuestions: 4, correctQuestions: 3 }],
      timeTakenMinutes: 15,
    });

    // Record assessment for Employee B (45%)
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: empB.id,
      competencyId: comp!.id,
      title: "Python Exam B",
      score: 45,
      totalQuestions: 20,
      correctQuestions: 9,
      topicBreakdown: [{ topic: "Variables", score: 45, totalQuestions: 4, correctQuestions: 2 }],
      timeTakenMinutes: 18,
    });

    // Query Employee A's assessments
    const assessmentsA = await RecommendationService.getEmployeeAssessments(ORG_A, empA.id);
    expect(assessmentsA.length).toBe(1);
    expect(assessmentsA[0].employeeId).toBe(empA.id);
    expect(assessmentsA[0].score).toBe(80);

    // Query Employee B's assessments
    const assessmentsB = await RecommendationService.getEmployeeAssessments(ORG_A, empB.id);
    expect(assessmentsB.length).toBe(1);
    expect(assessmentsB[0].employeeId).toBe(empB.id);
    expect(assessmentsB[0].score).toBe(45);

    // Ensure none of Employee B's assessments appear in Employee A's view
    expect(assessmentsA.some((a) => a.employeeId === empB.id)).toBe(false);
  });

  // =========================================================================
  // PART 3: Assessment History Preservation (Multiple Attempts)
  // =========================================================================
  it("preserves multiple diagnostic assessment attempts in history", async () => {
    const comp = await prisma.competency.findFirst({ where: { organizationId: ORG_A } });

    const emp = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-HIST-${Date.now().toString(36).toUpperCase()}`,
        name: "History Employee",
        email: `emp.hist.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    // Attempt 1: 50%
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: "Python Diagnostic - Attempt 1",
      score: 50,
      totalQuestions: 20,
      correctQuestions: 10,
      topicBreakdown: [{ topic: "Variables", score: 50, totalQuestions: 4, correctQuestions: 2 }],
      timeTakenMinutes: 22,
    });

    // Attempt 2: 75%
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: "Python Diagnostic - Attempt 2",
      score: 75,
      totalQuestions: 20,
      correctQuestions: 15,
      topicBreakdown: [{ topic: "Variables", score: 75, totalQuestions: 4, correctQuestions: 3 }],
      timeTakenMinutes: 18,
    });

    const history = await RecommendationService.getEmployeeAssessments(ORG_A, emp.id);
    expect(history.length).toBe(2);
    // Ordered descending by completedAt
    expect(history[0].score).toBe(75);
    expect(history[1].score).toBe(50);
  });

  // =========================================================================
  // PART 4: Multi-Tenant Organization Isolation
  // =========================================================================
  it("prevents Organization A from viewing Organization B assessments", async () => {
    const orgB = await prisma.organization.create({
      data: {
        id: `org-test-${Date.now()}`,
        name: "Isolated Corp",
        code: `CORP-ISO-${Date.now().toString(36).toUpperCase()}`,
      },
    });
    trackOrg(orgB.id);

    const compB = await prisma.competency.create({
      data: {
        organizationId: orgB.id,
        code: `COMP-B-${Date.now()}`,
        name: "Org B Competency",
        description: "Test competency description",
        category: "TECHNICAL",
      },
    });

    const empB = await prisma.employee.create({
      data: {
        organizationId: orgB.id,
        employeeCode: `EMP-ORGB-${Date.now()}`,
        name: "Org B Employee",
        email: `emp.orgb.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(empB.id);

    await RecommendationService.recordAssessment({
      organizationId: orgB.id,
      employeeId: empB.id,
      competencyId: compB.id,
      title: "Org B Exam",
      score: 90,
      totalQuestions: 20,
      correctQuestions: 18,
      topicBreakdown: [{ topic: "Variables", score: 90, totalQuestions: 4, correctQuestions: 4 }],
      timeTakenMinutes: 14,
    });

    // Querying Org A must NOT find Org B assessment
    const orgAAssessments = await prisma.skillAssessment.findMany({
      where: { organizationId: ORG_A, employeeId: empB.id },
    });
    expect(orgAAssessments.length).toBe(0);

    const orgBAssessments = await prisma.skillAssessment.findMany({
      where: { organizationId: orgB.id, employeeId: empB.id },
    });
    expect(orgBAssessments.length).toBe(1);
    expect(orgBAssessments[0].score).toBe(90);
  });
});
