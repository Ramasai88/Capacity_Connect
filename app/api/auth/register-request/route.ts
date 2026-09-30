import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { signupSchema } from "@/lib/validations/auth";
import { AuditService } from "@/lib/services/audit.service";

/**
 * POST /api/auth/register-request
 *
 * Public endpoint for candidate users to submit an account registration request.
 *
 * Security & Lifecycle:
 * - Publicly accessible
 * - Role is strictly defaulted to TRAINEE (ignoring any client role override)
 * - Sets approvalStatus = PENDING, isActivated = false
 * - Does NOT dispatch activation tokens or activate account immediately
 * - Emits USER_APPROVAL_REQUESTED audit event
 */
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

    // Hash password with bcrypt (cost factor 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record in PENDING approval status with default TRAINEE role
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "TRAINEE",
        organizationId: organization.id,
        approvalStatus: "PENDING",
        isActivated: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActivated: true,
        organizationId: true,
        createdAt: true,
      },
    });

    await AuditService.log({
      organizationId: organization.id,
      actorName: newUser.name,
      action: "USER_APPROVAL_REQUESTED",
      category: "USER_MANAGEMENT",
      targetId: newUser.id,
      targetName: `${newUser.name} (${newUser.email})`,
      description: `Public registration request submitted by ${newUser.name} (${newUser.email}) awaiting administrator approval.`,
      metadata: { role: "TRAINEE", email: newUser.email, approvalStatus: "PENDING" },
    });

    return NextResponse.json(
      {
        message: "Registration request submitted successfully. Your account is pending administrator approval.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration request error:", error);

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process registration request.",
        },
      },
      { status: 500 }
    );
  }
}
