import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { RecommendationService } from "@/lib/services/recommendation.service";

/**
 * GET /api/recommendations
 * List personalized skill recommendations for the authenticated employee.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    let targetEmployeeId = auth.user?.employeeId;

    const requestedEmpId = searchParams.get("employeeId");
    if (requestedEmpId) {
      if (auth.user?.role === "EMPLOYEE" && requestedEmpId !== auth.user?.employeeId) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You can only view your own recommendations." } },
          { status: 403 }
        );
      }
      targetEmployeeId = requestedEmpId;
    }

    if (!targetEmployeeId) {
      return NextResponse.json({ recommendations: [] });
    }

    let recommendations = await RecommendationService.getEmployeeRecommendations(
      auth.organizationId!,
      targetEmployeeId
    );

    // If no recommendations generated yet, automatically trigger generation
    if (recommendations.length === 0) {
      recommendations = await RecommendationService.generateRecommendationsForEmployee(
        auth.organizationId!,
        targetEmployeeId
      );
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch skill recommendations." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recommendations
 * Force refresh/re-generation of skill recommendations based on latest skill gaps & assessments.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    let targetEmployeeId = auth.user?.employeeId;

    try {
      const body = await request.json();
      if (body?.employeeId) {
        if (auth.user?.role === "EMPLOYEE" && body.employeeId !== auth.user?.employeeId) {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "You can only refresh your own recommendations." } },
            { status: 403 }
          );
        }
        targetEmployeeId = body.employeeId;
      }
    } catch {
      // Empty body uses session employeeId
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_EMPLOYEE", message: "User is not linked to an employee workforce profile." } },
        { status: 400 }
      );
    }

    const recommendations = await RecommendationService.generateRecommendationsForEmployee(
      auth.organizationId!,
      targetEmployeeId
    );

    return NextResponse.json({
      success: true,
      message: "Skill recommendations updated successfully.",
      recommendations,
    });
  } catch (error) {
    console.error("POST /api/recommendations error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to generate skill recommendations." } },
      { status: 500 }
    );
  }
}
