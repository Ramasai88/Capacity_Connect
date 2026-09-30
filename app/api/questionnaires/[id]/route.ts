import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  QuestionnaireService,
  QuestionnaireServiceError,
} from "@/lib/services/questionnaire.service";
import { updateQuestionnaireSchema } from "@/lib/validations/questionnaire";
import { ZodError } from "zod";

/**
 * GET /api/questionnaires/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const employeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    const questionnaire = await QuestionnaireService.getQuestionnaireById(
      auth.organizationId!,
      params.id,
      auth.user.role,
      employeeId
    );

    return NextResponse.json({
      success: true,
      data: questionnaire,
    });
  } catch (error: any) {
    if (error instanceof QuestionnaireServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/questionnaires/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve questionnaire." } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/questionnaires/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const validated = updateQuestionnaireSchema.parse(body);

    const trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    const updated = await QuestionnaireService.updateQuestionnaire(
      auth.organizationId!,
      params.id,
      trainerEmployeeId,
      auth.user.role,
      validated,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
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
    console.error("PUT /api/questionnaires/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update questionnaire." } },
      { status: 500 }
    );
  }
}
