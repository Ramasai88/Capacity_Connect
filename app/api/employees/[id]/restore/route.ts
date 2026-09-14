import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/employees/:id/restore
 * Restore a removed employee back to ACTIVE status.
 * RBAC: ADMIN only.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const restoredEmployee = await EmployeeService.reactivateEmployee(
      auth.organizationId!,
      params.id,
      auth.userId,
      auth.user?.name,
      auth.user?.role
    );

    return NextResponse.json({
      success: true,
      message: "Employee restored to active status successfully.",
      data: restoredEmployee,
    });
  } catch (error: any) {
    if (error instanceof EmployeeServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error(`POST /api/employees/${params.id}/restore error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to restore employee." } },
      { status: 500 }
    );
  }
}
