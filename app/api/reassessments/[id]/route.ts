import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { ReassessmentService } from "@/lib/services/reassessment.service";
import { isDemoMode } from "@/lib/demo/config";
import { prisma } from "@/lib/db/prisma";

async function resolveOrganizationId(session: any): Promise<string | null> {
  if (session?.user?.organizationId) {
    return session.user.organizationId;
  }
  if (isDemoMode() || process.env.NODE_ENV === "development") {
    const org = await prisma.organization.findFirst({ select: { id: true } });
    return org?.id ?? "org-kl-university";
  }
  return null;
}

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/reassessments/:id
 * Retrieve single reassessment detail.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentSession();
    const organizationId = await resolveOrganizationId(session);

    if (!organizationId) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "You must be signed in." } },
        { status: 401 }
      );
    }

    const r = await ReassessmentService.getReassessmentById(organizationId, params.id);

    if (!r) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Reassessment request not found." } },
        { status: 404 }
      );
    }

    // Role check: Employee can only view their own
    const userRole = session?.user?.role;
    const userEmployeeId = session?.user?.employeeId;
    if (session && userRole === "EMPLOYEE" && userEmployeeId && r.employeeId !== userEmployeeId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not have permission to view this reassessment." } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: r,
    });
  } catch (error: any) {
    console.error(`GET /api/reassessments/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve reassessment." } },
      { status: 500 }
    );
  }
}
