import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const topicBreakdownSchema = z.object({
  topic: z.string().min(1, "Topic name required"),
  score: z.number().min(0).max(100),
  totalQuestions: z.number().int().min(1),
  correctQuestions: z.number().int().min(0),
});

const submitAssessmentSchema = z.object({
  employeeId: z.string().optional(),
  competencyId: z.string().min(1, "Competency ID is required"),
  title: z.string().min(1, "Assessment title is required"),
  score: z.number().min(0).max(100),
  totalQuestions: z.number().int().min(1),
  correctQuestions: z.number().int().min(0),
  topicBreakdown: z.array(topicBreakdownSchema).min(1, "At least one topic breakdown is required"),
  timeTakenMinutes: z.number().int().positive().optional(),
});

/**
 * POST /api/assessments
 * Record a diagnostic skill assessment and trigger recommendation generation.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = submitAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid assessment payload",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    let targetEmployeeId = auth.user?.employeeId;

    // Admin/Manager can submit on behalf of an employee; Employee can only submit for themselves
    if (parsed.data.employeeId) {
      if (auth.user?.role === "EMPLOYEE" && parsed.data.employeeId !== auth.user?.employeeId) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You can only submit assessments for yourself." } },
          { status: 403 }
        );
      }
      targetEmployeeId = parsed.data.employeeId;
    }

    // If EMPLOYEE still has null employeeId, resolve from PostgreSQL User record
    if (!targetEmployeeId && auth.user?.role === "EMPLOYEE") {
      const dbUser = await prisma.user.findUnique({
        where: { id: auth.user.id },
        select: { employeeId: true },
      });
      targetEmployeeId = dbUser?.employeeId ?? null;
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        {
          error: {
            code: "UNLINKED_EMPLOYEE",
            message: "User is not linked to an employee workforce profile.",
          },
        },
        { status: 400 }
      );
    }

    const assessment = await RecommendationService.recordAssessment({
      organizationId: auth.organizationId!,
      employeeId: targetEmployeeId,
      competencyId: parsed.data.competencyId,
      title: parsed.data.title,
      score: parsed.data.score,
      totalQuestions: parsed.data.totalQuestions,
      correctQuestions: parsed.data.correctQuestions,
      topicBreakdown: parsed.data.topicBreakdown,
      timeTakenMinutes: parsed.data.timeTakenMinutes,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Skill assessment recorded and recommendations generated.",
        data: assessment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/assessments error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to record skill assessment." } },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assessments
 * List assessments with strict role-based visibility:
 * - EMPLOYEE: Can view ONLY their own assessment results.
 * - MANAGER & ADMIN: Can view assessments for authorized employees in their organization.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const requestedEmpId = searchParams.get("employeeId");

    // -------------------------------------------------------------------------
    // EMPLOYEE ACCESS: Strictly own assessments only
    // -------------------------------------------------------------------------
    if (auth.user?.role === "EMPLOYEE") {
      let ownEmployeeId = auth.user?.employeeId;

      if (!ownEmployeeId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: auth.user.id },
          select: { employeeId: true },
        });
        ownEmployeeId = dbUser?.employeeId ?? null;
      }

      if (requestedEmpId && requestedEmpId !== ownEmployeeId) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You can only view your own assessments." } },
          { status: 403 }
        );
      }

      if (!ownEmployeeId) {
        return NextResponse.json(
          { error: { code: "UNLINKED_EMPLOYEE", message: "User is not linked to an employee workforce profile." } },
          { status: 400 }
        );
      }

      const assessments = await RecommendationService.getEmployeeAssessments(
        auth.organizationId!,
        ownEmployeeId
      );

      return NextResponse.json({ assessments });
    }

    // -------------------------------------------------------------------------
    // MANAGER & ADMIN ACCESS: Organization-level employee performance visibility
    // -------------------------------------------------------------------------
    if (requestedEmpId) {
      // Fetch assessments for a specific requested employee in this organization
      const assessments = await prisma.skillAssessment.findMany({
        where: {
          organizationId: auth.organizationId!,
          employeeId: requestedEmpId,
        },
        include: {
          employee: {
            select: { id: true, name: true, email: true, employeeCode: true, designation: true },
          },
          competency: {
            select: { id: true, name: true, code: true, category: true },
          },
        },
        orderBy: { completedAt: "desc" },
      });

      return NextResponse.json({ assessments });
    }

    // When no specific employeeId is requested, return ONLY the authenticated user's personal assessments
    const ownEmpId = auth.user?.employeeId;
    if (ownEmpId) {
      const assessments = await RecommendationService.getEmployeeAssessments(
        auth.organizationId!,
        ownEmpId
      );
      return NextResponse.json({ assessments });
    }

    // Admins/Managers without a personal workforce profile have no personal diagnostic attempts
    return NextResponse.json({ assessments: [] });
  } catch (error) {
    console.error("GET /api/assessments error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch assessments." } },
      { status: 500 }
    );
  }
}
