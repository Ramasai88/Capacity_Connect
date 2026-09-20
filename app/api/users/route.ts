import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { adminCreateUserSchema } from "@/lib/validations/auth";
import { authenticateApi } from "@/lib/auth/session";
import { AuditService } from "@/lib/services/audit.service";
import { ActivationService } from "@/lib/services/activation.service";
import { EmailService } from "@/lib/services/email.service";
import { RoleLearningService } from "@/lib/services/role-learning.service";

/**
 * POST /api/users
 *
 * Admin-only endpoint to create user accounts with any role (ADMIN, MANAGER, or EMPLOYEE).
 *
 * Security & Data Model:
 * - Requires an authenticated ADMIN session (checked server-side via authenticateApi).
 * - Role is validated against the Prisma UserRole enum (ADMIN | MANAGER | EMPLOYEE).
 * - When role is EMPLOYEE:
 *   - Direct password setup by admin is bypassed.
 *   - Account is created in an unactivated state (isActivated = false) with a locked password placeholder.
 *   - An Employee workforce profile is atomically created and linked via employeeId.
 *   - A secure one-time activation token is generated.
 *   - An activation email is dispatched to the employee with their Employee ID and setup link.
 * - When role is MANAGER or ADMIN:
 *   - Password is required, validated, and bcrypt-hashed with cost factor 10.
 *   - User is created directly activated (isActivated = true) without an Employee workforce profile (employeeId = null).
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

    const { name, email, password, role, designationId } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // -----------------------------------------------------------------------
    // Step 2: Validate designation if provided or creating an EMPLOYEE
    // -----------------------------------------------------------------------
    let validatedDesignationId: string | null = null;
    if (designationId) {
      const designation = await prisma.designation.findFirst({
        where: {
          id: designationId,
          organizationId: organizationId!,
        },
      });

      if (!designation) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_DESIGNATION",
              message: "The specified designation does not exist in your organization.",
            },
          },
          { status: 400 }
        );
      }
      validatedDesignationId = designation.id;
    } else if (role === "EMPLOYEE") {
      const defaultDesig = await prisma.designation.findFirst({
        where: { organizationId: organizationId! },
        orderBy: { title: "asc" },
      });
      validatedDesignationId = defaultDesig?.id ?? null;
    }

    // -----------------------------------------------------------------------
    // Step 3: Check for duplicate email within the organization
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
    // Step 4: Handle password & activation branching by role
    // -----------------------------------------------------------------------
    const isEmployee = role === "EMPLOYEE";
    let passwordHash: string;
    let isActivated: boolean;

    if (isEmployee) {
      passwordHash = `$2a$10$LOCKED_UNACTIVATED_${crypto.randomBytes(16).toString("hex")}`;
      isActivated = false;
    } else {
      passwordHash = await bcrypt.hash(password!, 10);
      isActivated = true;
    }

    let rawActivationToken: string | null = null;
    let assignedEmployeeCode: string | null = null;

    const user = await prisma.$transaction(
      async (tx) => {
        let employeeId: string | null = null;

        // If creating an EMPLOYEE, provision/link an Employee workforce profile
        if (isEmployee) {
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
            const employeeCode = existingCode
              ? `EMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
              : candidateCode;

            employee = await tx.employee.create({
              data: {
                organizationId: organizationId!,
                employeeCode,
                name: name.trim(),
                email: normalizedEmail,
                designationId: validatedDesignationId,
                status: "ACTIVE",
              },
            });
          } else if (validatedDesignationId && employee.designationId !== validatedDesignationId) {
            employee = await tx.employee.update({
              where: { id: employee.id },
              data: { designationId: validatedDesignationId },
            });
          }

          employeeId = employee.id;
          assignedEmployeeCode = employee.employeeCode;

          // Auto-assign role-relevant courses into CourseEnrollment
          if (employee.designationId) {
            await RoleLearningService.syncEmployeeRoleCourseEnrollments(
              organizationId!,
              employee.id,
              employee.designationId,
              tx
            );
          }
        }

        const newUser = await tx.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role,
            organizationId: organizationId!,
            employeeId,
            isActivated,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActivated: true,
            organizationId: true,
            employeeId: true,
            lastLoginAt: true,
            createdAt: true,
          },
        });

        // If creating an unactivated EMPLOYEE, generate a secure one-time activation token
        if (isEmployee && employeeId) {
          const tokenResult = await ActivationService.createToken(
            {
              userId: newUser.id,
              employeeId,
              organizationId: organizationId!,
            },
            tx
          );
          rawActivationToken = tokenResult.rawToken;
        }

        return newUser;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // -----------------------------------------------------------------------
    // Step 5: Send Activation Email for Employees post-transaction commit
    // -----------------------------------------------------------------------
    let emailDeliveryResult: {
      success: boolean;
      simulated?: boolean;
      activationUrl?: string;
      error?: string;
    } | null = null;

    if (isEmployee && rawActivationToken) {
      try {
        const org = await prisma.organization.findUnique({
          where: { id: organizationId! },
          select: { name: true },
        });

        let employeeRole = "Employee";
        if (user.employeeId) {
          const emp = await prisma.employee.findUnique({
            where: { id: user.employeeId },
            include: { designation: { select: { title: true } } },
          });
          if (emp?.designation?.title) {
            employeeRole = emp.designation.title;
          }
        }

        emailDeliveryResult = await EmailService.sendActivationEmail({
          recipientEmail: normalizedEmail,
          recipientName: user.name.trim(),
          employeeCode: assignedEmployeeCode || undefined,
          role: employeeRole,
          rawToken: rawActivationToken,
          organizationName: org?.name,
        });
      } catch (emailErr) {
        console.error("Failed to send employee activation email from /api/users:", emailErr);
      }
    }

    await AuditService.log({
      organizationId: organizationId!,
      actorId: auth.userId,
      actorName: auth.user.name || auth.user.email,
      actorRole: auth.user.role,
      action: "USER_CREATED",
      category: "USER_MANAGEMENT",
      targetId: user.id,
      targetName: `${user.name} (${user.email})`,
      description: isEmployee
        ? `Administrator ${auth.user.name || auth.user.email} provisioned employee account for ${user.name} (${user.email}) and dispatched an email activation link.`
        : `Administrator ${auth.user.name || auth.user.email} provisioned new ${role} account for ${user.name} (${user.email}).`,
      metadata: { role, email: user.email, designationId: validatedDesignationId, isActivated },
    });

    // Determine response message and development fallback link
    const isDevFallback =
      isEmployee &&
      process.env.NODE_ENV !== "production" &&
      Boolean(emailDeliveryResult?.simulated && emailDeliveryResult?.activationUrl);

    let responseMessage: string;
    if (isEmployee) {
      if (emailDeliveryResult?.success && !emailDeliveryResult?.simulated) {
        responseMessage = `Employee account provisioned for ${user.name}. An activation email has been dispatched with their setup link.`;
      } else if (isDevFallback) {
        responseMessage = `Employee account created successfully. Email delivery is not configured (Development Mode). Development activation link is available for testing.`;
      } else {
        responseMessage = `Employee account provisioned for ${user.name}. Notice: SMTP email delivery is not configured.`;
      }
    } else {
      responseMessage = `Account created successfully with role ${role}.`;
    }

    return NextResponse.json(
      {
        message: responseMessage,
        user,
        ...(isDevFallback ? { developmentActivationLink: emailDeliveryResult!.activationUrl } : {}),
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
        isActivated: true,
        organizationId: true,
        employeeId: true,
        lastLoginAt: true,
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
