import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getClientExam, evaluateExam, PYTHON_ADVANCED_EXAM } from "@/lib/assessment/exam-bank";
import { RecommendationService } from "@/lib/services/recommendation.service";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMPLOYEE_IDS: string[] = [];
const CLEANUP_DESIGNATION_IDS: string[] = [];

function trackEmployee(id: string): string {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

function trackDesignation(id: string): string {
  CLEANUP_DESIGNATION_IDS.push(id);
  return id;
}

afterEach(async () => {
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

describe("Diagnostic Exam — Question Bank & Server Evaluation Flow", () => {
  it("provides exactly 20 diagnostic questions across 5 architectural topics", () => {
    const clientExam = getClientExam("exam-python-advanced");

    expect(clientExam.totalQuestions).toBe(20);
    expect(clientExam.questions.length).toBe(20);
    expect(clientExam.topics).toEqual([
      "Variables",
      "OOP",
      "AsyncIO",
      "Thread Synchronization",
      "Microservices Architecture",
    ]);

    // Check 4 questions per topic
    const topicCounts: Record<string, number> = {};
    for (const q of clientExam.questions) {
      topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
    }

    expect(topicCounts["Variables"]).toBe(4);
    expect(topicCounts["OOP"]).toBe(4);
    expect(topicCounts["AsyncIO"]).toBe(4);
    expect(topicCounts["Thread Synchronization"]).toBe(4);
    expect(topicCounts["Microservices Architecture"]).toBe(4);
  });

  it("never exposes correctAnswer in client-sanitized questions", () => {
    const clientExam = getClientExam("exam-python-advanced");

    for (const q of clientExam.questions) {
      expect((q as any).correctAnswer).toBeUndefined();
      expect(q.options.length).toBe(4);
      for (const opt of q.options) {
        expect(["A", "B", "C", "D"]).toContain(opt.id);
        expect(typeof opt.text).toBe("string");
      }
    }
  });

  it("server evaluates submitted answers and calculates accurate score & topic breakdowns", () => {
    const exam = PYTHON_ADVANCED_EXAM;

    // Simulate answering:
    // - All 4 Variables questions CORRECT (100%)
    // - All 4 OOP questions CORRECT (100%)
    // - 2 of 4 AsyncIO questions CORRECT (50%)
    // - 1 of 4 Thread Synchronization questions CORRECT (25%)
    // - 2 of 4 Microservices Architecture questions CORRECT (50%)
    // Total = 4 + 4 + 2 + 1 + 2 = 13 / 20 = 65%

    const answers: Array<{ questionId: string; selectedOption: string }> = [];

    // Variables (all correct)
    const varQs = exam.questions.filter((q) => q.topic === "Variables");
    for (const q of varQs) {
      answers.push({ questionId: q.id, selectedOption: q.correctAnswer });
    }

    // OOP (all correct)
    const oopQs = exam.questions.filter((q) => q.topic === "OOP");
    for (const q of oopQs) {
      answers.push({ questionId: q.id, selectedOption: q.correctAnswer });
    }

    // AsyncIO (2 correct, 2 wrong)
    const asyncQs = exam.questions.filter((q) => q.topic === "AsyncIO");
    answers.push({ questionId: asyncQs[0].id, selectedOption: asyncQs[0].correctAnswer });
    answers.push({ questionId: asyncQs[1].id, selectedOption: asyncQs[1].correctAnswer });
    answers.push({ questionId: asyncQs[2].id, selectedOption: "WRONG" });
    answers.push({ questionId: asyncQs[3].id, selectedOption: "WRONG" });

    // Thread Synchronization (1 correct, 3 wrong)
    const threadQs = exam.questions.filter((q) => q.topic === "Thread Synchronization");
    answers.push({ questionId: threadQs[0].id, selectedOption: threadQs[0].correctAnswer });
    answers.push({ questionId: threadQs[1].id, selectedOption: "WRONG" });
    answers.push({ questionId: threadQs[2].id, selectedOption: "WRONG" });
    answers.push({ questionId: threadQs[3].id, selectedOption: "WRONG" });

    // Microservices Architecture (2 correct, 2 wrong)
    const microQs = exam.questions.filter((q) => q.topic === "Microservices Architecture");
    answers.push({ questionId: microQs[0].id, selectedOption: microQs[0].correctAnswer });
    answers.push({ questionId: microQs[1].id, selectedOption: microQs[1].correctAnswer });
    answers.push({ questionId: microQs[2].id, selectedOption: "WRONG" });
    answers.push({ questionId: microQs[3].id, selectedOption: "WRONG" });

    const evaluation = evaluateExam("exam-python-advanced", answers);

    expect(evaluation.totalQuestions).toBe(20);
    expect(evaluation.correctQuestions).toBe(13);
    expect(evaluation.score).toBe(65);

    const varStat = evaluation.topicBreakdown.find((t) => t.topic === "Variables");
    const oopStat = evaluation.topicBreakdown.find((t) => t.topic === "OOP");
    const asyncStat = evaluation.topicBreakdown.find((t) => t.topic === "AsyncIO");
    const threadStat = evaluation.topicBreakdown.find((t) => t.topic === "Thread Synchronization");
    const microStat = evaluation.topicBreakdown.find((t) => t.topic === "Microservices Architecture");

    expect(varStat?.score).toBe(100);
    expect(oopStat?.score).toBe(100);
    expect(asyncStat?.score).toBe(50);
    expect(threadStat?.score).toBe(25);
    expect(microStat?.score).toBe(50);
  });

  it("stores evaluated exam in PostgreSQL and generates personalized recommendations", async () => {
    const comp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(comp).not.toBeNull();

    const desig = await prisma.designation.create({
      data: {
        organizationId: TEST_ORG_ID,
        code: `DSG-EXAM-TEST-${Date.now().toString(36).toUpperCase()}`,
        title: "Test Exam Role",
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
        employeeCode: `EMP-EXAM-${Date.now().toString(36).toUpperCase()}`,
        name: "Exam Flow Employee",
        email: `exam.emp.${Date.now()}@example.com`,
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    // Simulate low score exam (7 correct / 20 = 35%)
    const answers: Array<{ questionId: string; selectedOption: string }> = [];
    for (let i = 0; i < 7; i++) {
      answers.push({
        questionId: PYTHON_ADVANCED_EXAM.questions[i].id,
        selectedOption: PYTHON_ADVANCED_EXAM.questions[i].correctAnswer,
      });
    }
    for (let i = 7; i < 20; i++) {
      answers.push({
        questionId: PYTHON_ADVANCED_EXAM.questions[i].id,
        selectedOption: "X",
      });
    }

    const evaluation = evaluateExam("exam-python-advanced", answers);
    expect(evaluation.score).toBe(35);

    // Record through RecommendationService
    const assessment = await RecommendationService.recordAssessment({
      organizationId: TEST_ORG_ID,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: evaluation.title,
      score: evaluation.score,
      totalQuestions: evaluation.totalQuestions,
      correctQuestions: evaluation.correctQuestions,
      topicBreakdown: evaluation.topicBreakdown,
      timeTakenMinutes: 15,
    });

    expect(assessment.id).toBeDefined();

    // Verify stored in PostgreSQL
    const dbAssessment = await prisma.skillAssessment.findUnique({
      where: { id: assessment.id },
    });
    expect(dbAssessment).not.toBeNull();
    expect(dbAssessment?.score).toBe(35);

    // Retrieve generated recommendations
    const recs = await RecommendationService.getEmployeeRecommendations(TEST_ORG_ID, emp.id);
    expect(recs.length).toBeGreaterThan(0);

    const rec = recs.find((r) => r.competencyId === comp!.id);
    expect(rec?.priority).toBe("HIGH");
    expect(rec?.scorePercentage).toBe(35);
  });
});
