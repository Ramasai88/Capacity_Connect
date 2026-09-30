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

  it("authenticates TRAINER user (sarah.jenkins@capacityconnect.demo) against PostgreSQL and derives role from DB", async () => {
    const user = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "Trainer@123",
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Sarah Jenkins");
    expect(user?.role).toBe("TRAINER");
    expect(user?.organizationId).toBe(TEST_ORG_ID);
    expect((user as any)?.passwordHash).toBeUndefined();
  });

  it("authenticates TRAINEE user (ravi.kumar@capacityconnect.demo) and attaches database employee link", async () => {
    const user = await verifyUserCredentials({
      email: "ravi.kumar@capacityconnect.demo",
      password: "Trainee@123",
    });

    expect(user).not.toBeNull();
    expect(user?.name).toBe("Ravi Kumar");
    expect(user?.role).toBe("TRAINEE");
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

  it("populates JWT and Session objects for TRAINER", async () => {
    const user = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "Trainer@123",
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
    expect(session.user?.role).toBe("TRAINER");
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
    expect(isRouteAllowed("ADMIN", "/my-development")).toBe(false);
    expect(isRouteAllowed("ADMIN", "/my-learning")).toBe(false);
    expect(isRouteAllowed("ADMIN", "/courses")).toBe(true);
  });

  it("enforces TRAINER permissions correctly", () => {
    expect(hasPermission("TRAINER", "canAddEmployee")).toBe(false);
    expect(hasPermission("TRAINER", "canCreateCompetency")).toBe(false);
    expect(hasPermission("TRAINER", "canCreateDesignation")).toBe(false);
    expect(hasPermission("TRAINER", "canAccessSettings")).toBe(false);
    expect(hasPermission("TRAINER", "canReviewReassessments")).toBe(true);
    expect(hasPermission("TRAINER", "canCreateCourse")).toBe(true);
    expect(hasPermission("TRAINER", "canViewAllEmployees")).toBe(true);
    expect(isRouteAllowed("TRAINER", "/settings")).toBe(false);
    expect(isRouteAllowed("TRAINER", "/reassessments")).toBe(true);
    expect(isRouteAllowed("TRAINER", "/my-development")).toBe(false);
    expect(isRouteAllowed("TRAINER", "/my-learning")).toBe(false);
    expect(isRouteAllowed("TRAINER", "/courses")).toBe(true);
  });

  it("enforces TRAINEE permissions strictly", () => {
    expect(hasPermission("TRAINEE", "canAddEmployee")).toBe(false);
    expect(hasPermission("TRAINEE", "canEditEmployee")).toBe(false);
    expect(hasPermission("TRAINEE", "canCreateCompetency")).toBe(false);
    expect(hasPermission("TRAINEE", "canCreateDesignation")).toBe(false);
    expect(hasPermission("TRAINEE", "canCreateCourse")).toBe(false);
    expect(hasPermission("TRAINEE", "canReviewReassessments")).toBe(false);
    expect(hasPermission("TRAINEE", "canAccessSettings")).toBe(false);
    expect(isRouteAllowed("TRAINEE", "/settings")).toBe(false);
    expect(isRouteAllowed("TRAINEE", "/reassessments")).toBe(false);
    expect(isRouteAllowed("TRAINEE", "/employees")).toBe(false);
    expect(isRouteAllowed("TRAINEE", "/my-development")).toBe(true);
    expect(isRouteAllowed("TRAINEE", "/my-learning")).toBe(true);
    expect(isRouteAllowed("TRAINEE", "/courses")).toBe(true);
  });

  it("rejects unauthenticated API requests with 401 when no session is present", async () => {
    const result = await authenticateApi(["ADMIN"]);
    expect(result.authorized).toBe(false);
    expect(result.response?.status).toBe(401);
  });
});
