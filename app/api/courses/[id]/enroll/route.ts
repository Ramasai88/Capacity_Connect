import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { LearningService, LearningServiceError } from "@/lib/services/learning.service";
import { enrollCourseSchema } from "@/lib/validations/learning";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/courses/:id/enroll
 * Enroll current authenticated employee (or specified employee) in course.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    let targetEmployeeId = auth.user?.employeeId;

    // If body contains employeeId (e.g. Admin assigning or testing), parse it
    try {
      const body = await request.json();
      const parsed = enrollCourseSchema.safeParse(body);
      if (parsed.success && parsed.data.employeeId) {
        // If employee role, cannot enroll other employees
        if (auth.user?.role === "EMPLOYEE" && parsed.data.employeeId !== auth.user?.employeeId) {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "You can only enroll yourself in courses." } },
            { status: 403 }
          );
        }
        targetEmployeeId = parsed.data.employeeId;
      }
    } catch {
      // Empty body is valid: uses session employeeId
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

    const enrollment = await LearningService.enrollEmployee(
      auth.organizationId!,
      targetEmployeeId,
      params.id
    );

    return NextResponse.json(
      {
        success: true,
        message: "Successfully enrolled in course.",
        data: enrollment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof LearningServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error(`POST /api/courses/${params.id}/enroll error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to enroll in course." } },
      { status: 500 }
    );
  }
}
