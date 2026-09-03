import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { LearningService } from "@/lib/services/learning.service";
import { enrollmentQuerySchema } from "@/lib/validations/learning";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = enrollmentQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    // RBAC: Employee only sees their own enrollments
    const userRole = auth.user?.role;
    const userEmployeeId = auth.user?.employeeId;
    const queryData = { ...parsed.data };
    if (userRole === "EMPLOYEE" && userEmployeeId) {
      queryData.employeeId = userEmployeeId;
    }

    const result = await LearningService.getEnrollments(auth.organizationId!, queryData);

    return NextResponse.json({
      success: true,
      data: result.enrollments,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/enrollments error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve enrollments." } },
      { status: 500 }
    );
  }
}
