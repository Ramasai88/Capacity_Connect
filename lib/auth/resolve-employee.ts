import { prisma } from "@/lib/db/prisma";
import { AuthenticatedUser } from "./session";

/**
 * Resolves the linked employee ID for an authenticated user.
 * 1. Uses auth.user.employeeId if already populated on the session token.
 * 2. Queries PostgreSQL user.employeeId if not in JWT session.
 * 3. Self-healing fallback: Matches employee profile by email within the authenticated organization.
 */
export async function resolveEmployeeIdForUser(
  user: AuthenticatedUser,
  organizationId: string
): Promise<string | null> {
  if (user.employeeId) {
    return user.employeeId;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { employeeId: true, email: true },
  });

  if (dbUser?.employeeId) {
    return dbUser.employeeId;
  }

  // Self-healing: Match employee profile by email within the authenticated organization
  const email = (user.email || dbUser?.email || "").toLowerCase().trim();
  if (email && organizationId) {
    const matched = await prisma.employee.findFirst({
      where: {
        organizationId,
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (matched) {
      await prisma.user
        .update({
          where: { id: user.id },
          data: { employeeId: matched.id },
        })
        .catch((err) => console.warn("[resolveEmployeeIdForUser] Failed to persist linked employeeId:", err));
      return matched.id;
    }
  }

  return null;
}
