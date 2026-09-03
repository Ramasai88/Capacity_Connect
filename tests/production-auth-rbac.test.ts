import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { verifyUserCredentials, authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { hasPermission, isRouteAllowed } from "@/lib/auth/rbac";
import { authenticateApi } from "@/lib/auth/session";

const TEST_ORG_ID = "org-kl-university";

describe("Production Authentication & PostgreSQL User Verification", () => {
  it("authenticates ADMIN user (admin@capacityconnect.demo) against PostgreSQL with secure bcrypt password check", async () => {
    const user = await verifyUserCredentials({
      email: "admin@capacityconnect.demo",
      password: "Admin@123",
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Dr. K. Srinivas");
    expect(user?.email).toBe("admin@capacityconnect.demo");
    expect(user?.role).toBe("ADMIN");
    expect(user?.organizationId).toBe(TEST_ORG_ID);
    expect((user as any)?.passwordHash).toBeUndefined();
  });

  it("authenticates secondary ADMIN user (admin@klu.edu) against PostgreSQL", async () => {
    const user = await verifyUserCredentials({
      email: "admin@klu.edu",
      password: "Admin@123",
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe("admin@klu.edu");
    expect(user?.role).toBe("ADMIN");
    expect(user?.organizationId).toBe(TEST_ORG_ID);
  });

  it("authenticates MANAGER user (sarah.jenkins@capacityconnect.demo) against PostgreSQL and derives role from DB", async () => {
    const user = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "Manager@123",
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Sarah Jenkins");
    expect(user?.role).toBe("MANAGER");
    expect(user?.organizationId).toBe(TEST_ORG_ID);
    expect((user as any)?.passwordHash).toBeUndefined();
  });

  it("authenticates EMPLOYEE user (ravi.kumar@capacityconnect.demo) and attaches database employee link", async () => {
    const user = await verifyUserCredentials({
      email: "ravi.kumar@capacityconnect.demo",
      password: "Employee@123",
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Ravi Kumar");
    expect(user?.role).toBe("EMPLOYEE");
    expect(user?.employeeId).toBe("emp-1");
    expect(user?.organizationId).toBe(TEST_ORG_ID);
    expect((user as any)?.passwordHash).toBeUndefined();
  });

  it("rejects login with incorrect password", async () => {
    const user = await verifyUserCredentials({
      email: "admin@capacityconnect.demo",
      password: "WrongPassword999",
    });

    expect(user).toBeNull();
  });

  it("rejects login with non-existent email", async () => {
    const user = await verifyUserCredentials({
      email: "unknown.user@doesnotexist.demo",
      password: "SomePassword123",
    });

    expect(user).toBeNull();
  });

  it("handles case-insensitive email normalization", async () => {
    const user = await verifyUserCredentials({
      email: "ADMIN@CapacityConnect.DEMO",
      password: "Admin@123",
    });

    expect(user).not.toBeNull();
    expect(user?.role).toBe("ADMIN");
  });

  it("verifies bcrypt hashes stored in PostgreSQL are cryptographically valid", async () => {
    const dbUser = await prisma.user.findFirst({
      where: { email: "admin@capacityconnect.demo" },
    });

    expect(dbUser).not.toBeNull();
    expect(dbUser?.passwordHash.startsWith("$2a$") || dbUser?.passwordHash.startsWith("$2b$")).toBe(true);

    const matches = await bcrypt.compare("Admin@123", dbUser!.passwordHash);
    expect(matches).toBe(true);

    const fails = await bcrypt.compare("BadPassword", dbUser!.passwordHash);
    expect(fails).toBe(false);
  });
});

describe("NextAuth JWT & Session Callbacks Verification", () => {
  it("populates JWT and Session objects with user name, email, and database role for ADMIN", async () => {
    const user = await verifyUserCredentials({
      email: "admin@capacityconnect.demo",
      password: "Admin@123",
    });
    expect(user).not.toBeNull();

    const jwtCallback = authOptions.callbacks!.jwt!;
    const token = await jwtCallback({
      token: {},
      user: user as any,
      account: null as any,
    });

    expect(token.userId).toBe(user!.id);
    expect(token.name).toBe("Dr. K. Srinivas");
    expect(token.email).toBe("admin@capacityconnect.demo");
    expect(token.role).toBe("ADMIN");
    expect(token.organizationId).toBe(TEST_ORG_ID);

    const sessionCallback = authOptions.callbacks!.session!;
    const session = await sessionCallback({
      session: { user: {} as any, expires: "" },
      token,
      user: user as any,
      newSession: undefined,
      trigger: undefined as any,
    });

    expect(session.user?.id).toBe(user!.id);
    expect(session.user?.name).toBe("Dr. K. Srinivas");
    expect(session.user?.email).toBe("admin@capacityconnect.demo");
    expect(session.user?.role).toBe("ADMIN");
    expect(session.user?.organizationId).toBe(TEST_ORG_ID);
  });

  it("populates JWT and Session objects for MANAGER", async () => {
    const user = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "Manager@123",
    });
    expect(user).not.toBeNull();

    const token = await authOptions.callbacks!.jwt!({
      token: {},
      user: user as any,
      account: null as any,
    });

    const session = await authOptions.callbacks!.session!({
      session: { user: {} as any, expires: "" },
      token,
      user: user as any,
      newSession: undefined,
      trigger: undefined as any,
    });

    expect(session.user?.name).toBe("Sarah Jenkins");
    expect(session.user?.role).toBe("MANAGER");
  });
});

describe("Server-Side RBAC Authorization Matrix", () => {
  it("enforces ADMIN permissions correctly", () => {
    expect(hasPermission("ADMIN", "canAddEmployee")).toBe(true);
    expect(hasPermission("ADMIN", "canEditEmployee")).toBe(true);
    expect(hasPermission("ADMIN", "canCreateCompetency")).toBe(true);
    expect(hasPermission("ADMIN", "canCreateDesignation")).toBe(true);
    expect(hasPermission("ADMIN", "canAccessSettings")).toBe(true);
    expect(hasPermission("ADMIN", "canReviewReassessments")).toBe(true);
    expect(isRouteAllowed("ADMIN", "/settings")).toBe(true);
  });

  it("enforces MANAGER permissions correctly", () => {
    expect(hasPermission("MANAGER", "canAddEmployee")).toBe(false);
    expect(hasPermission("MANAGER", "canCreateCompetency")).toBe(false);
    expect(hasPermission("MANAGER", "canCreateDesignation")).toBe(false);
    expect(hasPermission("MANAGER", "canAccessSettings")).toBe(false);
    expect(hasPermission("MANAGER", "canReviewReassessments")).toBe(true);
    expect(hasPermission("MANAGER", "canCreateCourse")).toBe(true);
    expect(hasPermission("MANAGER", "canViewAllEmployees")).toBe(true);
    expect(isRouteAllowed("MANAGER", "/settings")).toBe(false);
    expect(isRouteAllowed("MANAGER", "/reassessments")).toBe(true);
  });

  it("enforces EMPLOYEE permissions strictly", () => {
    expect(hasPermission("EMPLOYEE", "canAddEmployee")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canEditEmployee")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canCreateCompetency")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canCreateDesignation")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canCreateCourse")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canReviewReassessments")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canAccessSettings")).toBe(false);
    expect(isRouteAllowed("EMPLOYEE", "/settings")).toBe(false);
    expect(isRouteAllowed("EMPLOYEE", "/reassessments")).toBe(false);
    expect(isRouteAllowed("EMPLOYEE", "/employees")).toBe(false);
  });

  it("rejects unauthenticated API requests with 401 when no session is present", async () => {
    const result = await authenticateApi(["ADMIN"]);
    expect(result.authorized).toBe(false);
    expect(result.response?.status).toBe(401);
  });
});
