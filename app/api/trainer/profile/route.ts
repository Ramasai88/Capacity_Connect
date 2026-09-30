import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateTrainerProfileSchema = z.object({
  specializations: z.array(z.string()).optional(),
  teachingDomains: z.array(z.string()).optional(),
  bio: z.string().optional().nullable(),
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  department: z.string().trim().optional().nullable(),
});

/**
 * GET /api/trainer/profile
 * Trainer retrieves own profile.
 */
export async function GET(_request: NextRequest) {
  try {
    const auth = await authenticateApi(["TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    if (!trainerEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_TRAINER", message: "User is not linked to a trainer employee profile." } },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: trainerEmployeeId,
        organizationId: auth.organizationId!,
      },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        department: true,
        status: true,
        specializations: true,
        teachingDomains: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Trainer profile not found in your organization." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    if (error instanceof EmployeeServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/trainer/profile error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve trainer profile." } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/trainer/profile
 * Trainer updates own profile.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateApi(["TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    if (!trainerEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_TRAINER", message: "User is not linked to a trainer employee profile." } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = updateTrainerProfileSchema.parse(body);

    // Fix 2: correct argument order — updatedBy is a display name, actorUserId is the UUID
    await EmployeeService.updateEmployee(
      auth.organizationId!,
      trainerEmployeeId,
      validated,
      auth.user.name,   // updatedBy (display name for audit)
      auth.userId,      // actorUserId (UUID)
      auth.user.role    // actorRole
    );

    // Fix 3: EmployeeDetailResponse does not include trainer-specific fields.
    // Fetch them directly with an org-scoped query so the response is complete.
    const trainerProfile = await prisma.employee.findFirst({
      where: { id: trainerEmployeeId, organizationId: auth.organizationId! },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        department: true,
        status: true,
        specializations: true,
        teachingDomains: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: trainerProfile,
      message: "Trainer profile updated successfully.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.errors[0]?.message || "Validation failed", details: error.errors } },
        { status: 400 }
      );
    }
    if (error instanceof EmployeeServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("PUT /api/trainer/profile error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update trainer profile." } },
      { status: 500 }
    );
  }
}
