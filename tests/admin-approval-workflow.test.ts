import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { verifyUserCredentials } from "@/lib/auth/auth";
import { POST as registerRequestHandler } from "@/app/api/auth/register-request/route";
import { GET as pendingListHandler } from "@/app/api/users/pending/route";
import { PATCH as approveUserHandler } from "@/app/api/users/[id]/approve/route";
import { PATCH as rejectUserHandler } from "@/app/api/users/[id]/reject/route";

vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

const TEST_ORG_ID = "org-kl-university";
const FOREIGN_ORG_ID = "org-foreign-tenant";

describe("Admin User Approval & Registration Workflow", () => {
  beforeEach(async () => {
    vi.mocked(getServerSession).mockReset();
    // Default mock as ADMIN
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

    // Clean up test users created during test runs
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "test.approval.",
        },
      },
    });
  });

  afterEach(async () => {
    vi.mocked(getServerSession).mockReset();
  });

  // ---------------------------------------------------------------------------
  // 1. Public Signup & PENDING State Creation
  // ---------------------------------------------------------------------------
  it("1. Public signup creates a PENDING user record with default TRAINEE role", async () => {
    const uniqueEmail = `test.approval.public.${Date.now()}@example.com`;
    const req = new Request("http://localhost:3000/api/auth/register-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Public Candidate",
        email: uniqueEmail,
        password: "Password@123",
        confirmPassword: "Password@123",
        role: "ADMIN", // Malicious attempt to escalate privilege
      }),
    });

    const res = await registerRequestHandler(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.user.approvalStatus).toBe("PENDING");
    expect(body.user.role).toBe("TRAINEE"); // Privilege escalation prevented
    expect(body.user.isActivated).toBe(false);

    // Verify DB state
    const dbUser = await prisma.user.findUnique({
      where: { id: body.user.id },
    });
    expect(dbUser).toBeDefined();
    expect(dbUser?.approvalStatus).toBe("PENDING");
    expect(dbUser?.role).toBe("TRAINEE");
  });

  // ---------------------------------------------------------------------------
  // 2. Authentication Rules for PENDING & REJECTED Users
  // ---------------------------------------------------------------------------
  it("2. Users in PENDING approval status are strictly blocked from logging in", async () => {
    const uniqueEmail = `test.approval.pending.${Date.now()}@example.com`;
    const hash = await bcrypt.hash("Password@123", 10);

    await prisma.user.create({
      data: {
        name: "Pending Login Test",
        email: uniqueEmail,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
        approvalStatus: "PENDING",
        isActivated: true,
      },
    });

    const session = await verifyUserCredentials({
      email: uniqueEmail,
      password: "Password@123",
    });

    expect(session).toBeNull();
  });

  it("3. Users in REJECTED approval status are strictly blocked from logging in", async () => {
    const uniqueEmail = `test.approval.rejected.${Date.now()}@example.com`;
    const hash = await bcrypt.hash("Password@123", 10);

    await prisma.user.create({
      data: {
        name: "Rejected Login Test",
        email: uniqueEmail,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
        approvalStatus: "REJECTED",
        rejectionReason: "Does not meet candidate criteria.",
        isActivated: true,
      },
    });

    const session = await verifyUserCredentials({
      email: uniqueEmail,
      password: "Password@123",
    });

    expect(session).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 3. Admin Approval APIs
  // ---------------------------------------------------------------------------
  it("4. Admin can list pending users in their organization", async () => {
    const uniqueEmail = `test.approval.list.${Date.now()}@example.com`;
    const hash = await bcrypt.hash("Password@123", 10);

    await prisma.user.create({
      data: {
        name: "List Candidate",
        email: uniqueEmail,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
        approvalStatus: "PENDING",
        isActivated: false,
      },
    });

    const res = await pendingListHandler();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.pendingUsers).toBeInstanceOf(Array);
    const found = body.pendingUsers.find((u: any) => u.email === uniqueEmail);
    expect(found).toBeDefined();
    expect(found.approvalStatus).toBe("PENDING");
  });

  it("5. Non-Admin receives 403 Forbidden on approval endpoints", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "trainee-user-1",
        name: "Ravi Kumar",
        email: "ravi.kumar@capacityconnect.demo",
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    });

    const res = await pendingListHandler();
    expect(res.status).toBe(403);
  });

  it("6. Admin can approve a pending user, creating workforce profile and enabling activation", async () => {
    const uniqueEmail = `test.approval.approve.${Date.now()}@example.com`;
    const hash = await bcrypt.hash("Password@123", 10);

    const user = await prisma.user.create({
      data: {
        name: "Approve Candidate",
        email: uniqueEmail,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
        approvalStatus: "PENDING",
        isActivated: false,
      },
    });

    const req = new Request(`http://localhost:3000/api/users/${user.id}/approve`, {
      method: "PATCH",
    });

    const res = await approveUserHandler(req, { params: { id: user.id } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.approvalStatus).toBe("APPROVED");

    // Verify DB state: User is approved, linked to an Employee record, and has activation token
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { employee: true, activationTokens: true },
    });

    expect(updatedUser?.approvalStatus).toBe("APPROVED");
    expect(updatedUser?.employeeId).toBeDefined();
    expect(updatedUser?.employee?.status).toBe("ACTIVE");
    expect(updatedUser?.activationTokens.length).toBeGreaterThan(0);
  });

  it("7. Admin can reject a pending user with an optional reason", async () => {
    const uniqueEmail = `test.approval.reject.${Date.now()}@example.com`;
    const hash = await bcrypt.hash("Password@123", 10);

    const user = await prisma.user.create({
      data: {
        name: "Reject Candidate",
        email: uniqueEmail,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
        approvalStatus: "PENDING",
        isActivated: false,
      },
    });

    const req = new Request(`http://localhost:3000/api/users/${user.id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Incomplete application details." }),
    });

    const res = await rejectUserHandler(req, { params: { id: user.id } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.approvalStatus).toBe("REJECTED");
    expect(body.user.rejectionReason).toBe("Incomplete application details.");

    // Verify DB state
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(dbUser?.approvalStatus).toBe("REJECTED");
    expect(dbUser?.rejectionReason).toBe("Incomplete application details.");
  });

  // ---------------------------------------------------------------------------
  // 4. Boundary, Idempotency & Tenant Isolation Checks
  // ---------------------------------------------------------------------------
  it("8. Approving an already approved user returns 400 ALREADY_APPROVED", async () => {
    const uniqueEmail = `test.approval.already.${Date.now()}@example.com`;
    const hash = await bcrypt.hash("Password@123", 10);

    const user = await prisma.user.create({
      data: {
        name: "Already Approved User",
        email: uniqueEmail,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: TEST_ORG_ID,
        approvalStatus: "APPROVED",
        isActivated: true,
      },
    });

    const req = new Request(`http://localhost:3000/api/users/${user.id}/approve`, {
      method: "PATCH",
    });

    const res = await approveUserHandler(req, { params: { id: user.id } });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_APPROVED");
  });

  it("9. Cross-tenant user approval is blocked with 404 NOT_FOUND", async () => {
    await prisma.organization.upsert({
      where: { id: FOREIGN_ORG_ID },
      create: { id: FOREIGN_ORG_ID, name: "Foreign Enterprise" },
      update: {},
    });

    const uniqueEmail = `test.approval.foreign.${Date.now()}@foreign.com`;
    const hash = await bcrypt.hash("Password@123", 10);

    const foreignUser = await prisma.user.create({
      data: {
        name: "Foreign Candidate",
        email: uniqueEmail,
        passwordHash: hash,
        role: "TRAINEE",
        organizationId: FOREIGN_ORG_ID,
        approvalStatus: "PENDING",
        isActivated: false,
      },
    });

    const req = new Request(`http://localhost:3000/api/users/${foreignUser.id}/approve`, {
      method: "PATCH",
    });

    const res = await approveUserHandler(req, { params: { id: foreignUser.id } });
    expect(res.status).toBe(404);
  });
});
