import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { isDemoMode } from "@/lib/demo/config";
import { DEMO_USERS } from "@/lib/demo/data";
import { AuditService } from "@/lib/services/audit.service";

export interface AuthenticatedUserPayload {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  organizationId: string;
  employeeId: string | null;
}

/**
 * Core authentication logic for credentials login.
 * Verifies email/password against PostgreSQL database using bcrypt hashing.
 * In DEMO_MODE=true, allows fallback for zero-dependency exploration.
 */
export async function verifyUserCredentials(
  credentials: unknown
): Promise<AuthenticatedUserPayload | null> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    return null;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // -----------------------------------------------------------------
  // DEMO MODE BYPASS: If explicitly in demo mode, authenticate against demo users
  // -----------------------------------------------------------------
  if (isDemoMode()) {
    if (normalizedEmail.includes("admin") || normalizedEmail === DEMO_USERS.admin.email) {
      return {
        id: DEMO_USERS.admin.id,
        name: DEMO_USERS.admin.name,
        email: DEMO_USERS.admin.email,
        role: DEMO_USERS.admin.role,
        organizationId: DEMO_USERS.admin.organizationId,
        employeeId: DEMO_USERS.admin.employeeId,
      };
    }

    if (normalizedEmail.includes("manager") || normalizedEmail === DEMO_USERS.manager.email) {
      return {
        id: DEMO_USERS.manager.id,
        name: DEMO_USERS.manager.name,
        email: DEMO_USERS.manager.email,
        role: DEMO_USERS.manager.role,
        organizationId: DEMO_USERS.manager.organizationId,
        employeeId: DEMO_USERS.manager.employeeId,
      };
    }

    if (
      normalizedEmail.includes("ravi") ||
      normalizedEmail.includes("employee") ||
      normalizedEmail === DEMO_USERS.employee.email
    ) {
      return {
        id: DEMO_USERS.employee.id,
        name: DEMO_USERS.employee.name,
        email: DEMO_USERS.employee.email,
        role: DEMO_USERS.employee.role,
        organizationId: DEMO_USERS.employee.organizationId,
        employeeId: DEMO_USERS.employee.employeeId,
      };
    }

    return {
      id: DEMO_USERS.admin.id,
      name: `${DEMO_USERS.admin.name} (${normalizedEmail})`,
      email: normalizedEmail,
      role: "ADMIN",
      organizationId: DEMO_USERS.admin.organizationId,
      employeeId: null,
    };
  }

  // -----------------------------------------------------------------
  // PRODUCTION / DATABASE MODE: Real Prisma + PostgreSQL authentication
  // -----------------------------------------------------------------
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      // Record failed authentication attempt without exposing sensitive details
      const primaryOrg = await prisma.organization.findFirst({ select: { id: true } });
      if (primaryOrg) {
        await AuditService.log({
          organizationId: primaryOrg.id,
          actorName: normalizedEmail,
          action: "AUTH_LOGIN_FAILURE",
          category: "AUTHENTICATION",
          status: "FAILURE",
          description: `Failed login attempt for email: ${normalizedEmail} (Account not found).`,
          metadata: { attemptedEmail: normalizedEmail },
        });
      }
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      await AuditService.log({
        organizationId: user.organizationId,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "AUTH_LOGIN_FAILURE",
        category: "AUTHENTICATION",
        status: "FAILURE",
        description: `Failed login attempt for user: ${user.name} (${user.email}) - Invalid password.`,
        metadata: { attemptedEmail: normalizedEmail },
      });
      return null;
    }

    // Check if user account has completed initial activation
    if (user.isActivated === false) {
      await AuditService.log({
        organizationId: user.organizationId,
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "AUTH_LOGIN_FAILURE",
        category: "AUTHENTICATION",
        status: "FAILURE",
        description: `Login rejected for user ${user.name} (${user.email}): Account has not been activated.`,
        metadata: { attemptedEmail: normalizedEmail, reason: "ACCOUNT_NOT_ACTIVATED" },
      });
      return null;
    }

    // Check if user is associated with a deactivated/removed employee
    if (user.role === "EMPLOYEE" || user.employeeId) {
      const emp = user.employeeId
        ? await prisma.employee.findUnique({ where: { id: user.employeeId } })
        : await prisma.employee.findFirst({
            where: {
              email: { equals: normalizedEmail, mode: "insensitive" },
              organizationId: user.organizationId,
            },
          });

      if (emp && emp.status === "INACTIVE") {
        await AuditService.log({
          organizationId: user.organizationId,
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          action: "AUTH_LOGIN_FAILURE",
          category: "AUTHENTICATION",
          status: "FAILURE",
          description: `Login rejected for user ${user.name} (${user.email}): Employee account is removed/deactivated.`,
          metadata: { attemptedEmail: normalizedEmail, reason: "ACCOUNT_INACTIVE" },
        });
        return null;
      }
    }

    // Update last login timestamp upon successful authentication
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    // Record successful authentication audit event
    await AuditService.log({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "AUTH_LOGIN_SUCCESS",
      category: "AUTHENTICATION",
      status: "SUCCESS",
      description: `User ${user.name} (${user.role}) successfully authenticated.`,
      metadata: { role: user.role, email: user.email },
    });

    let employeeId = user.employeeId ?? null;

    // Self-healing: if an EMPLOYEE user somehow lacks an employeeId, link or provision it
    if (user.role === "EMPLOYEE" && !employeeId) {
      let emp = await prisma.employee.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
          organizationId: user.organizationId,
        },
      });

      if (!emp) {
        try {
          const empCount = await prisma.employee.count({ where: { organizationId: user.organizationId } });
          const candidateCode = `EMP-${String(empCount + 1).padStart(3, "0")}`;
          emp = await prisma.employee.create({
            data: {
              organizationId: user.organizationId,
              employeeCode: candidateCode,
              name: user.name,
              email: normalizedEmail,
              status: "ACTIVE",
            },
          });
        } catch {
          const fallbackCode = `EMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          emp = await prisma.employee.create({
            data: {
              organizationId: user.organizationId,
              employeeCode: fallbackCode,
              name: user.name,
              email: normalizedEmail,
              status: "ACTIVE",
            },
          });
        }
      }

      employeeId = emp.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { employeeId },
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      employeeId,
    };
  } catch (dbError) {
    console.error("Database connection error during authentication:", dbError);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return verifyUserCredentials(credentials);
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
        token.employeeId = (user as any).employeeId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.name = (token.name as string) || session.user.name || "User";
        session.user.email = (token.email as string) || session.user.email || "";
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.employeeId = (token.employeeId as string | null) ?? null;
      }
      return session;
    },
  },
};
