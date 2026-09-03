import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { ReassessmentService } from "@/lib/services/reassessment.service";
import { reassessmentQuerySchema } from "@/lib/validations/reassessment";

/**
 * GET /api/reassessments
 * List reassessment requests with employee, course, and competency context.
 * RBAC: ADMIN & MANAGER (EMPLOYEE only sees their own).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = reassessmentQuerySchema.safeParse(queryParams);

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

    const userRole = auth.user?.role;
    const userEmployeeId = auth.user?.employeeId;
    const queryData = { ...parsed.data };
    if (userRole === "EMPLOYEE" && userEmployeeId) {
      queryData.employeeId = userEmployeeId;
    }

    const result = await ReassessmentService.getReassessments(auth.organizationId!, queryData);

    return NextResponse.json({
      success: true,
      data: result.reassessments,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/reassessments error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve reassessments." } },
      { status: 500 }
    );
  }
}
