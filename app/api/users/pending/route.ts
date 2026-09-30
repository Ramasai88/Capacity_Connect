import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { authenticateApi } from "@/lib/auth/session";

/**
 * GET /api/users/pending
 *
 * Retrieves all user accounts within the administrator's organization
 * that are currently in PENDING approval status.
 *
 * Security:
 * - Requires authenticated ADMIN session
 * - Strict multi-tenant organization scoping
 */
export async function GET() {
  const auth = await authenticateApi(["ADMIN"]);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { organizationId } = auth;

  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        organizationId: organizationId!,
        approvalStatus: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActivated: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      pendingUsers,
      count: pendingUsers.length,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch pending users:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch pending user registrations.",
        },
      },
      { status: 500 }
    );
  }
}
