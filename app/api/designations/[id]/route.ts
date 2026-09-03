import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { DesignationService, DesignationServiceError } from "@/lib/services/designation.service";
import { updateDesignationSchema } from "@/lib/validations/designation";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/designations/:id
 * Retrieve single designation with competency requirements and assigned employee count.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const designationId = params.id;
    const designation = await DesignationService.getDesignationById(auth.organizationId!, designationId);

    if (!designation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `Designation with ID "${designationId}" was not found.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: designation,
    });
  } catch (error: any) {
    console.error(`GET /api/designations/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve designation details." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/designations/:id
 * Update designation metadata or replace competency requirements.
 * RBAC: ADMIN only.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = updateDesignationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid update payload.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const updated = await DesignationService.updateDesignation(
      auth.organizationId!,
      params.id,
      parsed.data
    );

    return NextResponse.json({
      success: true,
      message: "Designation updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof DesignationServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.statusCode }
      );
    }

    console.error(`PATCH /api/designations/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update designation." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/designations/:id
 * Delete designation (blocked if employees are assigned to it).
 * RBAC: ADMIN only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const result = await DesignationService.deleteDesignation(auth.organizationId!, params.id);

    return NextResponse.json({
      success: true,
      message: "Designation deleted successfully.",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof DesignationServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.statusCode }
      );
    }

    console.error(`DELETE /api/designations/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete designation." } },
      { status: 500 }
    );
  }
}
