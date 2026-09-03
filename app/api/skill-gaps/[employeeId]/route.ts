import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { SkillGapService } from "@/lib/services/skill-gap.service";

interface RouteParams {
  params: {
    employeeId: string;
  };
}

/**
 * GET /api/skill-gaps/:employeeId
 * Retrieve detailed skill gap analysis for an employee.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userRole = auth.user?.role;
    const userEmployeeId = auth.user?.employeeId;

    // RBAC: Employee only sees their own
    if (userRole === "EMPLOYEE" && userEmployeeId !== params.employeeId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You only have permission to view your own skill gaps." } },
        { status: 403 }
      );
    }

    const profile = await SkillGapService.getEmployeeSkillGaps(auth.organizationId!, params.employeeId);

    if (!profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Employee skill gap profile not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error(`GET /api/skill-gaps/${params.employeeId} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve employee skill gaps." } },
      { status: 500 }
    );
  }
}
