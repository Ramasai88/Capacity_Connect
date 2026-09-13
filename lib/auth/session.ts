import { getServerSession, type Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/auth";
import { isDemoMode } from "@/lib/demo/config";
import { DEMO_ORGANIZATION } from "@/lib/demo/data";

export type AllowedRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: AllowedRole;
  organizationId: string;
  employeeId: string | null;
}

export type ApiAuthResult =
  | {
      authorized: true;
      user: AuthenticatedUser;
      userId: string;
      organizationId: string;
      response?: never;
    }
  | {
      authorized: false;
      user?: never;
      userId?: never;
      organizationId?: never;
      response: NextResponse;
    };

/**
 * Reads the current session on the server. Returns null when unauthenticated.
 */
export async function getCurrentSession(): Promise<Session | null> {
  try {
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}

/**
 * Validates authentication and role-based access for Next.js Route Handlers.
 * In real database mode (DEMO_MODE=false), strictly requires valid NextAuth session
 * and validates server-side RBAC against PostgreSQL user role.
 */
export async function authenticateApi(
  allowedRoles?: AllowedRole[]
): Promise<ApiAuthResult> {
  const session = await getCurrentSession();

  // In Demo Mode only (zero-dependency prototype), permit fallback
  if (isDemoMode()) {
    const role: AllowedRole = (session?.user?.role as AllowedRole) || "ADMIN";
    if (allowedRoles && !allowedRoles.includes(role)) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to perform this action.",
            },
          },
          { status: 403 }
        ),
      };
    }
    const user: AuthenticatedUser = {
      id: session?.user?.id || "demo-user",
      name: session?.user?.name || "Demo User",
      email: session?.user?.email || "admin@capacityconnect.demo",
      role,
      organizationId: session?.user?.organizationId || DEMO_ORGANIZATION.id,
      employeeId: (session?.user as any)?.employeeId || null,
    };
    return {
      authorized: true,
      user,
      userId: user.id,
      organizationId: session?.user?.organizationId || DEMO_ORGANIZATION.id,
    };
  }

  // -------------------------------------------------------------------------
  // REAL PRODUCTION / DATABASE MODE: Enforce Strict Session & RBAC
  // -------------------------------------------------------------------------
  if (!session || !session.user || !session.user.organizationId) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: {
            code: "UNAUTHENTICATED",
            message: "Authentication required. Please sign in to access this resource.",
          },
        },
        { status: 401 }
      ),
    };
  }

  const role = session.user.role as AllowedRole;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: `Forbidden. Role '${role}' lacks permission for this operation.`,
          },
        },
        { status: 403 }
      ),
    };
  }

  const user: AuthenticatedUser = {
    id: session.user.id,
    name: session.user.name || "User",
    email: session.user.email || "",
    role,
    organizationId: session.user.organizationId,
    employeeId: (session.user as any).employeeId || null,
  };

  return {
    authorized: true,
    user,
    userId: user.id,
    organizationId: session.user.organizationId,
  };
}

/**
 * Throws if there is no authenticated session.
 */
export async function requireSession() {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

/**
 * Throws if the current session's role is not one of `roles`.
 */
export async function requireRole(roles: AllowedRole[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role as AllowedRole)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
