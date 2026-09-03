import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { adminCreateUserSchema } from "@/lib/validations/auth";
import { authenticateApi } from "@/lib/auth/session";

/**
 * POST /api/users
 *
 * Admin-only endpoint to create user accounts with any role (ADMIN, MANAGER, or EMPLOYEE).
 *
 * Security & Data Model:
 * - Requires an authenticated ADMIN session (checked server-side via authenticateApi).
 * - Role is validated against the Prisma UserRole enum (ADMIN | MANAGER | EMPLOYEE).
 * - When role is EMPLOYEE, an Employee workforce profile is atomically created and linked via employeeId.
 * - When role is MANAGER or ADMIN, User is created without an Employee workforce profile (employeeId = null).
 * - Password is bcrypt-hashed with cost factor 10.
 * - Duplicate emails within the same organization are rejected with 409.
 */
export async function POST(request: Request) {
  // -------------------------------------------------------------------------
  // Step 1: Require authenticated ADMIN session
  // -------------------------------------------------------------------------
  const auth = await authenticateApi(["ADMIN"]);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { organizationId } = auth;

  try {
    const body = await request.json();
    const parsed = adminCreateUserSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: issue?.message || "Invalid user data",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // -----------------------------------------------------------------------
    // Step 2: Check for duplicate email within the organization
    // -----------------------------------------------------------------------
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: "insensitive" },
        organizationId: organizationId!,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_ALREADY_EXISTS",
            message: "An account with this email address already exists.",
          },
        },
        { status: 409 }
      );
    }

    // -----------------------------------------------------------------------
    // Step 3: Hash password and execute atomic creation transaction
    // -----------------------------------------------------------------------
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      let employeeId: string | null = null;

      // If creating an EMPLOYEE, provision/link an Employee workforce profile
      if (role === "EMPLOYEE") {
        let employee = await tx.employee.findFirst({
          where: {
            email: normalizedEmail,
            organizationId: organizationId!,
          },
        });

        if (!employee) {
          const empCount = await tx.employee.count({ where: { organizationId: organizationId! } });
          const candidateCode = `EMP-${String(empCount + 1).padStart(3, "0")}`;
          const existingCode = await tx.employee.findUnique({
            where: {
              organizationId_employeeCode: {
                organizationId: organizationId!,
                employeeCode: candidateCode,
              },
            },
          });
          const employeeCode = existingCode ? `EMP-${Date.now().toString(36).toUpperCase()}` : candidateCode;

          employee = await tx.employee.create({
            data: {
              organizationId: organizationId!,
              employeeCode,
              name: name.trim(),
              email: normalizedEmail,
              status: "ACTIVE",
            },
          });
        }

        employeeId = employee.id;
      }

      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role,
          organizationId: organizationId!,
          employeeId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
          employeeId: true,
          createdAt: true,
        },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        message: `Account created successfully with role ${role}.`,
        user,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Admin user creation error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create user account.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users
 *
 * Admin-only endpoint to list users in the organization.
 */
export async function GET() {
  const auth = await authenticateApi(["ADMIN"]);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { organizationId } = auth;

  try {
    const users = await prisma.user.findMany({
      where: { organizationId: organizationId! },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        employeeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin list users error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to list users." } },
      { status: 500 }
    );
  }
}
