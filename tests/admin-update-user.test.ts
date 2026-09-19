import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";
import { verifyUserCredentials } from "@/lib/auth/auth";
import { updateEmployeeSchema } from "@/lib/validations/employee";
import { hasPermission } from "@/lib/auth/rbac";
import { authenticateApi } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

const TEST_ORG_ID = "org-kl-university";
const SECOND_ORG_ID = "org-test-isolation-org";

describe("Admin Single Authoritative Update Flow for Employees and Managers", () => {
  let employeeId: string;
  let employeeUserId: string;
  let managerId: string;
  let managerUserId: string;
  let secondaryOrgEmployeeId: string;

  const originalEmployeeEmail = `emp.updatetest.${Date.now()}@capacityconnect.demo`;
  const originalManagerEmail = `mgr.updatetest.${Date.now()}@capacityconnect.demo`;
  const initialPassword = "SecurePassword123!";

  beforeAll(async () => {
    // Ensure secondary org exists
    await prisma.organization.upsert({
      where: { id: SECOND_ORG_ID },
      update: {},
      create: {
        id: SECOND_ORG_ID,
        name: "Secondary Isolation Organization",
        code: "ISO-UPD-001",
      },
    });

    const desig = await prisma.designation.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    const course = await prisma.course.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });

    // 1. Create a regular Employee with linked User account
    const emp = await EmployeeService.createEmployee(TEST_ORG_ID, {
      name: "Original Employee Name",
      email: originalEmployeeEmail,
      employeeCode: `EMP-UPD-${Date.now().toString(36).toUpperCase()}`,
      department: "Engineering",
      designationId: desig?.id,
      joiningDate: "2024-01-15",
      status: "ACTIVE",
    });
    employeeId = emp.id;

    const passwordHash = await bcrypt.hash(initialPassword, 10);
    let empUser = await prisma.user.findFirst({ where: { employeeId: emp.id } });
    if (empUser) {
      empUser = await prisma.user.update({
        where: { id: empUser.id },
        data: { passwordHash, isActivated: true },
      });
    } else {
      empUser = await prisma.user.create({
        data: {
          name: "Original Employee Name",
          email: originalEmployeeEmail,
          passwordHash,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: emp.id,
          isActivated: true,
        },
      });
    }
    employeeUserId = empUser.id;

    // Update progress on auto-enrolled course to test learning history preservation
    await prisma.courseEnrollment.updateMany({
      where: { employeeId: emp.id },
      data: {
        progressPercent: 45,
        completedLessons: 3,
        totalLessons: 8,
        status: "IN_PROGRESS",
      },
    });

    // 2. Create a Manager with linked User account
    const mgr = await EmployeeService.createEmployee(TEST_ORG_ID, {
      name: "Original Manager Name",
      email: originalManagerEmail,
      employeeCode: `MGR-UPD-${Date.now().toString(36).toUpperCase()}`,
      department: "Management",
      designationId: desig?.id,
      joiningDate: "2023-05-01",
      status: "ACTIVE",
    });
    managerId = mgr.id;

    let mgrUser = await prisma.user.findFirst({ where: { employeeId: mgr.id } });
    if (mgrUser) {
      mgrUser = await prisma.user.update({
        where: { id: mgrUser.id },
        data: { passwordHash, role: "MANAGER", isActivated: true },
      });
    } else {
      mgrUser = await prisma.user.create({
        data: {
          name: "Original Manager Name",
          email: originalManagerEmail,
          passwordHash,
          role: "MANAGER",
          organizationId: TEST_ORG_ID,
          employeeId: mgr.id,
          isActivated: true,
        },
      });
    }
    managerUserId = mgrUser.id;

    // 3. Create secondary org employee for tenant isolation check
    const secEmp = await EmployeeService.createEmployee(SECOND_ORG_ID, {
      name: "Foreign Employee",
      email: `foreign.${Date.now()}@iso.demo`,
      employeeCode: `SEC-UPD-${Date.now().toString(36).toUpperCase()}`,
      department: "Sales",
      status: "ACTIVE",
    });
    secondaryOrgEmployeeId = secEmp.id;
  }, 30000);

  afterAll(async () => {
    // Clean up created test entities
    try {
      if (employeeId) {
        await prisma.courseEnrollment.deleteMany({ where: { employeeId } });
        await prisma.user.deleteMany({ where: { employeeId } });
        await prisma.employee.deleteMany({ where: { id: employeeId } });
      }
      if (managerId) {
        await prisma.user.deleteMany({ where: { employeeId: managerId } });
        await prisma.employee.deleteMany({ where: { id: managerId } });
      }
      if (secondaryOrgEmployeeId) {
        await prisma.employee.deleteMany({ where: { id: secondaryOrgEmployeeId } });
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it("1. Validates input schema: accepts valid Name/Email, rejects invalid formats", () => {
    const valid = updateEmployeeSchema.safeParse({
      name: "John Doe",
      email: "john.doe@capacityconnect.demo",
    });
    expect(valid.success).toBe(true);

    const invalidShortName = updateEmployeeSchema.safeParse({
      name: "A",
    });
    expect(invalidShortName.success).toBe(false);

    const invalidEmailFormat = updateEmployeeSchema.safeParse({
      email: "not-a-valid-email",
    });
    expect(invalidEmailFormat.success).toBe(false);
  });

  it("2. ADMIN updates Employee Name and Email atomically through EmployeeService", async () => {
    const updatedName = "Updated Employee Name";
    const updatedEmail = `emp.updated.${Date.now()}@capacityconnect.demo`;

    const updated = await EmployeeService.updateEmployee(
      TEST_ORG_ID,
      employeeId,
      { name: updatedName, email: updatedEmail },
      "Admin User",
      "admin-user-id",
      "ADMIN"
    );

    expect(updated.name).toBe(updatedName);
    expect(updated.email).toBe(updatedEmail);

    // Verify Employee table in DB
    const empDb = await prisma.employee.findUnique({ where: { id: employeeId } });
    expect(empDb?.name).toBe(updatedName);
    expect(empDb?.email).toBe(updatedEmail);
    expect(empDb?.id).toBe(employeeId); // ID preserved

    // Verify linked User table in DB is synchronized
    const userDb = await prisma.user.findUnique({ where: { id: employeeUserId } });
    expect(userDb?.name).toBe(updatedName);
    expect(userDb?.email).toBe(updatedEmail);
    expect(userDb?.role).toBe("EMPLOYEE"); // Role preserved
    expect(userDb?.id).toBe(employeeUserId); // User ID preserved

    // Verify login with updated email and original password succeeds
    const verified = await verifyUserCredentials({
      email: updatedEmail,
      password: initialPassword,
    });
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(employeeUserId);
    expect(verified?.email).toBe(updatedEmail);

    // Verify course enrollments / learning history are preserved
    const enrollments = await prisma.courseEnrollment.findMany({ where: { employeeId } });
    expect(enrollments.length).toBeGreaterThan(0);
    expect(enrollments[0]?.progressPercent).toBe(45);

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        organizationId: TEST_ORG_ID,
        targetId: employeeId,
        action: "USER_PROFILE_UPDATED",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(audit).toBeDefined();
    expect(audit?.category).toBe("USER_MANAGEMENT");
  });

  it("3. ADMIN updates Manager Name and Email atomically", async () => {
    const updatedMgrName = "Updated Manager Name";
    const updatedMgrEmail = `mgr.updated.${Date.now()}@capacityconnect.demo`;

    const updated = await EmployeeService.updateEmployee(
      TEST_ORG_ID,
      managerId,
      { name: updatedMgrName, email: updatedMgrEmail },
      "Admin User",
      "admin-user-id",
      "ADMIN"
    );

    expect(updated.name).toBe(updatedMgrName);
    expect(updated.email).toBe(updatedMgrEmail);

    // Verify Manager User record
    const mgrUserDb = await prisma.user.findUnique({ where: { id: managerUserId } });
    expect(mgrUserDb?.name).toBe(updatedMgrName);
    expect(mgrUserDb?.email).toBe(updatedMgrEmail);
    expect(mgrUserDb?.role).toBe("MANAGER"); // Role preserved

    // Verify login works with new manager email
    const verifiedMgr = await verifyUserCredentials({
      email: updatedMgrEmail,
      password: initialPassword,
    });
    expect(verifiedMgr).not.toBeNull();
    expect(verifiedMgr?.role).toBe("MANAGER");
  });

  it("4. Rejects duplicate email within the same organization", async () => {
    const existingEmployee = await prisma.employee.findFirst({
      where: { organizationId: TEST_ORG_ID, id: { not: employeeId } },
    });

    if (existingEmployee) {
      await expect(
        EmployeeService.updateEmployee(
          TEST_ORG_ID,
          employeeId,
          { email: existingEmployee.email },
          "Admin User"
        )
      ).rejects.toThrowError(/already in use|already exists/);
    }
  });

  it("5. Rejects updating employee across organizations (Tenant Isolation)", async () => {
    await expect(
      EmployeeService.updateEmployee(
        TEST_ORG_ID,
        secondaryOrgEmployeeId,
        { name: "Unauthorized Cross-Tenant Edit" },
        "Admin User"
      )
    ).rejects.toThrowError(EmployeeServiceError);
  });

  it("6. Updating an INACTIVE employee does NOT restore them to ACTIVE", async () => {
    // Soft-deactivate employee
    await EmployeeService.deactivateEmployee(TEST_ORG_ID, employeeId);

    const inactiveEmp = await prisma.employee.findUnique({ where: { id: employeeId } });
    expect(inactiveEmp?.status).toBe("INACTIVE");

    // Update name/email while inactive
    const postUpdate = await EmployeeService.updateEmployee(
      TEST_ORG_ID,
      employeeId,
      { name: "Inactive Employee Updated Name" },
      "Admin User"
    );

    expect(postUpdate.status).toBe("INACTIVE");
    const checkDb = await prisma.employee.findUnique({ where: { id: employeeId } });
    expect(checkDb?.status).toBe("INACTIVE");
  });

  it("7. RBAC permissions: Only ADMIN has permission to edit employees/managers", () => {
    expect(hasPermission("ADMIN", "canEditEmployee")).toBe(true);
    expect(hasPermission("MANAGER", "canEditEmployee")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canEditEmployee")).toBe(false);
  });

  it("8. Unauthenticated requests are rejected with 401", async () => {
    const authResult = await authenticateApi(["ADMIN"]);
    expect(authResult.authorized).toBe(false);
    expect(authResult.response?.status).toBe(401);
  });
});
