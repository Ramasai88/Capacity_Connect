import { prisma } from "@/lib/db/prisma";
import {
  CreateQuestionnaireInput,
  UpdateQuestionnaireInput,
  SubmitQuestionnaireInput,
  createQuestionnaireSchema,
  updateQuestionnaireSchema,
  submitQuestionnaireSchema,
} from "@/lib/validations/questionnaire";
import { AuditService } from "./audit.service";
import { QuestionnaireStatus, UserRole } from "@prisma/client";

export class QuestionnaireServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "QUESTIONNAIRE_ERROR") {
    super(message);
    this.name = "QuestionnaireServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface ActorContext {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: UserRole | string | null;
}

export class QuestionnaireService {
  /**
   * Create a new questionnaire with questions (defaults to DRAFT).
   */
  static async createQuestionnaire(
    organizationId: string,
    trainerEmployeeId: string,
    input: CreateQuestionnaireInput,
    actorContext?: ActorContext
  ) {
    if (!organizationId) {
      throw new QuestionnaireServiceError("Organization ID is required", 400, "MISSING_ORG");
    }

    const validated = createQuestionnaireSchema.parse(input);

    // Verify trainer exists in organization
    const trainer = await prisma.employee.findFirst({
      where: { id: trainerEmployeeId, organizationId },
    });

    if (!trainer) {
      throw new QuestionnaireServiceError("Trainer not found in organization", 404, "TRAINER_NOT_FOUND");
    }

    if (validated.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: validated.courseId, organizationId },
      });
      if (!course) {
        throw new QuestionnaireServiceError("Linked course not found", 404, "COURSE_NOT_FOUND");
      }
    }

    if (validated.competencyId) {
      const comp = await prisma.competency.findFirst({
        where: { id: validated.competencyId, organizationId },
      });
      if (!comp) {
        throw new QuestionnaireServiceError("Linked competency not found", 404, "COMPETENCY_NOT_FOUND");
      }
    }

    const deadlineDate = validated.deadline ? new Date(validated.deadline) : null;

    const questionnaire = await prisma.$transaction(async (tx) => {
      const created = await tx.questionnaire.create({
        data: {
          organizationId,
          trainerId: trainerEmployeeId,
          title: validated.title,
          description: validated.description,
          courseId: validated.courseId ?? null,
          competencyId: validated.competencyId ?? null,
          deadline: deadlineDate,
          durationMinutes: validated.durationMinutes ?? 30,
          passingScore: validated.passingScore ?? 70.0,
          status: (validated.status as QuestionnaireStatus) ?? "DRAFT",
        },
      });

      // Insert questions
      if (validated.questions && validated.questions.length > 0) {
        await tx.questionnaireQuestion.createMany({
          data: validated.questions.map((q, idx) => ({
            questionnaireId: created.id,
            order: q.order !== undefined ? q.order : idx + 1,
            questionText: q.questionText,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation ?? null,
            points: q.points ?? 1,
          })),
        });
      }

      return tx.questionnaire.findUnique({
        where: { id: created.id },
        include: {
          questions: { orderBy: { order: "asc" } },
          trainer: { select: { id: true, name: true, email: true, employeeCode: true } },
          course: { select: { id: true, title: true, code: true } },
          competency: { select: { id: true, name: true, code: true } },
        },
      });
    });

    if (!questionnaire) {
      throw new QuestionnaireServiceError("Failed to create questionnaire", 500, "CREATE_FAILED");
    }

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: actorContext?.actorName ?? trainer.name,
      actorRole: (actorContext?.actorRole as UserRole) ?? "TRAINER",
      action: "QUESTIONNAIRE_CREATED",
      category: "TRAINER_OPERATION",
      targetId: questionnaire.id,
      targetName: questionnaire.title,
      description: `Created questionnaire '${questionnaire.title}' (Status: ${questionnaire.status}, Questions: ${questionnaire.questions.length})`,
      metadata: {
        status: questionnaire.status,
        passingScore: questionnaire.passingScore,
        deadline: questionnaire.deadline ? questionnaire.deadline.toISOString() : null,
      },
    });

    return questionnaire;
  }

  /**
   * List questionnaires with role-based filtering and submission status.
   */
  static async listQuestionnaires(
    organizationId: string,
    userRole: UserRole | string,
    employeeId?: string | null,
    filters: {
      status?: QuestionnaireStatus;
      courseId?: string;
      competencyId?: string;
      trainerId?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const {
      status,
      courseId,
      competencyId,
      trainerId,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = { organizationId };

    // Trainees can ONLY view PUBLISHED questionnaires
    if (userRole === "TRAINEE") {
      where.status = "PUBLISHED";
    } else if (status) {
      where.status = status;
    }

    if (courseId) where.courseId = courseId;
    if (competencyId) where.competencyId = competencyId;
    if (trainerId) where.trainerId = trainerId;

    if (search && search.trim().length > 0) {
      const s = search.trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
      ];
    }

    const [total, rawQuestionnaires] = await Promise.all([
      prisma.questionnaire.count({ where }),
      prisma.questionnaire.findMany({
        where,
        include: {
          trainer: { select: { id: true, name: true, email: true, employeeCode: true } },
          course: { select: { id: true, title: true, code: true } },
          competency: { select: { id: true, name: true, code: true } },
          _count: { select: { questions: true, submissions: true } },
          ...(userRole === "TRAINEE" && employeeId
            ? {
                submissions: {
                  where: { traineeId: employeeId },
                  select: {
                    id: true,
                    score: true,
                    totalPoints: true,
                    earnedPoints: true,
                    submittedAt: true,
                  },
                },
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const questionnaires = rawQuestionnaires.map((q) => {
      const traineeSubmission = (q as any).submissions?.[0] || null;
      const hasAttempted = Boolean(traineeSubmission);
      const isPassed = hasAttempted ? traineeSubmission.score >= q.passingScore : false;
      const isPastDeadline = q.deadline ? new Date() > new Date(q.deadline) : false;

      return {
        id: q.id,
        organizationId: q.organizationId,
        trainerId: q.trainerId,
        trainer: q.trainer,
        courseId: q.courseId,
        course: q.course,
        competencyId: q.competencyId,
        competency: q.competency,
        title: q.title,
        description: q.description,
        deadline: q.deadline ? q.deadline.toISOString() : null,
        durationMinutes: q.durationMinutes,
        passingScore: q.passingScore,
        status: q.status,
        questionCount: q._count.questions,
        submissionCount: q._count.submissions,
        hasAttempted,
        submission: traineeSubmission
          ? {
              ...traineeSubmission,
              isPassed,
              submittedAt: traineeSubmission.submittedAt.toISOString(),
            }
          : null,
        isPastDeadline,
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      };
    });

    return {
      questionnaires,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single questionnaire by ID.
   * Trainees will NEVER receive correct answer keys or explanations prior to submitting.
   */
  static async getQuestionnaireById(
    organizationId: string,
    questionnaireId: string,
    userRole: UserRole | string,
    employeeId?: string | null
  ) {
    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
      include: {
        trainer: { select: { id: true, name: true, email: true, employeeCode: true } },
        course: { select: { id: true, title: true, code: true } },
        competency: { select: { id: true, name: true, code: true } },
        questions: { orderBy: { order: "asc" } },
        _count: { select: { submissions: true } },
      },
    });

    if (!questionnaire) {
      throw new QuestionnaireServiceError("Questionnaire not found", 404, "NOT_FOUND");
    }

    if (userRole === "TRAINEE" && questionnaire.status !== "PUBLISHED") {
      throw new QuestionnaireServiceError(
        "Questionnaire is not published or not accessible",
        403,
        "FORBIDDEN"
      );
    }

    let submission: any = null;
    if (employeeId) {
      const sub = await prisma.questionnaireSubmission.findUnique({
        where: {
          questionnaireId_traineeId: {
            questionnaireId,
            traineeId: employeeId,
          },
        },
      });
      if (sub) {
        submission = {
          ...sub,
          isPassed: sub.score >= questionnaire.passingScore,
          submittedAt: sub.submittedAt.toISOString(),
        };
      }
    }

    const hasAttempted = Boolean(submission);
    const isPastDeadline = questionnaire.deadline ? new Date() > new Date(questionnaire.deadline) : false;

    // Sanitize questions for unsubmitted trainees: Hide correctOption & explanation
    const safeQuestions = questionnaire.questions.map((q) => {
      if (userRole === "TRAINEE" && !hasAttempted) {
        return {
          id: q.id,
          order: q.order,
          questionText: q.questionText,
          options: q.options,
          points: q.points,
        };
      }
      return {
        id: q.id,
        order: q.order,
        questionText: q.questionText,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        points: q.points,
      };
    });

    return {
      id: questionnaire.id,
      organizationId: questionnaire.organizationId,
      trainerId: questionnaire.trainerId,
      trainer: questionnaire.trainer,
      courseId: questionnaire.courseId,
      course: questionnaire.course,
      competencyId: questionnaire.competencyId,
      competency: questionnaire.competency,
      title: questionnaire.title,
      description: questionnaire.description,
      deadline: questionnaire.deadline ? questionnaire.deadline.toISOString() : null,
      durationMinutes: questionnaire.durationMinutes,
      passingScore: questionnaire.passingScore,
      status: questionnaire.status,
      questions: safeQuestions,
      submissionCount: questionnaire._count.submissions,
      hasAttempted,
      submission,
      isPastDeadline,
      createdAt: questionnaire.createdAt.toISOString(),
      updatedAt: questionnaire.updatedAt.toISOString(),
    };
  }

  /**
   * Update questionnaire and optionally replace questions with ownership checks.
   */
  static async updateQuestionnaire(
    organizationId: string,
    questionnaireId: string,
    trainerEmployeeId: string | null | undefined,
    userRole: UserRole | string,
    input: UpdateQuestionnaireInput,
    actorContext?: ActorContext
  ) {
    const validated = updateQuestionnaireSchema.parse(input);

    const existing = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
    });

    if (!existing) {
      throw new QuestionnaireServiceError("Questionnaire not found", 404, "NOT_FOUND");
    }

    if (userRole === "TRAINER" && existing.trainerId !== trainerEmployeeId) {
      throw new QuestionnaireServiceError(
        "You can only edit questionnaires you created",
        403,
        "FORBIDDEN"
      );
    }

    if (userRole === "TRAINEE") {
      throw new QuestionnaireServiceError(
        "Trainees do not have permission to edit questionnaires",
        403,
        "FORBIDDEN"
      );
    }

    const deadlineDate =
      validated.deadline !== undefined
        ? validated.deadline
          ? new Date(validated.deadline)
          : null
        : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.questionnaire.update({
        where: { id: questionnaireId },
        data: {
          ...(validated.title !== undefined ? { title: validated.title } : {}),
          ...(validated.description !== undefined ? { description: validated.description } : {}),
          ...(validated.courseId !== undefined ? { courseId: validated.courseId } : {}),
          ...(validated.competencyId !== undefined ? { competencyId: validated.competencyId } : {}),
          ...(deadlineDate !== undefined ? { deadline: deadlineDate } : {}),
          ...(validated.durationMinutes !== undefined ? { durationMinutes: validated.durationMinutes } : {}),
          ...(validated.passingScore !== undefined ? { passingScore: validated.passingScore } : {}),
          ...(validated.status !== undefined ? { status: validated.status as QuestionnaireStatus } : {}),
        },
      });

      if (validated.questions && validated.questions.length > 0) {
        // Delete old questions and replace
        await tx.questionnaireQuestion.deleteMany({
          where: { questionnaireId },
        });

        await tx.questionnaireQuestion.createMany({
          data: validated.questions.map((q, idx) => ({
            questionnaireId,
            order: q.order !== undefined ? q.order : idx + 1,
            questionText: q.questionText,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation ?? null,
            points: q.points ?? 1,
          })),
        });
      }

      return tx.questionnaire.findUnique({
        where: { id: questionnaireId },
        include: {
          questions: { orderBy: { order: "asc" } },
          trainer: { select: { id: true, name: true, email: true, employeeCode: true } },
          course: { select: { id: true, title: true, code: true } },
          competency: { select: { id: true, name: true, code: true } },
        },
      });
    });

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: actorContext?.actorName ?? "Trainer",
      actorRole: (actorContext?.actorRole as UserRole) ?? (userRole as UserRole),
      action: "QUESTIONNAIRE_UPDATED",
      category: "TRAINER_OPERATION",
      targetId: updated!.id,
      targetName: updated!.title,
      description: `Updated questionnaire '${updated!.title}' (Status: ${updated!.status})`,
    });

    return updated;
  }

  /**
   * Publish a draft questionnaire.
   */
  static async publishQuestionnaire(
    organizationId: string,
    questionnaireId: string,
    trainerEmployeeId: string | null | undefined,
    userRole: UserRole | string,
    actorContext?: ActorContext
  ) {
    return this.updateQuestionnaire(
      organizationId,
      questionnaireId,
      trainerEmployeeId,
      userRole,
      { status: "PUBLISHED" },
      actorContext
    );
  }

  /**
   * Archive a questionnaire.
   */
  static async archiveQuestionnaire(
    organizationId: string,
    questionnaireId: string,
    trainerEmployeeId: string | null | undefined,
    userRole: UserRole | string,
    actorContext?: ActorContext
  ) {
    return this.updateQuestionnaire(
      organizationId,
      questionnaireId,
      trainerEmployeeId,
      userRole,
      { status: "ARCHIVED" },
      actorContext
    );
  }

  /**
   * Submit questionnaire responses and compute server-side score.
   */
  static async submitQuestionnaire(
    organizationId: string,
    questionnaireId: string,
    traineeEmployeeId: string,
    input: SubmitQuestionnaireInput,
    actorContext?: ActorContext
  ) {
    const validated = submitQuestionnaireSchema.parse(input);

    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
      include: {
        questions: true,
      },
    });

    if (!questionnaire) {
      throw new QuestionnaireServiceError("Questionnaire not found", 404, "NOT_FOUND");
    }

    if (questionnaire.status !== "PUBLISHED") {
      throw new QuestionnaireServiceError(
        "Cannot submit to an unpublished or archived questionnaire",
        400,
        "NOT_PUBLISHED"
      );
    }

    // Deadline enforcement
    if (questionnaire.deadline && new Date() > new Date(questionnaire.deadline)) {
      throw new QuestionnaireServiceError(
        "Submission deadline for this questionnaire has expired",
        400,
        "DEADLINE_EXPIRED"
      );
    }

    // Check duplicate submission
    const existingSubmission = await prisma.questionnaireSubmission.findUnique({
      where: {
        questionnaireId_traineeId: {
          questionnaireId,
          traineeId: traineeEmployeeId,
        },
      },
    });

    if (existingSubmission) {
      throw new QuestionnaireServiceError(
        "You have already submitted this questionnaire",
        400,
        "DUPLICATE_SUBMISSION"
      );
    }

    // Map questions by ID
    const questionMap = new Map<string, (typeof questionnaire.questions)[0]>();
    let maxPossiblePoints = 0;
    for (const q of questionnaire.questions) {
      questionMap.set(q.id, q);
      maxPossiblePoints += q.points;
    }

    // Validate and score each answer
    let earnedPoints = 0;
    const gradedAnswers: Array<{
      questionId: string;
      selectedOption: number;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
    }> = [];

    for (const item of validated.answers) {
      const q = questionMap.get(item.questionId);
      if (!q) {
        throw new QuestionnaireServiceError(
          `Question ID ${item.questionId} does not belong to this questionnaire`,
          400,
          "INVALID_QUESTION"
        );
      }

      if (item.selectedOption < 0 || item.selectedOption >= q.options.length) {
        throw new QuestionnaireServiceError(
          `Selected option ${item.selectedOption} is out of bounds for question '${q.questionText}'`,
          400,
          "INVALID_OPTION"
        );
      }

      const isCorrect = item.selectedOption === q.correctOption;
      const pts = isCorrect ? q.points : 0;
      earnedPoints += pts;

      gradedAnswers.push({
        questionId: item.questionId,
        selectedOption: item.selectedOption,
        isCorrect,
        pointsEarned: pts,
        maxPoints: q.points,
      });
    }

    const totalPoints = maxPossiblePoints > 0 ? maxPossiblePoints : 1;
    const scorePercentage = Math.round((earnedPoints / totalPoints) * 100 * 100) / 100;
    const isPassed = scorePercentage >= questionnaire.passingScore;

    const submission = await prisma.questionnaireSubmission.create({
      data: {
        organizationId,
        questionnaireId,
        traineeId: traineeEmployeeId,
        score: scorePercentage,
        totalPoints,
        earnedPoints,
        answers: gradedAnswers,
        timeSpentMinutes: validated.timeSpentMinutes ?? null,
      },
      include: {
        trainee: { select: { id: true, name: true, email: true, employeeCode: true } },
      },
    });

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: actorContext?.actorName ?? submission.trainee.name,
      actorRole: "TRAINEE",
      action: "QUESTIONNAIRE_SUBMITTED",
      category: "LEARNING",
      targetId: questionnaire.id,
      targetName: questionnaire.title,
      description: `Submitted questionnaire '${questionnaire.title}' with score ${scorePercentage}% (${isPassed ? "PASSED" : "FAILED"})`,
      metadata: {
        score: scorePercentage,
        isPassed,
        earnedPoints,
        totalPoints,
      },
    });

    return {
      submissionId: submission.id,
      questionnaireId: questionnaire.id,
      score: scorePercentage,
      passingScore: questionnaire.passingScore,
      isPassed,
      earnedPoints,
      totalPoints,
      gradedAnswers,
      submittedAt: submission.submittedAt.toISOString(),
    };
  }

  /**
   * Get analytical participation and performance metrics for a questionnaire.
   * Strictly restricted to questionnaire creator (TRAINER) or organization ADMIN.
   */
  static async getQuestionnaireAnalytics(
    organizationId: string,
    questionnaireId: string,
    trainerEmployeeId: string | null | undefined,
    userRole: UserRole | string
  ) {
    if (userRole === "TRAINEE") {
      throw new QuestionnaireServiceError(
        "Trainees cannot view questionnaire analytics",
        403,
        "FORBIDDEN"
      );
    }

    const questionnaire = await prisma.questionnaire.findFirst({
      where: { id: questionnaireId, organizationId },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, code: true } },
        competency: { select: { id: true, name: true, code: true } },
        questions: { orderBy: { order: "asc" } },
        submissions: {
          include: {
            trainee: {
              select: {
                id: true,
                name: true,
                email: true,
                employeeCode: true,
                department: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!questionnaire) {
      throw new QuestionnaireServiceError("Questionnaire not found", 404, "NOT_FOUND");
    }

    if (userRole === "TRAINER" && questionnaire.trainerId !== trainerEmployeeId) {
      throw new QuestionnaireServiceError(
        "Trainers can only view analytics for their own questionnaires",
        403,
        "FORBIDDEN"
      );
    }

    // Determine eligible trainees count:
    // Count only active TRAINEE employees (strictly exclude ADMIN and TRAINER users)
    let totalEligibleTrainees = 0;
    if (questionnaire.courseId) {
      totalEligibleTrainees = await prisma.courseEnrollment.count({
        where: {
          courseId: questionnaire.courseId,
          employee: {
            organizationId,
            status: "ACTIVE",
            NOT: {
              user: {
                role: { in: ["ADMIN", "TRAINER"] },
              },
            },
          },
        },
      });
    } else {
      totalEligibleTrainees = await prisma.employee.count({
        where: {
          organizationId,
          status: "ACTIVE",
          NOT: {
            user: {
              role: { in: ["ADMIN", "TRAINER"] },
            },
          },
        },
      });
    }

    const submissions = questionnaire.submissions;
    const submittedCount = submissions.length;
    const participationRate =
      totalEligibleTrainees > 0
        ? Math.round((submittedCount / totalEligibleTrainees) * 100 * 10) / 10
        : 0;

    let totalScoreSum = 0;
    let highestScore = 0;
    let lowestScore = submittedCount > 0 ? 100 : 0;
    let passingCount = 0;
    let failingCount = 0;

    // Track question-level correctness
    const questionAccuracyMap = new Map<
      string,
      { totalAttempts: number; correctAttempts: number }
    >();

    for (const q of questionnaire.questions) {
      questionAccuracyMap.set(q.id, { totalAttempts: 0, correctAttempts: 0 });
    }

    for (const sub of submissions) {
      totalScoreSum += sub.score;
      if (sub.score > highestScore) highestScore = sub.score;
      if (sub.score < lowestScore) lowestScore = sub.score;

      if (sub.score >= questionnaire.passingScore) {
        passingCount++;
      } else {
        failingCount++;
      }

      const answers = Array.isArray(sub.answers) ? (sub.answers as any[]) : [];
      for (const ans of answers) {
        const stat = questionAccuracyMap.get(ans.questionId);
        if (stat) {
          stat.totalAttempts++;
          if (ans.isCorrect) stat.correctAttempts++;
        }
      }
    }

    const averageScore =
      submittedCount > 0 ? Math.round((totalScoreSum / submittedCount) * 10) / 10 : 0;

    const questionBreakdown = questionnaire.questions.map((q) => {
      const stat = questionAccuracyMap.get(q.id) || { totalAttempts: 0, correctAttempts: 0 };
      const accuracyRate =
        stat.totalAttempts > 0
          ? Math.round((stat.correctAttempts / stat.totalAttempts) * 100 * 10) / 10
          : 0;

      return {
        questionId: q.id,
        order: q.order,
        questionText: q.questionText,
        points: q.points,
        totalAttempts: stat.totalAttempts,
        correctAttempts: stat.correctAttempts,
        accuracyRate,
      };
    });

    const traineeResults = submissions.map((sub) => ({
      submissionId: sub.id,
      traineeId: sub.trainee.id,
      traineeName: sub.trainee.name,
      traineeEmail: sub.trainee.email,
      employeeCode: sub.trainee.employeeCode,
      department: sub.trainee.department,
      score: sub.score,
      earnedPoints: sub.earnedPoints,
      totalPoints: sub.totalPoints,
      isPassed: sub.score >= questionnaire.passingScore,
      timeSpentMinutes: sub.timeSpentMinutes,
      submittedAt: sub.submittedAt.toISOString(),
    }));

    return {
      questionnaireId: questionnaire.id,
      title: questionnaire.title,
      description: questionnaire.description,
      status: questionnaire.status,
      deadline: questionnaire.deadline ? questionnaire.deadline.toISOString() : null,
      passingScore: questionnaire.passingScore,
      metrics: {
        totalEligibleTrainees,
        submittedCount,
        participationRate,
        averageScore,
        highestScore,
        lowestScore: submittedCount > 0 ? lowestScore : 0,
        passingCount,
        failingCount,
        passRate:
          submittedCount > 0
            ? Math.round((passingCount / submittedCount) * 100 * 10) / 10
            : 0,
      },
      questionBreakdown,
      traineeResults,
    };
  }
}
