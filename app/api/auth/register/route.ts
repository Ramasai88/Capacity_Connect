import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: issue?.message || "Invalid registration data",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // In single-tenant architecture, assign new users to the primary organization.
    let organization = await prisma.organization.findFirst();

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          id: "org-kl-university",
          name: "Capacity Connect Enterprise",
          description: "Default Organization for Capacity Connect",
        },
      });
    }

    // Check for duplicate user email within the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        organizationId: organization.id,
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

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Atomic Transaction: Create Employee Profile + Create User + Link employeeId
    const { user } = await prisma.$transaction(async (tx) => {
      // 1. Check if Employee profile already exists with this email in the organization
      let employee = await tx.employee.findFirst({
        where: {
          email: normalizedEmail,
          organizationId: organization.id,
        },
      });

      // 2. If no Employee profile exists, create one for this new employee
      if (!employee) {
        const empCount = await tx.employee.count({ where: { organizationId: organization.id } });
        const candidateCode = `EMP-${String(empCount + 1).padStart(3, "0")}`;
        const existingCode = await tx.employee.findUnique({
          where: {
            organizationId_employeeCode: {
              organizationId: organization.id,
              employeeCode: candidateCode,
            },
          },
        });
        const employeeCode = existingCode ? `EMP-${Date.now().toString(36).toUpperCase()}` : candidateCode;

        employee = await tx.employee.create({
          data: {
            organizationId: organization.id,
            employeeCode,
            name: name.trim(),
            email: normalizedEmail,
            status: "ACTIVE",
          },
        });
      }

      // 3. Create User record with role EMPLOYEE and linked employeeId
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: "EMPLOYEE", // Always EMPLOYEE for public self-registration
          organizationId: organization.id,
          employeeId: employee.id,
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

      return { user: newUser, employee };
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process registration. Please verify database connectivity.",
        },
      },
      { status: 500 }
    );
  }
}
