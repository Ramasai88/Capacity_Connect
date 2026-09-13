import { describe, it, expect, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as createUserHandler, GET as getUsersHandler } from "@/app/api/users/route";
import { GET as getAuditLogsHandler } from "@/app/api/admin/audit-logs/route";
import { GET as getManagerActivityHandler } from "@/app/api/admin/manager-activity/route";
import { AuditService } from "@/lib/services/audit.service";
import { verifyUserCredentials } from "@/lib/auth/auth";
import { adminCreateUserSchema, signupSchema } from "@/lib/validations/auth";
import { NextRequest } from "next/server";

vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMAILS: string[] = [];

function trackEmail(email: string): string {
  CLEANUP_EMAILS.push(email);
  return email;
}

afterEach(async () => {
  vi.mocked(getServerSession).mockReset();
  if (CLEANUP_EMAILS.length > 0) {
    await prisma.user.deleteMany({
      where: { email: { in: CLEANUP_EMAILS } },
    });
    CLEANUP_EMAILS.length = 0;
  }
});

function createMockRequest(url: string, method: string, body?: any): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Security Enhancement — Account Provisioning & Registration Lockdown", () => {
  describe("POST /api/auth/register Lockdown", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = createMockRequest("http://localhost:3000/api/auth/register", "POST", {
        name: "Self Registered User",
        email: "self.reg@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("rejects EMPLOYEE requests with 403 Forbidden", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "emp-user-1",
          name: "Ravi Kumar",
          email: "ravi.kumar@capacityconnect.demo",
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      const req = createMockRequest("http://localhost:3000/api/auth/register", "POST", {
        name: "Attacker Created User",
        email: "attacker.created@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error.code).toBe("FORBIDDEN");
    });

    it("rejects MANAGER requests with 403 Forbidden", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "mgr-user-1",
          name: "Sarah Jenkins",
          email: "sarah.jenkins@capacityconnect.demo",
          role: "MANAGER",
          organizationId: TEST_ORG_ID,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      const req = createMockRequest("http://localhost:3000/api/auth/register", "POST", {
        name: "Manager Created User",
        email: "manager.created@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(403);
    });

    it("allows ADMIN to provision an account and logs the audit event", async () => {
      const testEmail = trackEmail(`admin.provisioned.${Date.now()}@capacityconnect.internal`);
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "admin-user-1",
          name: "Dr. K. Srinivas",
          email: "admin@capacityconnect.demo",
          role: "ADMIN",
          organizationId: TEST_ORG_ID,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      const req = createMockRequest("http://localhost:3000/api/auth/register", "POST", {
        name: "Provisioned Employee",
        email: testEmail,
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
        role: "EMPLOYEE",
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      expect(data.user.role).toBe("EMPLOYEE");
      // Password must NEVER be returned
      expect(data.user.password).toBeUndefined();
      expect(data.user.passwordHash).toBeUndefined();

      // Verify audit log entry was created
      const auditEntry = await prisma.auditLog.findFirst({
        where: { targetId: data.user.id, action: "USER_CREATED" },
      });
      expect(auditEntry).toBeDefined();
      expect(auditEntry?.actorRole).toBe("ADMIN");
      expect(auditEntry?.category).toBe("USER_MANAGEMENT");
    });
  });

  describe("POST /api/users Direct API Lockdown", () => {
    it("rejects unauthenticated user creation with 401", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = createMockRequest("http://localhost:3000/api/users", "POST", {
        name: "Direct API Hacker",
        email: "hacker@test.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "ADMIN",
      });

      const res = await createUserHandler(req);
      expect(res.status).toBe(401);
    });

    it("rejects MANAGER attempting to create an ADMIN account with 403", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "mgr-user-1",
          name: "Sarah Jenkins",
          email: "sarah.jenkins@capacityconnect.demo",
          role: "MANAGER",
          organizationId: TEST_ORG_ID,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      const req = createMockRequest("http://localhost:3000/api/users", "POST", {
        name: "Privilege Escalator",
        email: "escalation@test.com",
        password: "Password123!",
        confirmPassword: "Password123!",
        role: "ADMIN",
      });

      const res = await createUserHandler(req);
      expect(res.status).toBe(403);
    });

    it("allows ADMIN to create MANAGER in their organization with tenant isolation", async () => {
      const testEmail = trackEmail(`provisioned.mgr.${Date.now()}@capacityconnect.internal`);
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "admin-user-1",
          name: "Dr. K. Srinivas",
          email: "admin@capacityconnect.demo",
          role: "ADMIN",
          organizationId: TEST_ORG_ID,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      const req = createMockRequest("http://localhost:3000/api/users", "POST", {
        name: "New Department Manager",
        email: testEmail,
        password: "ManagerPassword123!",
        confirmPassword: "ManagerPassword123!",
        role: "MANAGER",
      });

      const res = await createUserHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.role).toBe("MANAGER");
      expect(data.user.organizationId).toBe(TEST_ORG_ID);

      // Verify DB entity
      const createdDbUser = await prisma.user.findFirst({
        where: { email: testEmail },
      });
      expect(createdDbUser?.role).toBe("MANAGER");
      expect(createdDbUser?.organizationId).toBe(TEST_ORG_ID);
    });

    it("allows ADMIN to create EMPLOYEE and automatically links workforce profile", async () => {
      const testEmail = trackEmail(`provisioned.emp.${Date.now()}@capacityconnect.internal`);
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "admin-user-1",
          name: "Dr. K. Srinivas",
          email: "admin@capacityconnect.demo",
          role: "ADMIN",
          organizationId: TEST_ORG_ID,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      const req = createMockRequest("http://localhost:3000/api/users", "POST", {
        name: "New Software Engineer",
        email: testEmail,
        password: "EmployeePassword123!",
        confirmPassword: "EmployeePassword123!",
        role: "EMPLOYEE",
      });

      const res = await createUserHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user.role).toBe("EMPLOYEE");
      expect(data.user.employeeId).toBeDefined();

      const createdDbUser = await prisma.user.findFirst({
        where: { email: testEmail },
        include: { employee: true },
      });
      expect(createdDbUser?.employee).not.toBeNull();
      expect(createdDbUser?.employee?.email).toBe(testEmail);
    });
  });
});

describe("Audit Logging & Manager Activity Oversight", () => {
  it("sanitizes passwords, secrets, and hashes from audit log metadata", async () => {
    const actorId = `test-actor-${Date.now()}`;
    await AuditService.log({
      actorId,
      actorRole: "ADMIN",
      actorEmail: "admin@capacityconnect.demo",
      organizationId: TEST_ORG_ID,
      category: "USER_MANAGEMENT",
      action: "USER_CREATED",
      description: "Test user created with metadata sanitization",
      metadata: {
        safeField: "John Doe",
        password: "SuperSecretPassword123!",
        passwordHash: "$2a$10$abcdef1234567890",
        token: "jwt-token-value",
      },
    });

    const entry = await prisma.auditLog.findFirst({
      where: { actorId },
    });

    expect(entry).not.toBeNull();
    const meta = (entry?.metadata as any) || {};
    expect(meta.safeField).toBe("John Doe");
    expect(meta.password).toBeUndefined();
    expect(meta.passwordHash).toBeUndefined();
    expect(meta.token).toBeUndefined();

    // Clean up
    if (entry) {
      await prisma.auditLog.delete({ where: { id: entry.id } });
    }
  });

  it("admin audit logs endpoint enforces organization isolation and RBAC", async () => {
    // Non-admin request should get 403
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "emp-user-1",
        name: "Ravi Kumar",
        email: "ravi.kumar@capacityconnect.demo",
        role: "EMPLOYEE",
        organizationId: TEST_ORG_ID,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    const empReq = createMockRequest("http://localhost:3000/api/admin/audit-logs", "GET");
    const empRes = await getAuditLogsHandler(empReq);
    expect(empRes.status).toBe(403);

    // Admin request should succeed and return paginated logs
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "admin-user-1",
        name: "Dr. K. Srinivas",
        email: "admin@capacityconnect.demo",
        role: "ADMIN",
        organizationId: TEST_ORG_ID,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    const adminReq = createMockRequest("http://localhost:3000/api/admin/audit-logs?limit=10", "GET");
    const adminRes = await getAuditLogsHandler(adminReq);
    expect(adminRes.status).toBe(200);
    const data = await adminRes.json();
    expect(Array.isArray(data.logs)).toBe(true);
    expect(typeof data.total).toBe("number");
    expect(typeof data.totalPages).toBe("number");
  });

  it("manager activity endpoint aggregates operational metrics for admins", async () => {
    // Manager cannot access manager-activity overview
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "mgr-user-1",
        name: "Sarah Jenkins",
        email: "sarah.jenkins@capacityconnect.demo",
        role: "MANAGER",
        organizationId: TEST_ORG_ID,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    const mgrReq = createMockRequest("http://localhost:3000/api/admin/manager-activity", "GET");
    const mgrRes = await getManagerActivityHandler(mgrReq);
    expect(mgrRes.status).toBe(403);

    // Admin receives structured manager activity metrics
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "admin-user-1",
        name: "Dr. K. Srinivas",
        email: "admin@capacityconnect.demo",
        role: "ADMIN",
        organizationId: TEST_ORG_ID,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    const adminReq = createMockRequest("http://localhost:3000/api/admin/manager-activity", "GET");
    const adminRes = await getManagerActivityHandler(adminReq);
    expect(adminRes.status).toBe(200);
    const data = await adminRes.json();
    expect(Array.isArray(data.managers)).toBe(true);
    if (data.managers.length > 0) {
      const manager = data.managers[0];
      expect(manager.managerId).toBeDefined();
      expect(manager.managerName).toBeDefined();
      expect(typeof manager.managedEmployeesCount).toBe("number");
      expect(typeof manager.skillGapReviewsCount).toBe("number");
    }
  });

  it("updates lastLoginAt upon successful authentication", async () => {
    const user = await verifyUserCredentials({
      email: "admin@capacityconnect.demo",
      password: "Admin@123",
    });
    expect(user).not.toBeNull();
    expect(user?.role).toBe("ADMIN");

    // Check lastLoginAt was updated
    const afterUser = await prisma.user.findFirst({
      where: { email: "admin@capacityconnect.demo" },
    });
    expect(afterUser?.lastLoginAt).not.toBeNull();
  });

  it("does NOT update lastLoginAt on failed authentication", async () => {
    const beforeUser = await prisma.user.findFirst({
      where: { email: "sarah.jenkins@capacityconnect.demo" },
    });
    const previousLastLogin = beforeUser?.lastLoginAt;

    // Attempt failed login
    const failedResult = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "WrongPassword999!",
    });
    expect(failedResult).toBeNull();

    const afterUser = await prisma.user.findFirst({
      where: { email: "sarah.jenkins@capacityconnect.demo" },
    });
    expect(afterUser?.lastLoginAt?.getTime()).toBe(previousLastLogin?.getTime());
  });
});
