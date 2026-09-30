import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  QuestionnaireService,
  QuestionnaireServiceError,
} from "@/lib/services/questionnaire.service";

/**
 * POST /api/questionnaires/[id]/publish
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    const published = await QuestionnaireService.publishQuestionnaire(
      auth.organizationId!,
      params.id,
      trainerEmployeeId,
      auth.user.role,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json({
      success: true,
      data: published,
      message: "Questionnaire published successfully.",
    });
  } catch (error: any) {
    if (error instanceof QuestionnaireServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/questionnaires/[id]/publish error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to publish questionnaire." } },
      { status: 500 }
    );
  }
}
