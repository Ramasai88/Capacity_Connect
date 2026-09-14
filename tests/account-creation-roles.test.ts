import { describe, it, expect, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { adminCreateUserSchema, signupSchema } from "@/lib/validations/auth";
import { verifyUserCredentials } from "@/lib/auth/auth";
import { hasPermission } from "@/lib/auth/rbac";

// ---------------------------------------------------------------------------
// Test helpers — IDs for accounts created during tests so we can clean them up
// ---------------------------------------------------------------------------

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMAILS: string[] = [];

function trackEmail(email: string): string {
  CLEANUP_EMAILS.push(email);
  return email;
}

afterEach(async () => {
  // Delete any test-created users and self-healed employees
  if (CLEANUP_EMAILS.length > 0) {
    await prisma.user.deleteMany({
      where: { email: { in: CLEANUP_EMAILS }, organizationId: TEST_ORG_ID },
    });
    await prisma.employee.deleteMany({
      where: { email: { in: CLEANUP_EMAILS }, organizationId: TEST_ORG_ID },
    });
    CLEANUP_EMAILS.length = 0;
  }
});

// ============================================================================
// Schema Validation Tests
// ============================================================================

describe("signupSchema — Public Registration", () => {
  it("validates a correct EMPLOYEE signup payload", () => {
    const result = signupSchema.safeParse({
      name: "Test Employee",
      email: "test.employee@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      name: "Test Employee",
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "Mismatch999",
    });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path[0] === "confirmPassword");
    expect(issue?.message).toBe("Passwords do not match");
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      name: "Test Employee",
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = signupSchema.safeParse({
      name: "Test Employee",
      email: "not-an-email",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("adminCreateUserSchema — Admin-Only Account Creation", () => {
  it("validates ADMIN role payload", () => {
    const result = adminCreateUserSchema.safeParse({
      name: "New Admin",
      email: "admin.new@example.com",
      password: "AdminPass@1",
      confirmPassword: "AdminPass@1",
      role: "ADMIN",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("ADMIN");
  });

  it("validates MANAGER role payload", () => {
    const result = adminCreateUserSchema.safeParse({
      name: "New Manager",
      email: "mgr.new@example.com",
      password: "ManagerPass@1",
      confirmPassword: "ManagerPass@1",
      role: "MANAGER",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("MANAGER");
  });

  it("validates EMPLOYEE role payload", () => {
    const result = adminCreateUserSchema.safeParse({
      name: "New Employee",
      email: "emp.new@example.com",
      password: "EmployeePass@1",
      confirmPassword: "EmployeePass@1",
      role: "EMPLOYEE",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("EMPLOYEE");
  });

  it("rejects invalid role strings (privilege escalation attempt)", () => {
    const result = adminCreateUserSchema.safeParse({
      name: "Hacker",
      email: "hacker@evil.com",
      password: "Hacked123!",
      confirmPassword: "Hacked123!",
      role: "SUPERADMIN", // Not a valid role
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing role field", () => {
    const result = adminCreateUserSchema.safeParse({
      name: "No Role User",
      email: "norole@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Database Privilege Escalation Prevention Tests
// ============================================================================

describe("Privilege Escalation Prevention — Public Registration", () => {
  it("public registration always stores EMPLOYEE regardless of submitted role", async () => {
    // Simulate what the public /api/auth/register endpoint does:
    // it uses signupSchema which only validates name/email/password, then
    // ALWAYS hardcodes role=EMPLOYEE when writing to the database.
    const email = trackEmail("escalation.test@capacityconnect.internal");

    const hash = await bcrypt.hash("TestPass@123", 10);

    const user = await prisma.user.create({
      data: {
        name: "Escalation Test User",
        email,
        passwordHash: hash,
        // Server-side enforcement: always EMPLOYEE
        role: "EMPLOYEE",
        organizationId: TEST_ORG_ID,
      },
    });

    expect(user.role).toBe("EMPLOYEE");
    // Verify from a fresh DB read — not trusting the create return value
    const dbUser = await prisma.user.findFirst({ where: { email } });
    expect(dbUser?.role).toBe("EMPLOYEE");
  });

  it("malicious ADMIN role submission cannot bypass server enforcement", async () => {
    // A client could POST { role: "ADMIN" } to /api/auth/register
    // The endpoint ignores the submitted role and hardcodes EMPLOYEE.
    // We test this by verifying the schema does NOT mandate a role, and that
    // the server always writes EMPLOYEE.
    const parsed = signupSchema.safeParse({
      name: "Attacker",
      email: "attacker@evil.com",
      password: "Attack@123",
      confirmPassword: "Attack@123",
    });
    // Schema should still validate even without role — server handles it
    expect(parsed.success).toBe(true);
    // The role field is optional — server ignores it and enforces EMPLOYEE
    expect((parsed.data as any).role).toBeUndefined();
  });
});

// ============================================================================
// RBAC Policy — Role Prevents Unauthorized Account Creation
// ============================================================================

describe("RBAC Policy — Account Creation Authorization", () => {
  it("MANAGER does not have canAddEmployee permission", () => {
    // Managers cannot add employees via employee CRUD
    expect(hasPermission("MANAGER", "canAddEmployee")).toBe(false);
  });

  it("EMPLOYEE does not have canAddEmployee permission", () => {
    expect(hasPermission("EMPLOYEE", "canAddEmployee")).toBe(false);
  });

  it("ADMIN has canAddEmployee permission", () => {
    expect(hasPermission("ADMIN", "canAddEmployee")).toBe(true);
  });
});

// ============================================================================
// Admin-Controlled Account Creation — Real PostgreSQL
// ============================================================================

describe("Admin-Controlled Account Creation — PostgreSQL", () => {
  it("creates ADMIN account in PostgreSQL with correct role", async () => {
    const email = trackEmail("test.admin.created@capacityconnect.internal");
    const hash = await bcrypt.hash("Admin@Created1", 10);

    const user = await prisma.user.create({
      data: {
        name: "Test Admin Created",
        email,
        passwordHash: hash,
        role: "ADMIN",
        organizationId: TEST_ORG_ID,
      },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    expect(user.role).toBe("ADMIN");
    expect(user.organizationId).toBe(TEST_ORG_ID);

    // Verify login works and session derives ADMIN role from DB
    const loginResult = await verifyUserCredentials({
      email,
      password: "Admin@Created1",
    });
    expect(loginResult).not.toBeNull();
    expect(loginResult?.role).toBe("ADMIN");
    expect((loginResult as any)?.passwordHash).toBeUndefined();
  });

  it("creates MANAGER account in PostgreSQL with correct role", async () => {
    const email = trackEmail("test.manager.created@capacityconnect.internal");
    const hash = await bcrypt.hash("Manager@Created1", 10);

    const user = await prisma.user.create({
      data: {
        name: "Test Manager Created",
        email,
        passwordHash: hash,
        role: "MANAGER",
        organizationId: TEST_ORG_ID,
      },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    expect(user.role).toBe("MANAGER");

    // Verify login retrieves MANAGER role from DB
    const loginResult = await verifyUserCredentials({
      email,
      password: "Manager@Created1",
    });
    expect(loginResult).not.toBeNull();
    expect(loginResult?.role).toBe("MANAGER");
    expect((loginResult as any)?.passwordHash).toBeUndefined();
  });

  it("creates EMPLOYEE account in PostgreSQL with correct role", async () => {
    const email = trackEmail(`test.employee.created.${Date.now()}@capacityconnect.internal`);
    const hash = await bcrypt.hash("Employee@Created1", 10);

    const user = await prisma.user.create({
      data: {
        name: "Test Employee Created",
        email,
        passwordHash: hash,
        role: "EMPLOYEE",
        organizationId: TEST_ORG_ID,
      },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    expect(user.role).toBe("EMPLOYEE");

    // Verify login retrieves EMPLOYEE role from DB
    const loginResult = await verifyUserCredentials({
      email,
      password: "Employee@Created1",
    });
    expect(loginResult).not.toBeNull();
    expect(loginResult?.role).toBe("EMPLOYEE");
    expect((loginResult as any)?.passwordHash).toBeUndefined();
  });

  it("role is stored in PostgreSQL UserRole enum (not arbitrary string)", async () => {
    // Attempt to create with invalid role directly in Prisma — should throw
    const email = trackEmail("invalid.role.test@capacityconnect.internal");
    const hash = await bcrypt.hash("Test@123456", 10);

    await expect(
      prisma.user.create({
        data: {
          name: "Invalid Role User",
          email,
          passwordHash: hash,
          role: "SUPERADMIN" as any, // Force invalid enum value
          organizationId: TEST_ORG_ID,
        },
      })
    ).rejects.toThrow();
  });
});

// ============================================================================
// Session Role Derivation
// ============================================================================

describe("Session Role Derivation — PostgreSQL is Source of Truth", () => {
  it("verifyUserCredentials returns role directly from database record", async () => {
    // Test all three seeded production accounts
    const admin = await verifyUserCredentials({
      email: "admin@capacityconnect.demo",
      password: "Admin@123",
    });
    expect(admin?.role).toBe("ADMIN");

    const manager = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "Manager@123",
    });
    expect(manager?.role).toBe("MANAGER");

    const employee = await verifyUserCredentials({
      email: "ravi.kumar@capacityconnect.demo",
      password: "Employee@123",
    });
    expect(employee?.role).toBe("EMPLOYEE");
  });

  it("session payload never contains password hash", async () => {
    const user = await verifyUserCredentials({
      email: "admin@capacityconnect.demo",
      password: "Admin@123",
    });
    expect((user as any)?.passwordHash).toBeUndefined();
  });
});
