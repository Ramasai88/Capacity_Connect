import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  FeedbackService,
  FeedbackServiceError,
} from "@/lib/services/feedback.service";
import { submitFeedbackSchema } from "@/lib/validations/feedback";
import { ZodError } from "zod";

/**
 * GET /api/feedback
 * Restricted to ADMIN & TRAINER roles. Trainees are blocked with 403.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (courseId) {
      const courseFeedback = await FeedbackService.getCourseFeedback(
        auth.organizationId!,
        courseId,
        auth.user.role
      );
      return NextResponse.json({
        success: true,
        data: courseFeedback,
      });
    }

    if (auth.user.role === "ADMIN") {
      const orgSummary = await FeedbackService.getOrganizationFeedbackSummary(
        auth.organizationId!,
        auth.user.role
      );
      return NextResponse.json({
        success: true,
        data: orgSummary,
      });
    }

    return NextResponse.json(
      { error: { code: "MISSING_COURSE_ID", message: "Please specify a courseId parameter to view course feedback." } },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof FeedbackServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/feedback error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve feedback data." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback
 * Trainee submits course feedback. Identity is strictly derived from session.
 */
export async function POST(request: NextRequest) {
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
    const validated = submitFeedbackSchema.parse(body);

    const feedback = await FeedbackService.submitFeedback(
      auth.organizationId!,
      traineeEmployeeId,
      validated,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json(
      { success: true, data: feedback, message: "Feedback submitted successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.errors[0]?.message || "Validation failed", details: error.errors } },
        { status: 400 }
      );
    }
    if (error instanceof FeedbackServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/feedback error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to submit course feedback." } },
      { status: 500 }
    );
  }
}
