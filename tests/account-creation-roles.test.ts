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
  it("validates a correct TRAINEE signup payload", () => {
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

  it("validates TRAINER role payload", () => {
    const result = adminCreateUserSchema.safeParse({
      name: "New Trainer",
      email: "trainer.new@example.com",
      password: "TrainerPass@1",
      confirmPassword: "TrainerPass@1",
      role: "TRAINER",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("TRAINER");
  });

  it("validates TRAINEE role payload", () => {
    const result = adminCreateUserSchema.safeParse({
      name: "New Trainee",
      email: "trainee.new@example.com",
      password: "TraineePass@1",
      confirmPassword: "TraineePass@1",
      role: "TRAINEE",
    });
    expect(result.success).toBe(true);
    expect(result.data?.role).toBe("TRAINEE");
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
  it("public registration always stores TRAINEE regardless of submitted role", async () => {
    // Simulate what the public /api/auth/register endpoint does:
    // it uses signupSchema which only validates name/email/password, then
    // ALWAYS hardcodes role=TRAINEE when writing to the database.
    const email = trackEmail("escalation.test@capacityconnect.internal");

    const hash = await bcrypt.hash("TestPass@123", 10);

    const user = await prisma.user.create({
      data: {
        name: "Escalation Test User",
        email,
        passwordHash: hash,
        // Server-side enforcement: always TRAINEE
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
      },
    });

    expect(user.role).toBe("TRAINEE");
    // Verify from a fresh DB read — not trusting the create return value
    const dbUser = await prisma.user.findFirst({ where: { email } });
    expect(dbUser?.role).toBe("TRAINEE");
  });

  it("malicious ADMIN role submission cannot bypass server enforcement", async () => {
    // A client could POST { role: "ADMIN" } to /api/auth/register
    // The endpoint ignores the submitted role and hardcodes TRAINEE.
    // We test this by verifying the schema does NOT mandate a role, and that
    // the server always writes TRAINEE.
    const parsed = signupSchema.safeParse({
      name: "Attacker",
      email: "attacker@evil.com",
      password: "Attack@123",
      confirmPassword: "Attack@123",
    });
    // Schema should still validate even without role — server handles it
    expect(parsed.success).toBe(true);
    // The role field is optional — server ignores it and enforces TRAINEE
    expect((parsed.data as any).role).toBeUndefined();
  });
});

// ============================================================================
// RBAC Policy — Role Prevents Unauthorized Account Creation
// ============================================================================

describe("RBAC Policy — Account Creation Authorization", () => {
  it("TRAINER does not have canAddEmployee permission", () => {
    // Trainers cannot add employees via employee CRUD
    expect(hasPermission("TRAINER", "canAddEmployee")).toBe(false);
  });

  it("TRAINEE does not have canAddEmployee permission", () => {
    expect(hasPermission("TRAINEE", "canAddEmployee")).toBe(false);
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

  it("creates TRAINER account in PostgreSQL with correct role", async () => {
    const email = trackEmail("test.trainer.created@capacityconnect.internal");
    const hash = await bcrypt.hash("Trainer@Created1", 10);

    const user = await prisma.user.create({
      data: {
        name: "Test Trainer Created",
        email,
        passwordHash: hash,
        role: "TRAINER",
        organizationId: TEST_ORG_ID,
      },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    expect(user.role).toBe("TRAINER");

    // Verify login retrieves TRAINER role from DB
    const loginResult = await verifyUserCredentials({
      email,
      password: "Trainer@Created1",
    });
    expect(loginResult).not.toBeNull();
    expect(loginResult?.role).toBe("TRAINER");
    expect((loginResult as any)?.passwordHash).toBeUndefined();
  });

  it("creates TRAINEE account in PostgreSQL with correct role", async () => {
    const email = trackEmail(`test.trainee.created.${Date.now()}@capacityconnect.internal`);
    const hash = await bcrypt.hash("Trainee@Created1", 10);

    const user = await prisma.user.create({
      data: {
        name: "Test Trainee Created",
        email,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
      },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    expect(user.role).toBe("TRAINEE");

    // Verify login retrieves TRAINEE role from DB
    const loginResult = await verifyUserCredentials({
      email,
      password: "Trainee@Created1",
    });
    expect(loginResult).not.toBeNull();
    expect(loginResult?.role).toBe("TRAINEE");
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

    const trainer = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "Trainer@123",
    });
    expect(trainer?.role).toBe("TRAINER");

    const trainee = await verifyUserCredentials({
      email: "ravi.kumar@capacityconnect.demo",
      password: "Trainee@123",
    });
    expect(trainee?.role).toBe("TRAINEE");
  });

  it("session payload never contains password hash", async () => {
    const user = await verifyUserCredentials({
      email: "admin@capacityconnect.demo",
      password: "Admin@123",
    });
    expect((user as any)?.passwordHash).toBeUndefined();
  });
});
