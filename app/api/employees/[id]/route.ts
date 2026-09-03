import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";
import { updateEmployeeSchema } from "@/lib/validations/employee";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/employees/:id
 * Retrieve employee profile with dynamic skill gaps.
 * RBAC: ADMIN/MANAGER can view any employee; EMPLOYEE can view their own profile.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const employeeId = params.id;
    const userRole = auth.user?.role;
    const userEmployeeId = auth.user?.employeeId;

    // RBAC: Employee can only view their own profile
    if (userRole === "EMPLOYEE" && userEmployeeId !== employeeId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You only have permission to view your own employee record." } },
        { status: 403 }
      );
    }

    const employee = await EmployeeService.getEmployeeById(auth.organizationId!, employeeId);

    if (!employee) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `Employee with ID "${employeeId}" was not found.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    console.error(`GET /api/employees/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve employee profile." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/employees/:id
 * Update employee profile or competency assessments.
 * RBAC: ADMIN and MANAGER (calibrating levels) permitted.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);

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

    const updaterName = auth.user?.name || "Administrator";
    const updated = await EmployeeService.updateEmployee(
      auth.organizationId!,
      params.id,
      parsed.data,
      updaterName
    );

    return NextResponse.json({
      success: true,
      message: "Employee updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof EmployeeServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error(`PATCH /api/employees/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update employee." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/employees/:id
 * Deactivate employee (soft-delete).
 * RBAC: ADMIN only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const employee = await EmployeeService.deactivateEmployee(auth.organizationId!, params.id);

    return NextResponse.json({
      success: true,
      message: "Employee deactivated successfully.",
      data: employee,
    });
  } catch (error: any) {
    if (error instanceof EmployeeServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error(`DELETE /api/employees/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to deactivate employee." } },
      { status: 500 }
    );
  }
}