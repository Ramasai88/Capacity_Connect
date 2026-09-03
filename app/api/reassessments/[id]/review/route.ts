import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { ReassessmentService, ReassessmentServiceError } from "@/lib/services/reassessment.service";
import { reviewReassessmentSchema } from "@/lib/validations/reassessment";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/reassessments/:id/review
 * Manager or Admin reviews and approves/rejects reassessment.
 * Approving atomically updates the employee's competency level.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = reviewReassessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid review data.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const reviewerName = auth.user?.name || "Manager Reviewer";
    const reviewed = await ReassessmentService.reviewReassessment(
      auth.organizationId!,
      params.id,
      reviewerName,
      parsed.data
    );

    return NextResponse.json({
      success: true,
      message: `Reassessment successfully ${parsed.data.status.toLowerCase()}.`,
      data: reviewed,
    });
  } catch (error: any) {
    if (error instanceof ReassessmentServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error(`POST /api/reassessments/${params.id}/review error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to review reassessment." } },
      { status: 500 }
    );
  }
}
