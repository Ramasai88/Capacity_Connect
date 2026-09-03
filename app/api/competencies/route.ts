import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { CompetencyService, CompetencyServiceError } from "@/lib/services/competency.service";
import { createCompetencySchema, competencyQuerySchema } from "@/lib/validations/competency";

/**
 * GET /api/competencies
 * List organization competencies with levels and usage counts.
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
    const parsedQuery = competencyQuerySchema.safeParse(queryParams);

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

    const result = await CompetencyService.getCompetencies(auth.organizationId!, parsedQuery.data);

    return NextResponse.json({
      success: true,
      data: result.competencies,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/competencies error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve competencies list." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/competencies
 * Create a new competency framework item with 5-level rubric rubrics.
 * RBAC: ADMIN only.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = createCompetencySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid competency data.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const competency = await CompetencyService.createCompetency(auth.organizationId!, parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Competency created successfully with 5-level rubrics.",
        data: competency,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof CompetencyServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error("POST /api/competencies error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create competency." } },
      { status: 500 }
    );
  }
}
