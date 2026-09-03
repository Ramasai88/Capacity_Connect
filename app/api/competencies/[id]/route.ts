import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { CompetencyService, CompetencyServiceError } from "@/lib/services/competency.service";
import { updateCompetencySchema } from "@/lib/validations/competency";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/competencies/:id
 * Retrieve single competency with full 5-level rubric and usage counts.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const competencyId = params.id;
    const competency = await CompetencyService.getCompetencyById(auth.organizationId!, competencyId);

    if (!competency) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `Competency with ID "${competencyId}" was not found.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: competency,
    });
  } catch (error: any) {
    console.error(`GET /api/competencies/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve competency details." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/competencies/:id
 * Update competency metadata or rubric levels.
 * RBAC: ADMIN only.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = updateCompetencySchema.safeParse(body);

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

    const updated = await CompetencyService.updateCompetency(
      auth.organizationId!,
      params.id,
      parsed.data
    );

    return NextResponse.json({
      success: true,
      message: "Competency updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof CompetencyServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.statusCode }
      );
    }

    console.error(`PATCH /api/competencies/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update competency." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/competencies/:id
 * Delete competency with strict dependency protection.
 * RBAC: ADMIN only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const result = await CompetencyService.deleteCompetency(auth.organizationId!, params.id);

    return NextResponse.json({
      success: true,
      message: "Competency deleted successfully.",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof CompetencyServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.statusCode }
      );
    }

    console.error(`DELETE /api/competencies/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete competency." } },
      { status: 500 }
    );
  }
}
