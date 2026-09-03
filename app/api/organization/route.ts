import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { OrganizationService, OrganizationServiceError } from "@/lib/services/organization.service";
import { updateOrganizationSchema } from "@/lib/validations/organization";

/**
 * GET /api/organization
 * Retrieve tenant organization profile and statistics.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const org = await OrganizationService.getOrganization(auth.organizationId!);

    if (!org) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Organization record not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: org,
    });
  } catch (error: any) {
    console.error("GET /api/organization error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve organization." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organization
 * Update tenant profile and settings.
 * RBAC: ADMIN only.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = updateOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid organization data.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const updated = await OrganizationService.updateOrganization(
      auth.organizationId!,
      parsed.data
    );

    return NextResponse.json({
      success: true,
      message: "Organization updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof OrganizationServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error("PATCH /api/organization error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update organization." } },
      { status: 500 }
    );
  }
}
