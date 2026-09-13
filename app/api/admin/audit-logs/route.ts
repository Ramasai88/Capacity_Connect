import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { AuditService } from "@/lib/services/audit.service";

/**
 * GET /api/admin/audit-logs
 *
 * Admin-only endpoint to retrieve system, user management, and operational audit logs.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
    const category = searchParams.get("category") || undefined;
    const actorRole = searchParams.get("actorRole") || undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const result = await AuditService.getAuditLogs(auth.organizationId!, {
      page,
      limit,
      category,
      actorRole,
      actorId,
      action,
      search,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/admin/audit-logs error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve audit logs." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/audit-logs
 *
 * Endpoint to record operational and security events (e.g. manager reviewing skill gaps/reports).
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const { action, category, targetId, targetName, description, metadata } = body;

    if (!action || !category || !description) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required audit log fields." } },
        { status: 400 }
      );
    }

    await AuditService.log({
      organizationId: auth.organizationId!,
      actorId: auth.userId,
      actorName: auth.user.name || auth.user.email,
      actorRole: auth.user.role,
      action,
      category,
      targetId,
      targetName,
      description,
      metadata,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/audit-logs error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to record audit event." } },
      { status: 500 }
    );
  }
}
