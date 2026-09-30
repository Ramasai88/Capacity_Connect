import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { SkillGapService } from "@/lib/services/skill-gap.service";

/**
 * GET /api/skill-gaps
 * Organization-wide skill gap reports.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department") || undefined;

    // RBAC: Trainee only sees their own skill gaps
    const userRole = auth.user?.role;
    const userEmployeeId = auth.user?.employeeId;
    if (userRole === "TRAINEE" && userEmployeeId) {
      const single = await SkillGapService.getEmployeeSkillGaps(auth.organizationId!, userEmployeeId);
      return NextResponse.json({
        success: true,
        data: single ? [single] : [],
      });
    }

    const results = await SkillGapService.getOrganizationEmployeeGaps(auth.organizationId!, department);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("GET /api/skill-gaps error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve skill gaps." } },
      { status: 500 }
    );
  }
}
