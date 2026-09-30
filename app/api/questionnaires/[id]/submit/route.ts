import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  QuestionnaireService,
  QuestionnaireServiceError,
} from "@/lib/services/questionnaire.service";
import { submitQuestionnaireSchema } from "@/lib/validations/questionnaire";
import { ZodError } from "zod";

/**
 * POST /api/questionnaires/[id]/submit
 * Trainee submits responses. Identity is derived strictly from session.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const traineeEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    if (!traineeEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_TRAINEE", message: "User is not linked to an active trainee employee profile." } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = submitQuestionnaireSchema.parse(body);

    const result = await QuestionnaireService.submitQuestionnaire(
      auth.organizationId!,
      params.id,
      traineeEmployeeId,
      validated,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: "Questionnaire submitted successfully.",
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
    console.error("POST /api/questionnaires/[id]/submit error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to submit questionnaire responses." } },
      { status: 500 }
    );
  }
}
