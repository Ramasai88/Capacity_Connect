import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  QuestionnaireService,
  QuestionnaireServiceError,
} from "@/lib/services/questionnaire.service";

/**
 * GET /api/questionnaires/[id]/analytics
 * Scoped strictly to owning TRAINER or organization ADMIN.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    const analytics = await QuestionnaireService.getQuestionnaireAnalytics(
      auth.organizationId!,
      params.id,
      trainerEmployeeId,
      auth.user.role
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    if (error instanceof QuestionnaireServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/questionnaires/[id]/analytics error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve questionnaire analytics." } },
      { status: 500 }
    );
  }
}
