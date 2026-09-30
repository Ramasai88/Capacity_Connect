import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";
import { updateEmployeeSchema, traineeProfileUpdateSchema } from "@/lib/validations/employee";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/employees/:id
 * Retrieve employee profile with dynamic skill gaps.
 * RBAC: ADMIN/TRAINER can view any employee; TRAINEE can view their own profile.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const employeeId = params.id;
    const userRole = auth.user?.role;
    let userEmployeeId: string | null = auth.user?.employeeId ?? null;

    if (!userEmployeeId && userRole === "TRAINEE") {
      userEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);
    }

    // RBAC: Trainee can only view their own profile
    if (userRole === "TRAINEE" && userEmployeeId !== employeeId) {
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
 * Update employee profile.
 * RBAC:
 * - ADMIN: Can update full workforce profile.
 * - TRAINEE: Can update only their own professional profile (qualifications, workExperience, interests, skills, certificates, bio).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const employeeId = params.id;
    const userRole = auth.user?.role;
    let userEmployeeId: string | null = auth.user?.employeeId ?? null;

    if (!userEmployeeId && userRole === "TRAINEE") {
      userEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);
    }

    if (userRole === "TRAINEE" && userEmployeeId !== employeeId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You only have permission to update your own profile." } },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validatedData: any;
    if (userRole === "TRAINEE") {
      const parsed = traineeProfileUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: parsed.error.issues[0]?.message || "Invalid profile update payload.",
              issues: parsed.error.issues,
            },
          },
          { status: 400 }
        );
      }
      // Strictly restrict to self-service fields
      validatedData = {
        qualifications: parsed.data.qualifications,
        workExperience: parsed.data.workExperience,
        interests: parsed.data.interests,
        skills: parsed.data.skills,
        certificates: parsed.data.certificates,
        bio: parsed.data.bio,
      };
    } else {
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
      validatedData = parsed.data;
    }

    const updaterName = auth.user?.name || (userRole === "TRAINEE" ? "Trainee" : "Administrator");
    const updated = await EmployeeService.updateEmployee(
      auth.organizationId!,
      employeeId,
      validatedData,
      updaterName,
      auth.userId,
      userRole
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
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
 * Two-Step Employee Deletion:
 * - Step 1 (Default): Soft-delete / deactivate employee (`status = INACTIVE`). Preserves all historical records.
 * - Step 2 (?permanent=true): Irreversible permanent deletion of employee and employee-owned records in a transaction.
 * RBAC: ADMIN only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const isPermanent = searchParams.get("permanent") === "true";

    if (isPermanent) {
      const result = await EmployeeService.permanentlyDeleteEmployee(
        auth.organizationId!,
        params.id,
        auth.userId,
        auth.user?.name,
        auth.user?.role
      );

      return NextResponse.json({
        success: true,
        message: "Employee permanently deleted successfully.",
        data: result.deletedEmployee,
      });
    }

    const employee = await EmployeeService.deactivateEmployee(
      auth.organizationId!,
      params.id,
      auth.userId,
      auth.user?.name,
      auth.user?.role
    );

    return NextResponse.json({
      success: true,
      message: "Employee removed successfully and moved to Removed Employees.",
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
      { error: { code: "INTERNAL_ERROR", message: "Failed to process employee deletion request." } },
      { status: 500 }
    );
  }
}