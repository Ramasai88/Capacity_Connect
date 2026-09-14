import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";
import { verifyUserCredentials } from "@/lib/auth/auth";
import bcrypt from "bcryptjs";

const TEST_ORG_ID = "org-kl-university";
const SECOND_ORG_ID = "org-test-isolation-org";

describe("Two-Step Employee Removal & Permanent Deletion System", () => {
  let testEmployeeId: string;
  let testUserId: string;
  let testCourseId: string;
  let testCompetencyId: string;
  let testDesignationId: string;
  const testEmail = `test.employee.lifecycle.${Date.now()}@capacityconnect.demo`;
  const testPassword = "Password123!";

  it("1-11: Step 1 Removal (Deactivation) preserves learning history and blocks login", async () => {
    // 0. Ensure secondary org exists for isolation tests
    await prisma.organization.upsert({
      where: { id: SECOND_ORG_ID },
      update: {},
      create: {
        id: SECOND_ORG_ID,
        name: "Secondary Isolation Organization",
        code: "ISO-001",
      },
    });

    // 1. Get shared course, competency, and designation
    const course = await prisma.course.findFirst({
      where: { organizationId: TEST_ORG_ID },
      include: { modules: true },
    });
    expect(course).toBeDefined();
    testCourseId = course!.id;

    const competency = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(competency).toBeDefined();
    testCompetencyId = competency!.id;

    const designation = await prisma.designation.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(designation).toBeDefined();
    testDesignationId = designation!.id;

    // 2. Create test employee
    const createdEmp = await EmployeeService.createEmployee(
      TEST_ORG_ID,
      {
        name: "Lifecycle Test Employee",
        email: testEmail,
        employeeCode: `EMP-${Date.now().toString(36).toUpperCase()}`,
        department: "Engineering",
        designationId: testDesignationId,
        joiningDate: "2024-01-01",
        status: "ACTIVE",
        competencies: [{ competencyId: testCompetencyId, currentLevel: 2 }],
      },
      "Test Admin"
    );
    testEmployeeId = createdEmp.id;

    // 3. Create User account for this employee with hashed password
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const user = await prisma.user.create({
      data: {
        organizationId: TEST_ORG_ID,
        name: "Lifecycle Test Employee",
        email: testEmail,
        passwordHash,
        role: "EMPLOYEE",
        employeeId: testEmployeeId,
      },
    });
    testUserId = user.id;

    // 4. Enroll in course and add module progress, reassessment, assessment
    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        employeeId_courseId: {
          employeeId: testEmployeeId,
          courseId: testCourseId,
        },
      },
      update: {},
      create: {
        employeeId: testEmployeeId,
        courseId: testCourseId,
        progressPercent: 50,
        completedLessons: 1,
        totalLessons: 2,
        status: "IN_PROGRESS",
      },
    });

    if (course!.modules.length > 0) {
      await prisma.moduleProgress.upsert({
        where: {
          enrollmentId_moduleId: {
            enrollmentId: enrollment.id,
            moduleId: course!.modules[0]!.id,
          },
        },
        update: {},
        create: {
          enrollmentId: enrollment.id,
          moduleId: course!.modules[0]!.id,
          completed: true,
        },
      });
    }

    await prisma.reassessment.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeId: testEmployeeId,
        courseId: testCourseId,
        competencyId: testCompetencyId,
        previousLevel: 1,
        requestedLevel: 2,
        status: "PENDING_REASSESSMENT",
      },
    });

    await prisma.skillAssessment.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeId: testEmployeeId,
        competencyId: testCompetencyId,
        title: "Initial Diagnostic Exam",
        score: 75.0,
        totalQuestions: 10,
        correctQuestions: 8,
        topicBreakdown: [],
      },
    });

    // 5. Verify employee CAN login while ACTIVE
    const activeAuth = await verifyUserCredentials({
      email: testEmail,
      password: testPassword,
    });
    expect(activeAuth).not.toBeNull();
    expect(activeAuth?.email).toBe(testEmail);

    // 6. Perform STEP 1: Deactivate / Remove Employee
    const deactivated = await EmployeeService.deactivateEmployee(
      TEST_ORG_ID,
      testEmployeeId,
      "admin-user-id",
      "System Administrator",
      "ADMIN"
    );
    expect(deactivated.status).toBe("INACTIVE");

    // 7. Active queries exclude removed employee
    const activeList = await EmployeeService.getEmployees(TEST_ORG_ID, {
      status: "ACTIVE",
    });
    expect(activeList.employees.some((e) => e.id === testEmployeeId)).toBe(false);

    // 8. Removed employees query includes removed employee
    const removedList = await EmployeeService.getEmployees(TEST_ORG_ID, {
      status: "INACTIVE",
    });
    expect(removedList.employees.some((e) => e.id === testEmployeeId)).toBe(true);

    // 9. Login is REJECTED after Step 1 removal
    const inactiveAuth = await verifyUserCredentials({
      email: testEmail,
      password: testPassword,
    });
    expect(inactiveAuth).toBeNull();

    // 10. Historical learning and assessment records remain 100% intact
    const remainingEnrollment = await prisma.courseEnrollment.findFirst({
      where: { employeeId: testEmployeeId, courseId: testCourseId },
    });
    expect(remainingEnrollment).toBeDefined();

    const remainingAssessments = await prisma.skillAssessment.findMany({
      where: { employeeId: testEmployeeId },
    });
    expect(remainingAssessments.length).toBeGreaterThanOrEqual(1);

    const remainingReassessments = await prisma.reassessment.findMany({
      where: { employeeId: testEmployeeId },
    });
    expect(remainingReassessments.length).toBeGreaterThanOrEqual(1);

    const remainingCompetencies = await prisma.employeeCompetency.findMany({
      where: { employeeId: testEmployeeId },
    });
    expect(remainingCompetencies.length).toBeGreaterThanOrEqual(1);

    const remainingHistory = await prisma.competencyAssessmentHistory.findMany({
      where: { employeeId: testEmployeeId },
    });
    expect(remainingHistory.length).toBeGreaterThanOrEqual(1);

    // 11. Audit log was created for EMPLOYEE_REMOVED
    const removalAudit = await prisma.auditLog.findFirst({
      where: {
        organizationId: TEST_ORG_ID,
        targetId: testEmployeeId,
        action: "EMPLOYEE_REMOVED",
      },
    });
    expect(removalAudit).toBeDefined();
    expect(removalAudit?.category).toBe("USER_MANAGEMENT");
    expect((removalAudit?.metadata as any)?.email).toBe(testEmail);
  }, 60000);

  it("12-21: Step 2 Permanent Deletion removes employee-owned records and strictly preserves shared curriculum", async () => {
    // Record baseline count of shared courses and modules
    const totalCoursesBefore = await prisma.course.count({ where: { organizationId: TEST_ORG_ID } });
    const totalModulesBefore = await prisma.courseModule.count({ where: { course: { organizationId: TEST_ORG_ID } } });
    const totalCompetenciesBefore = await prisma.competency.count({ where: { organizationId: TEST_ORG_ID } });
    const totalDesignationsBefore = await prisma.designation.count({ where: { organizationId: TEST_ORG_ID } });

    // Ensure there is another active employee
    const otherEmployee = await prisma.employee.findFirst({
      where: { organizationId: TEST_ORG_ID, id: { not: testEmployeeId } },
      include: { enrollments: true },
    });
    expect(otherEmployee).toBeDefined();

    // Step 2: Permanently delete testEmployee
    const deleteResult = await EmployeeService.permanentlyDeleteEmployee(
      TEST_ORG_ID,
      testEmployeeId,
      "admin-user-id",
      "System Administrator",
      "ADMIN"
    );
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deletedEmployee.id).toBe(testEmployeeId);

    // Verify Employee record is deleted
    const deletedEmpCheck = await prisma.employee.findUnique({
      where: { id: testEmployeeId },
    });
    expect(deletedEmpCheck).toBeNull();

    // Verify linked User record is deleted
    const deletedUserCheck = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    expect(deletedUserCheck).toBeNull();

    // Verify employee-owned records are deleted
    const empEnrollments = await prisma.courseEnrollment.findMany({ where: { employeeId: testEmployeeId } });
    expect(empEnrollments.length).toBe(0);

    const empAssessments = await prisma.skillAssessment.findMany({ where: { employeeId: testEmployeeId } });
    expect(empAssessments.length).toBe(0);

    const empReassessments = await prisma.reassessment.findMany({ where: { employeeId: testEmployeeId } });
    expect(empReassessments.length).toBe(0);

    const empCompetencies = await prisma.employeeCompetency.findMany({ where: { employeeId: testEmployeeId } });
    expect(empCompetencies.length).toBe(0);

    // Verify SHARED records are 100% PRESERVED
    const totalCoursesAfter = await prisma.course.count({ where: { organizationId: TEST_ORG_ID } });
    expect(totalCoursesAfter).toBe(totalCoursesBefore);

    const totalModulesAfter = await prisma.courseModule.count({ where: { course: { organizationId: TEST_ORG_ID } } });
    expect(totalModulesAfter).toBe(totalModulesBefore);

    const totalCompetenciesAfter = await prisma.competency.count({ where: { organizationId: TEST_ORG_ID } });
    expect(totalCompetenciesAfter).toBe(totalCompetenciesBefore);

    const totalDesignationsAfter = await prisma.designation.count({ where: { organizationId: TEST_ORG_ID } });
    expect(totalDesignationsAfter).toBe(totalDesignationsBefore);

    // Verify other employees are completely unaffected
    const otherEmpAfter = await prisma.employee.findUnique({
      where: { id: otherEmployee!.id },
      include: { enrollments: true },
    });
    expect(otherEmpAfter).toBeDefined();
    expect(otherEmpAfter?.enrollments.length).toBe(otherEmployee!.enrollments.length);

    // Verify EMPLOYEE_PERMANENTLY_DELETED audit log exists with non-sensitive metadata
    const permAudit = await prisma.auditLog.findFirst({
      where: {
        organizationId: TEST_ORG_ID,
        targetId: testEmployeeId,
        action: "EMPLOYEE_PERMANENTLY_DELETED",
      },
    });
    expect(permAudit).toBeDefined();
    const meta = permAudit?.metadata as any;
    expect(meta).toBeDefined();
    expect(meta.email).toBe(testEmail);
    expect(meta.password).toBeUndefined();
    expect(meta.passwordHash).toBeUndefined();
  }, 60000);

  it("22-28: Organization Isolation and Authorization Boundaries", async () => {
    // Create an employee in Org B
    const orgBEmployee = await prisma.employee.create({
      data: {
        organizationId: SECOND_ORG_ID,
        name: "Org B Employee",
        email: `orgb.${Date.now()}@isolation.demo`,
        employeeCode: `ORGB-${Date.now().toString(36).toUpperCase()}`,
        status: "ACTIVE",
      },
    });

    // Attempting to deactivate Org B employee using Org A credentials MUST fail with 404/NOT_FOUND
    await expect(
      EmployeeService.deactivateEmployee(TEST_ORG_ID, orgBEmployee.id)
    ).rejects.toThrow();

    // Attempting to permanently delete Org B employee using Org A credentials MUST fail with 404/NOT_FOUND
    await expect(
      EmployeeService.permanentlyDeleteEmployee(TEST_ORG_ID, orgBEmployee.id)
    ).rejects.toThrow();

    // Org B employee remains completely intact
    const orgBCheck = await prisma.employee.findUnique({ where: { id: orgBEmployee.id } });
    expect(orgBCheck).toBeDefined();
    expect(orgBCheck?.status).toBe("ACTIVE");

    // Clean up Org B test employee safely
    await prisma.employee.delete({ where: { id: orgBEmployee.id } });
  }, 60000);

  it("29-37: Restore Workflow restores access and preserves all historical records without duplication", async () => {
    const restoreEmail = `restore.test.${Date.now()}@capacityconnect.demo`;
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Create employee for restore test
    const emp = await EmployeeService.createEmployee(
      TEST_ORG_ID,
      {
        name: "Restore Candidate Employee",
        email: restoreEmail,
        employeeCode: `RST-${Date.now().toString(36).toUpperCase()}`,
        department: "Engineering",
        designationId: testDesignationId,
        joiningDate: "2024-02-01",
        status: "ACTIVE",
        competencies: [{ competencyId: testCompetencyId, currentLevel: 3 }],
      },
      "Test Admin"
    );

    // Create user login
    await prisma.user.create({
      data: {
        organizationId: TEST_ORG_ID,
        name: "Restore Candidate Employee",
        email: restoreEmail,
        passwordHash,
        role: "EMPLOYEE",
        employeeId: emp.id,
      },
    });

    // Step 1: Deactivate
    await EmployeeService.deactivateEmployee(TEST_ORG_ID, emp.id, "admin-id", "Admin", "ADMIN");
    let loginAttempt = await verifyUserCredentials({ email: restoreEmail, password: testPassword });
    expect(loginAttempt).toBeNull();

    // Step 2: Restore
    const restored = await EmployeeService.reactivateEmployee(TEST_ORG_ID, emp.id, "admin-id", "Admin", "ADMIN");
    expect(restored.status).toBe("ACTIVE");
    expect(restored.id).toBe(emp.id);

    // Restored employee CAN log in again
    loginAttempt = await verifyUserCredentials({ email: restoreEmail, password: testPassword });
    expect(loginAttempt).not.toBeNull();
    expect(loginAttempt?.id).toBeDefined();

    // Verify original identity, competencies, and enrollments are preserved without duplicate records
    const empRecords = await prisma.employee.findMany({
      where: { organizationId: TEST_ORG_ID, email: restoreEmail },
    });
    expect(empRecords.length).toBe(1);

    const comps = await prisma.employeeCompetency.findMany({
      where: { employeeId: emp.id },
    });
    expect(comps.length).toBeGreaterThanOrEqual(1);

    // Verify EMPLOYEE_RESTORED audit log
    const restoreAudit = await prisma.auditLog.findFirst({
      where: {
        organizationId: TEST_ORG_ID,
        targetId: emp.id,
        action: "EMPLOYEE_RESTORED",
      },
    });
    expect(restoreAudit).toBeDefined();
    expect(restoreAudit?.category).toBe("USER_MANAGEMENT");

    // Clean up test employee
    await EmployeeService.permanentlyDeleteEmployee(TEST_ORG_ID, emp.id, "admin-id", "Admin", "ADMIN");
  }, 60000);
});
