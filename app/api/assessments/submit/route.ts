import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { evaluateExam } from "@/lib/assessment/exam-bank";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const submitExamSchema = z.object({
  examId: z.string().default("exam-python-advanced"),
  competencyId: z.string().optional(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOption: z.string(),
    })
  ).min(1, "Answers array must not be empty"),
  timeTakenMinutes: z.number().int().positive().optional(),
});

/**
 * POST /api/assessments/submit
 * Server-side evaluation of an employee's submitted answers.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    let employeeId = auth.user?.employeeId;

    // 1. Resolve employeeId if null in the current session token
    if (!employeeId) {
      if (auth.user?.role === "EMPLOYEE") {
        const dbUser = await prisma.user.findUnique({
          where: { id: auth.user.id },
          select: { employeeId: true },
        });
        employeeId = dbUser?.employeeId ?? null;
      } else if (auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER") {
        // Find or provision staff employee profile for Admin/Manager testing
        let emp = await prisma.employee.findFirst({
          where: {
            email: { equals: auth.user.email, mode: "insensitive" },
            organizationId: auth.organizationId!,
          },
        });
        if (!emp) {
          emp = await prisma.employee.create({
            data: {
              organizationId: auth.organizationId!,
              employeeCode: `EMP-STAFF-${Date.now().toString(36).toUpperCase()}`,
              name: auth.user.name,
              email: auth.user.email.toLowerCase().trim(),
              status: "ACTIVE",
            },
          });
        }
        employeeId = emp.id;
      }
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_EMPLOYEE", message: "User is not linked to an employee workforce profile." } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = submitExamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid exam submission payload",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // 2. Evaluate answers server-side using the canonical question bank
    const evaluation = evaluateExam(parsed.data.examId, parsed.data.answers);

    // 3. Identify target competency in PostgreSQL
    let competencyId = parsed.data.competencyId;
    if (!competencyId) {
      const matchedComp = await prisma.competency.findFirst({
        where: {
          organizationId: auth.organizationId!,
          code: { equals: evaluation.competencyCode, mode: "insensitive" },
        },
      });
      competencyId = matchedComp?.id;
    }

    if (!competencyId) {
      const fallbackComp = await prisma.competency.findFirst({
        where: { organizationId: auth.organizationId! },
      });
      competencyId = fallbackComp?.id;
    }

    if (!competencyId) {
      return NextResponse.json(
        { error: { code: "COMPETENCY_NOT_FOUND", message: "Target competency not found." } },
        { status: 404 }
      );
    }

    // 4. Store Real Assessment Result in PostgreSQL
    const assessment = await RecommendationService.recordAssessment({
      organizationId: auth.organizationId!,
      employeeId,
      competencyId,
      title: evaluation.title,
      score: evaluation.score,
      totalQuestions: evaluation.totalQuestions,
      correctQuestions: evaluation.correctQuestions,
      topicBreakdown: evaluation.topicBreakdown,
      timeTakenMinutes: parsed.data.timeTakenMinutes || 15,
    });

    // 5. Retrieve newly generated recommendations for this exact employee
    const recommendations = await RecommendationService.getEmployeeRecommendations(
      auth.organizationId!,
      employeeId
    );

    return NextResponse.json(
      {
        success: true,
        message: "Diagnostic assessment evaluated and stored successfully.",
        evaluation,
        assessment,
        recommendations,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/assessments/submit error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to evaluate diagnostic exam." } },
      { status: 500 }
    );
  }
}
