import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  QuestionnaireService,
  QuestionnaireServiceError,
} from "@/lib/services/questionnaire.service";

const TEST_ORG_1 = "org-kl-university";
const TEST_ORG_2 = "org-state-power-corp";

let trainer1Id: string;
let trainer2Id: string;
let trainee1Id: string;
let trainee2Id: string;
let course1Id: string;

beforeAll(async () => {
  const trainerEmp1 = await prisma.employee.findFirst({
    where: { organizationId: TEST_ORG_1, user: { role: "TRAINER" } },
  });
  if (trainerEmp1) {
    trainer1Id = trainerEmp1.id;
  } else {
    const created = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `TRN-Q1-${Date.now()}`,
        name: "Questionnaire Trainer 1",
        email: `q.trainer1.${Date.now()}@klu.edu`,
      },
    });
    trainer1Id = created.id;
  }

  const created2 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `TRN-Q2-${Date.now()}`,
      name: "Questionnaire Trainer 2",
      email: `q.trainer2.${Date.now()}@klu.edu`,
    },
  });
  trainer2Id = created2.id;

  const trainee1 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `TRN-EE1-${Date.now()}`,
      name: "Questionnaire Trainee 1",
      email: `q.trainee1.${Date.now()}@klu.edu`,
    },
  });
  trainee1Id = trainee1.id;

  const trainee2 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `TRN-EE2-${Date.now()}`,
      name: "Questionnaire Trainee 2",
      email: `q.trainee2.${Date.now()}@klu.edu`,
    },
  });
  trainee2Id = trainee2.id;

  const course = await prisma.course.findFirst({
    where: { organizationId: TEST_ORG_1 },
  });
  if (course) {
    course1Id = course.id;
  }
});

describe("Phase 2: QuestionnaireService Business Logic & Analytics", () => {
  let createdQuestionnaireId: string;
  let q1Id: string;
  let q2Id: string;

  it("1. Creates questionnaire in DRAFT status by default with MCQ questions", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const q = await QuestionnaireService.createQuestionnaire(
      TEST_ORG_1,
      trainer1Id,
      {
        title: "Python Data Structures Diagnostic Quiz",
        description: "Assessing understanding of lists, dictionaries, and sets",
        courseId: course1Id || undefined,
        deadline: futureDate.toISOString(),
        durationMinutes: 20,
        passingScore: 70.0,
        questions: [
          {
            order: 1,
            questionText: "Which data structure in Python is immutable?",
            options: ["List", "Tuple", "Dictionary", "Set"],
            correctOption: 1, // Tuple
            explanation: "Tuples cannot be modified after instantiation.",
            points: 2,
          },
          {
            order: 2,
            questionText: "What is the average time complexity of dict lookup in Python?",
            options: ["O(n)", "O(1)", "O(log n)", "O(n^2)"],
            correctOption: 1, // O(1)
            explanation: "Python dictionaries use hash tables with O(1) average lookup.",
            points: 2,
          },
        ],
      },
      { actorId: "trainer-user-1", actorName: "Questionnaire Trainer 1", actorRole: "TRAINER" }
    );

    expect(q).toBeDefined();
    expect(q.id).toBeDefined();
    expect(q.status).toBe("DRAFT");
    expect(q.questions.length).toBe(2);
    expect(q.questions[0].correctOption).toBe(1);
    expect(q.questions[1].correctOption).toBe(1);

    createdQuestionnaireId = q.id;
    q1Id = q.questions[0].id;
    q2Id = q.questions[1].id;
  });

  it("2. TRAINEE cannot view or submit DRAFT questionnaires", async () => {
    // Cannot list draft questionnaire
    const traineeList = await QuestionnaireService.listQuestionnaires(
      TEST_ORG_1,
      "TRAINEE",
      trainee1Id
    );
    const foundInList = traineeList.questionnaires.find((item) => item.id === createdQuestionnaireId);
    expect(foundInList).toBeUndefined();

    // Cannot get draft questionnaire by ID
    await expect(
      QuestionnaireService.getQuestionnaireById(
        TEST_ORG_1,
        createdQuestionnaireId,
        "TRAINEE",
        trainee1Id
      )
    ).rejects.toThrow(QuestionnaireServiceError);

    // Cannot submit to draft questionnaire
    await expect(
      QuestionnaireService.submitQuestionnaire(
        TEST_ORG_1,
        createdQuestionnaireId,
        trainee1Id,
        {
          answers: [
            { questionId: q1Id, selectedOption: 1 },
            { questionId: q2Id, selectedOption: 1 },
          ],
        }
      )
    ).rejects.toThrow(QuestionnaireServiceError);
  });

  it("3. TRAINER can publish questionnaire and TRAINEE can now view without answer keys", async () => {
    const published = await QuestionnaireService.publishQuestionnaire(
      TEST_ORG_1,
      createdQuestionnaireId,
      trainer1Id,
      "TRAINER"
    );
    expect(published?.status).toBe("PUBLISHED");

    // Trainee views questionnaire before submission
    const traineeView = await QuestionnaireService.getQuestionnaireById(
      TEST_ORG_1,
      createdQuestionnaireId,
      "TRAINEE",
      trainee1Id
    );

    expect(traineeView.id).toBe(createdQuestionnaireId);
    expect(traineeView.questions.length).toBe(2);
    expect(traineeView.hasAttempted).toBe(false);

    // CRITICAL SECURITY: Trainee must NEVER see correctOption or explanation before submitting
    for (const q of traineeView.questions) {
      expect((q as any).correctOption).toBeUndefined();
      expect((q as any).explanation).toBeUndefined();
    }
  });

  it("4. TRAINEE submits responses, gets server-side grading and calculated score", async () => {
    const result = await QuestionnaireService.submitQuestionnaire(
      TEST_ORG_1,
      createdQuestionnaireId,
      trainee1Id,
      {
        answers: [
          { questionId: q1Id, selectedOption: 1 }, // Correct (Tuple) = 2 pts
          { questionId: q2Id, selectedOption: 1 }, // Correct (O(1)) = 2 pts
        ],
        timeSpentMinutes: 8,
      }
    );

    expect(result).toBeDefined();
    expect(result.earnedPoints).toBe(4);
    expect(result.totalPoints).toBe(4);
    expect(result.score).toBe(100);
    expect(result.isPassed).toBe(true);
    expect(result.gradedAnswers.length).toBe(2);
    expect(result.gradedAnswers[0].isCorrect).toBe(true);
    expect(result.gradedAnswers[1].isCorrect).toBe(true);
  });

  it("5. Rejects duplicate questionnaire submission from the same trainee", async () => {
    await expect(
      QuestionnaireService.submitQuestionnaire(
        TEST_ORG_1,
        createdQuestionnaireId,
        trainee1Id,
        {
          answers: [
            { questionId: q1Id, selectedOption: 1 },
            { questionId: q2Id, selectedOption: 1 },
          ],
        }
      )
    ).rejects.toThrow(QuestionnaireServiceError);
  });

  it("6. Rejects submission with invalid question ID or out-of-bounds option index", async () => {
    // Out of bounds option index
    await expect(
      QuestionnaireService.submitQuestionnaire(
        TEST_ORG_1,
        createdQuestionnaireId,
        trainee2Id,
        {
          answers: [
            { questionId: q1Id, selectedOption: 99 }, // Invalid option
            { questionId: q2Id, selectedOption: 1 },
          ],
        }
      )
    ).rejects.toThrow(QuestionnaireServiceError);

    // Question ID from non-existent question
    await expect(
      QuestionnaireService.submitQuestionnaire(
        TEST_ORG_1,
        createdQuestionnaireId,
        trainee2Id,
        {
          answers: [
            { questionId: "non-existent-question-id", selectedOption: 1 },
          ],
        }
      )
    ).rejects.toThrow(QuestionnaireServiceError);
  });

  it("7. Deadline enforcement: Rejects submissions after deadline has passed", async () => {
    // Create an expired questionnaire
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);

    const expiredQ = await QuestionnaireService.createQuestionnaire(
      TEST_ORG_1,
      trainer1Id,
      {
        title: "Expired Mid-Term Evaluation",
        description: "Past deadline test",
        deadline: pastDate.toISOString(),
        status: "PUBLISHED",
        questions: [
          {
            questionText: "Sample question?",
            options: ["A", "B"],
            correctOption: 0,
            points: 1,
          },
        ],
      }
    );

    await expect(
      QuestionnaireService.submitQuestionnaire(
        TEST_ORG_1,
        expiredQ.id,
        trainee2Id,
        {
          answers: [{ questionId: expiredQ.questions[0].id, selectedOption: 0 }],
        }
      )
    ).rejects.toThrow(QuestionnaireServiceError);
  });

  it("8. Computes comprehensive questionnaire analytics for owning TRAINER & ADMIN", async () => {
    // Trainee 2 submits with 1 correct, 1 incorrect answer
    await QuestionnaireService.submitQuestionnaire(
      TEST_ORG_1,
      createdQuestionnaireId,
      trainee2Id,
      {
        answers: [
          { questionId: q1Id, selectedOption: 0 }, // Incorrect (List) = 0 pts
          { questionId: q2Id, selectedOption: 1 }, // Correct (O(1)) = 2 pts
        ],
        timeSpentMinutes: 12,
      }
    );

    const analytics = await QuestionnaireService.getQuestionnaireAnalytics(
      TEST_ORG_1,
      createdQuestionnaireId,
      trainer1Id,
      "TRAINER"
    );

    expect(analytics).toBeDefined();
    expect(analytics.metrics.submittedCount).toBe(2);
    expect(analytics.metrics.highestScore).toBe(100);
    expect(analytics.metrics.lowestScore).toBe(50);
    expect(analytics.metrics.averageScore).toBe(75);
    expect(analytics.metrics.passingCount).toBe(1); // 100% >= 70%
    expect(analytics.metrics.failingCount).toBe(1); // 50% < 70%

    // Question breakdown verification
    expect(analytics.questionBreakdown.length).toBe(2);
    const q1Stat = analytics.questionBreakdown.find((q) => q.questionId === q1Id);
    expect(q1Stat?.totalAttempts).toBe(2);
    expect(q1Stat?.correctAttempts).toBe(1);
    expect(q1Stat?.accuracyRate).toBe(50);

    const q2Stat = analytics.questionBreakdown.find((q) => q.questionId === q2Id);
    expect(q2Stat?.totalAttempts).toBe(2);
    expect(q2Stat?.correctAttempts).toBe(2);
    expect(q2Stat?.accuracyRate).toBe(100);
  });

  it("9. Role restrictions: TRAINEE cannot access analytics; non-author TRAINER cannot access analytics", async () => {
    // Trainee blocked
    await expect(
      QuestionnaireService.getQuestionnaireAnalytics(
        TEST_ORG_1,
        createdQuestionnaireId,
        trainee1Id,
        "TRAINEE"
      )
    ).rejects.toThrow(QuestionnaireServiceError);

    // Trainer 2 blocked from Trainer 1's questionnaire
    await expect(
      QuestionnaireService.getQuestionnaireAnalytics(
        TEST_ORG_1,
        createdQuestionnaireId,
        trainer2Id,
        "TRAINER"
      )
    ).rejects.toThrow(QuestionnaireServiceError);
  });

  it("10. Multi-tenant isolation: Cross-organization questionnaire access is strictly blocked", async () => {
    await expect(
      QuestionnaireService.getQuestionnaireById(
        TEST_ORG_2,
        createdQuestionnaireId,
        "ADMIN"
      )
    ).rejects.toThrow(QuestionnaireServiceError);
  });

  it("11. Questionnaire eligibility strictly excludes ADMIN and TRAINER users from eligible trainee count", async () => {
    // Create an employee linked to a TRAINER user
    const trainerEmp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `TRN-EXCL-${Date.now()}`,
        name: "Excluded Trainer Employee",
        email: `excl.trainer.${Date.now()}@klu.edu`,
        status: "ACTIVE",
      },
    });

    await prisma.user.create({
      data: {
        organizationId: TEST_ORG_1,
        email: trainerEmp.email,
        name: trainerEmp.name,
        passwordHash: "$2a$10$hashedpasswordforexclusiontest",
        role: "TRAINER",
        employeeId: trainerEmp.id,
      },
    });

    const standaloneQ = await QuestionnaireService.createQuestionnaire(
      TEST_ORG_1,
      trainer1Id,
      {
        title: "Org Standalone Competency Quiz",
        description: "Testing eligible trainee population count",
        questions: [
          {
            questionText: "Sample question?",
            options: ["A", "B"],
            correctOption: 0,
            points: 1,
          },
        ],
      }
    );

    const analytics = await QuestionnaireService.getQuestionnaireAnalytics(
      TEST_ORG_1,
      standaloneQ.id,
      trainer1Id,
      "TRAINER"
    );

    // Verify that totalEligibleTrainees matches active employees excluding ADMIN/TRAINER users
    const expectedTrainees = await prisma.employee.count({
      where: {
        organizationId: TEST_ORG_1,
        status: "ACTIVE",
        NOT: {
          user: {
            role: { in: ["ADMIN", "TRAINER"] },
          },
        },
      },
    });

    expect(analytics.metrics.totalEligibleTrainees).toBe(expectedTrainees);

    // Total active employees count MUST be strictly greater than eligible trainees
    const allEmployeesCount = await prisma.employee.count({
      where: { organizationId: TEST_ORG_1, status: "ACTIVE" },
    });
    expect(allEmployeesCount).toBeGreaterThan(analytics.metrics.totalEligibleTrainees);
  });
});
