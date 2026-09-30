import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  QuestionnaireService,
  QuestionnaireServiceError,
} from "@/lib/services/questionnaire.service";
import { createQuestionnaireSchema } from "@/lib/validations/questionnaire";
import { ZodError } from "zod";

/**
 * GET /api/questionnaires
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const employeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    const filters = {
      status: searchParams.get("status") as any,
      courseId: searchParams.get("courseId") || undefined,
      competencyId: searchParams.get("competencyId") || undefined,
      trainerId: searchParams.get("trainerId") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50,
    };

    const result = await QuestionnaireService.listQuestionnaires(
      auth.organizationId!,
      auth.user.role,
      employeeId,
      filters
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof QuestionnaireServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/questionnaires error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve questionnaires." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questionnaires
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const validated = createQuestionnaireSchema.parse(body);

    let trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    if (auth.user.role === "ADMIN" && body.trainerId) {
      trainerEmployeeId = body.trainerId;
    }

    if (!trainerEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_TRAINER", message: "User is not linked to a trainer employee profile." } },
        { status: 400 }
      );
    }

    const questionnaire = await QuestionnaireService.createQuestionnaire(
      auth.organizationId!,
      trainerEmployeeId,
      validated,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json(
      { success: true, data: questionnaire },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.errors[0]?.message || "Validation failed", details: error.errors } },
        { status: 400 }
      );
    }
    if (error instanceof QuestionnaireServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/questionnaires error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create questionnaire." } },
      { status: 500 }
    );
  }
}
