import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { AuditService } from "@/lib/services/audit.service";

/**
 * GET /api/admin/manager-activity
 *
 * Admin-only endpoint to retrieve comprehensive operational oversight metrics for all managers.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const summaries = await AuditService.getManagerActivityOverview(auth.organizationId!);

    return NextResponse.json({
      success: true,
      managers: summaries,
    });
  } catch (error) {
    console.error("GET /api/admin/manager-activity error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve manager activity oversight." } },
      { status: 500 }
    );
  }
}
