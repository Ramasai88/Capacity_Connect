import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { SkillGapService } from "@/lib/services/skill-gap.service";

/**
 * GET /api/skill-gaps/summary
 * Aggregate organization metrics: total gaps, meets requirement total, top priority competencies.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const summary = await SkillGapService.getOrganizationSummary(auth.organizationId!);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("GET /api/skill-gaps/summary error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to calculate skill gap summary." } },
      { status: 500 }
    );
  }
}
