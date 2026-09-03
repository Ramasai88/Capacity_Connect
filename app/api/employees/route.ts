import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";
import { createEmployeeSchema, employeeQuerySchema } from "@/lib/validations/employee";

/**
 * GET /api/employees
 * List employees with search, department, designation, and status filters.
 * RBAC: ADMIN and MANAGER can list all employees.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsedQuery = employeeQuerySchema.safeParse(queryParams);

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

    const result = await EmployeeService.getEmployees(auth.organizationId!, parsedQuery.data);

    return NextResponse.json({
      success: true,
      data: result.employees,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve employees list." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/employees
 * Create a new employee with optional initial competency baseline assessments.
 * RBAC: ADMIN only.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid employee data.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const creatorName = auth.user?.name || "Administrator";
    const employee = await EmployeeService.createEmployee(auth.organizationId!, parsed.data, creatorName);

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully.",
        data: employee,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof EmployeeServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error("POST /api/employees error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create employee record." } },
      { status: 500 }
    );
  }
}