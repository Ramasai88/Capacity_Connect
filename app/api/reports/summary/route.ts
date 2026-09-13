import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { ReportService } from "@/lib/services/report.service";
import { AuditService } from "@/lib/services/audit.service";

/**
 * GET /api/reports/summary
 * Organizational capacity readiness, course completion rate, and priority competency gaps.
 * RBAC: ADMIN & MANAGER.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const report = await ReportService.getCapacityReport(auth.organizationId!);

    if (auth.user.role === "MANAGER") {
      await AuditService.log({
        organizationId: auth.organizationId!,
        actorId: auth.userId,
        actorName: auth.user.name || auth.user.email,
        actorRole: "MANAGER",
        action: "MANAGER_REPORT_ACCESSED",
        category: "MANAGER_OPERATION",
        description: `Manager ${auth.user.name || auth.user.email} generated organizational capacity report summary.`,
      });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("GET /api/reports/summary error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate report summary." } },
      { status: 500 }
    );
  }
}
