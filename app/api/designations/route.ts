import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { DesignationService, DesignationServiceError } from "@/lib/services/designation.service";
import { createDesignationSchema, designationQuerySchema } from "@/lib/validations/designation";

/**
 * GET /api/designations
 * List designations with competency requirements and assigned employee counts.
 * RBAC: Authenticated organization users (ADMIN, MANAGER, EMPLOYEE).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsedQuery = designationQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters.",
            issues: parsedQuery.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const result = await DesignationService.getDesignations(auth.organizationId!, parsedQuery.data);

    return NextResponse.json({
      success: true,
      data: result.designations,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/designations error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve designations list." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/designations
 * Create a new designation / job role with mapped competency requirements.
 * RBAC: ADMIN only.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = createDesignationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid designation data.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const designation = await DesignationService.createDesignation(auth.organizationId!, parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Designation created successfully with competency requirements.",
        data: designation,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof DesignationServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error("POST /api/designations error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create designation." } },
      { status: 500 }
    );
  }
}
