import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateApi } from "@/lib/auth/session";
import { AuditService } from "@/lib/services/audit.service";
import { rejectUserSchema } from "@/lib/validations/auth";

/**
 * PATCH /api/users/[id]/reject
 *
 * Rejects a user account registration request.
 *
 * Security & Lifecycle:
 * - Admin only
 * - Organization isolation strictly enforced
 * - Rejects already rejected users with 400 ALREADY_REJECTED
 * - Sets approvalStatus = REJECTED, isActivated = false, and persists optional rejectionReason
 * - Audits the USER_REJECTED action
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
    let reason: string | undefined;
    try {
      const body = await request.json();
      const parsed = rejectUserSchema.safeParse(body);
      if (parsed.success) {
        reason = parsed.data.reason;
      }
    } catch {
      // Body is optional
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId: organizationId!,
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

    if (targetUser.approvalStatus === "REJECTED") {
      return NextResponse.json(
        {
          error: {
            code: "ALREADY_REJECTED",
            message: "This user account has already been rejected.",
          },
        },
        { status: 400 }
      );
    }

    const rejectionReason = reason || "Registration request rejected by administrator.";

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        approvalStatus: "REJECTED",
        rejectionReason,
        isActivated: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        rejectionReason: true,
        isActivated: true,
        organizationId: true,
        createdAt: true,
      },
    });

    await AuditService.log({
      organizationId: organizationId!,
      actorId: adminUserId,
      actorName: adminUser.name || adminUser.email,
      actorRole: adminUser.role,
      action: "USER_REJECTED",
      category: "USER_MANAGEMENT",
      targetId: updatedUser.id,
      targetName: `${updatedUser.name} (${updatedUser.email})`,
      description: `Administrator ${adminUser.name || adminUser.email} rejected user registration for ${updatedUser.name} (${updatedUser.email}). Reason: ${rejectionReason}`,
      metadata: {
        userId: updatedUser.id,
        role: updatedUser.role,
        approvalStatus: "REJECTED",
        reason: rejectionReason,
      },
    });

    return NextResponse.json({
      message: "User registration rejected successfully.",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("User rejection error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to reject user account.",
        },
      },
      { status: 500 }
    );
  }
}
