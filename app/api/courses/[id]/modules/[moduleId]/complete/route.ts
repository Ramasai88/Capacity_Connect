import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { LearningService, LearningServiceError } from "@/lib/services/learning.service";
import { completeModuleSchema } from "@/lib/validations/learning";

interface RouteParams {
  params: {
    id: string;
    moduleId: string;
  };
}

/**
 * POST /api/courses/:id/modules/:moduleId/complete
 * Mark learning module complete, update progress, and auto-submit reassessment upon 100% completion.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    let targetEmployeeId = auth.user?.employeeId;

    try {
      const body = await request.json();
      const parsed = completeModuleSchema.safeParse({
        ...body,
        moduleId: params.moduleId,
      });
      if (parsed.success && parsed.data.employeeId) {
        if (auth.user?.role === "EMPLOYEE" && parsed.data.employeeId !== auth.user?.employeeId) {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "You cannot mark modules complete for other employees." } },
            { status: 403 }
          );
        }
        targetEmployeeId = parsed.data.employeeId;
      }
    } catch {
      // Empty body is valid
    }

    // Strict identity check: NO arbitrary findFirst() fallback
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

    const updated = await LearningService.completeModule(
      auth.organizationId!,
      targetEmployeeId,
      params.id,
      params.moduleId
    );

    return NextResponse.json({
      success: true,
      message: "Module marked complete.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof LearningServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error(`POST /api/courses/${params.id}/modules/${params.moduleId}/complete error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to complete module." } },
      { status: 500 }
    );
  }
}
