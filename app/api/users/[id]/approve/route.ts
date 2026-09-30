import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateApi } from "@/lib/auth/session";
import { AuditService } from "@/lib/services/audit.service";
import { ActivationService } from "@/lib/services/activation.service";
import { EmailService } from "@/lib/services/email.service";

/**
 * PATCH /api/users/[id]/approve
 *
 * Approves a user account currently in PENDING status.
 *
 * Security & Lifecycle:
 * - Admin only
 * - Organization isolation strictly enforced
 * - Rejects already approved users with 400 ALREADY_APPROVED
 * - For TRAINEE accounts without an linked Employee profile:
 *   - Creates workforce Employee record
 *   - Generates one-time activation token
 *   - Dispatches activation email
 * - Audits the USER_APPROVED action
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApi(["ADMIN"]);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { organizationId, userId: adminUserId, user: adminUser } = auth;
  const targetUserId = params.id;

  if (!targetUserId) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_USER_ID",
          message: "Target user ID is required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId: organizationId!,
      },
      include: {
        employee: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_NOT_FOUND",
            message: "User account not found within your organization.",
          },
        },
        { status: 404 }
      );
    }

    if (targetUser.approvalStatus === "APPROVED") {
      return NextResponse.json(
        {
          error: {
            code: "ALREADY_APPROVED",
            message: "This user account is already approved.",
          },
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let linkedEmployeeId = targetUser.employeeId;

      // If user is a TRAINEE and does not have an employee profile yet, create one
      if (targetUser.role === "TRAINEE" && !linkedEmployeeId) {
        let employee = await tx.employee.findFirst({
          where: {
            email: targetUser.email.toLowerCase().trim(),
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
              name: targetUser.name,
              email: targetUser.email.toLowerCase().trim(),
              status: "ACTIVE",
            },
          });
        }

        linkedEmployeeId = employee.id;
      }

      // Update user approval status to APPROVED
      const updatedUser = await tx.user.update({
        where: { id: targetUser.id },
        data: {
          approvalStatus: "APPROVED",
          rejectionReason: null,
          employeeId: linkedEmployeeId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          approvalStatus: true,
          isActivated: true,
          employeeId: true,
          organizationId: true,
          createdAt: true,
        },
      });

      // If account is not yet activated and has an employeeId, generate activation token
      let activationDetails: { rawToken: string; expiresAt: Date } | null = null;
      if (!updatedUser.isActivated && linkedEmployeeId) {
        activationDetails = await ActivationService.createToken(
          {
            userId: updatedUser.id,
            employeeId: linkedEmployeeId,
            organizationId: organizationId!,
          },
          tx
        );
      }

      return { updatedUser, activationDetails, linkedEmployeeId };
    });

    // Send activation email asynchronously if token was created
    if (result.activationDetails && result.linkedEmployeeId) {
      try {
        const emp = await prisma.employee.findUnique({
          where: { id: result.linkedEmployeeId },
          select: { employeeCode: true },
        });

        await EmailService.sendActivationEmail({
          recipientEmail: result.updatedUser.email,
          recipientName: result.updatedUser.name,
          employeeCode: emp?.employeeCode || "N/A",
          rawToken: result.activationDetails.rawToken,
        });
      } catch (emailErr) {
        console.warn("Failed to dispatch activation email on user approval:", emailErr);
      }
    }

    await AuditService.log({
      organizationId: organizationId!,
      actorId: adminUserId,
      actorName: adminUser.name || adminUser.email,
      actorRole: adminUser.role,
      action: "USER_APPROVED",
      category: "USER_MANAGEMENT",
      targetId: result.updatedUser.id,
      targetName: `${result.updatedUser.name} (${result.updatedUser.email})`,
      description: `Administrator ${adminUser.name || adminUser.email} approved user registration for ${result.updatedUser.name} (${result.updatedUser.email}).`,
      metadata: {
        userId: result.updatedUser.id,
        role: result.updatedUser.role,
        approvalStatus: "APPROVED",
      },
    });

    return NextResponse.json({
      message: "User approved successfully.",
      user: result.updatedUser,
    });
  } catch (error: unknown) {
    console.error("User approval error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to approve user account.",
        },
      },
      { status: 500 }
    );
  }
}
