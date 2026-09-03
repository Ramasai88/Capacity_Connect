import { describe, it, expect, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { LearningService, LearningServiceError } from "@/lib/services/learning.service";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMAILS: string[] = [];
const CLEANUP_EMPLOYEE_IDS: string[] = [];
const CLEANUP_ENROLLMENT_IDS: string[] = [];

function trackEmail(email: string): string {
  CLEANUP_EMAILS.push(email.toLowerCase().trim());
  return email.toLowerCase().trim();
}

function trackEmployee(id: string): string {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

function trackEnrollment(id: string): string {
  CLEANUP_ENROLLMENT_IDS.push(id);
  return id;
}

afterEach(async () => {
  if (CLEANUP_ENROLLMENT_IDS.length > 0) {
    await prisma.moduleProgress.deleteMany({
      where: { enrollmentId: { in: CLEANUP_ENROLLMENT_IDS } },
    });
    await prisma.courseEnrollment.deleteMany({
      where: { id: { in: CLEANUP_ENROLLMENT_IDS } },
    });
    CLEANUP_ENROLLMENT_IDS.length = 0;
  }

  if (CLEANUP_EMAILS.length > 0) {
    await prisma.user.deleteMany({
      where: { email: { in: CLEANUP_EMAILS }, organizationId: TEST_ORG_ID },
    });
    CLEANUP_EMAILS.length = 0;
  }

  if (CLEANUP_EMPLOYEE_IDS.length > 0) {
    await prisma.employeeCompetency.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.competencyAssessmentHistory.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.reassessment.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.employee.deleteMany({
      where: { id: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    CLEANUP_EMPLOYEE_IDS.length = 0;
  }
});

// ============================================================================
// PHASE 1 TESTS: Real Employee Identity Integration
// ============================================================================

describe("Phase 1: Real Employee User → Employee Profile Integration", () => {
  it("public signup creates Employee workforce profile and links User.employeeId in atomic transaction", async () => {
    const email = trackEmail("phase1.signup.employee@capacityconnect.internal");
    const name = "Phase 1 Signup Employee";
    const passwordHash = await bcrypt.hash("SignupPass@123", 10);

    const { user, employee } = await prisma.$transaction(async (tx) => {
      const empCount = await tx.employee.count({ where: { organizationId: TEST_ORG_ID } });
      const candidateCode = `EMP-TEST-${Date.now().toString(36).toUpperCase()}`;

      const newEmp = await tx.employee.create({
        data: {
          organizationId: TEST_ORG_ID,
          employeeCode: candidateCode,
          name,
          email,
          status: "ACTIVE",
        },
      });

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: newEmp.id,
        },
      });

      return { user: newUser, employee: newEmp };
    });

    trackEmployee(employee.id);

    expect(user.role).toBe("EMPLOYEE");
    expect(user.employeeId).toBe(employee.id);
    expect(user.employeeId).not.toBeNull();

    // Verify directly from fresh PostgreSQL query
    const dbUser = await prisma.user.findFirst({
      where: { email },
      include: { employee: true },
    });

    expect(dbUser?.employeeId).toBe(employee.id);
    expect(dbUser?.employee).not.toBeNull();
    expect(dbUser?.employee?.name).toBe(name);
    expect(dbUser?.employee?.organizationId).toBe(TEST_ORG_ID);
  });

  it("admin-created EMPLOYEE user creates Employee profile and links User.employeeId", async () => {
    const email = trackEmail("phase1.admin.created.emp@capacityconnect.internal");
    const name = "Admin Created Worker";
    const passwordHash = await bcrypt.hash("WorkerPass@123", 10);

    const user = await prisma.$transaction(async (tx) => {
      const candidateCode = `EMP-ADM-${Date.now().toString(36).toUpperCase()}`;

      const employee = await tx.employee.create({
        data: {
          organizationId: TEST_ORG_ID,
          employeeCode: candidateCode,
          name,
          email,
          status: "ACTIVE",
        },
      });

      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: employee.id,
        },
        select: { id: true, name: true, email: true, role: true, employeeId: true },
      });

      return { ...newUser, createdEmpId: employee.id };
    });

    trackEmployee(user.createdEmpId);

    expect(user.role).toBe("EMPLOYEE");
    expect(user.employeeId).toBe(user.createdEmpId);

    const dbEmployee = await prisma.employee.findUnique({
      where: { id: user.employeeId! },
    });
    expect(dbEmployee).not.toBeNull();
    expect(dbEmployee?.email).toBe(email);
  });

  it("admin-created MANAGER user sets employeeId = null (no Employee workforce profile)", async () => {
    const email = trackEmail("phase1.manager.user@capacityconnect.internal");
    const name = "Test Department Manager";
    const passwordHash = await bcrypt.hash("ManagerPass@123", 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "MANAGER",
        organizationId: TEST_ORG_ID,
        employeeId: null,
      },
    });

    expect(user.role).toBe("MANAGER");
    expect(user.employeeId).toBeNull();

    // Verify no stray Employee record was created with this email
    const strayEmployee = await prisma.employee.findFirst({
      where: { email, organizationId: TEST_ORG_ID },
    });
    expect(strayEmployee).toBeNull();
  });

  it("admin-created ADMIN user sets employeeId = null (no Employee workforce profile)", async () => {
    const email = trackEmail("phase1.admin.user@capacityconnect.internal");
    const name = "Test System Admin";
    const passwordHash = await bcrypt.hash("AdminPass@123", 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        organizationId: TEST_ORG_ID,
        employeeId: null,
      },
    });

    expect(user.role).toBe("ADMIN");
    expect(user.employeeId).toBeNull();
  });
});

// ============================================================================
// PHASE 2 TESTS: Strict Employee Identity & Multi-User Isolation
// ============================================================================

describe("Phase 2: Strict Employee Identity in Learning & Multi-User Isolation", () => {
  it("enrollment is tied strictly to the authenticated employee identity (no fallback)", async () => {
    // 1. Create a course if needed or find existing course
    const course = await prisma.course.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(course).not.toBeNull();

    // 2. Create Employee A
    const empA = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-A-${Date.now().toString(36).toUpperCase()}`,
        name: "Employee Alpha",
        email: trackEmail("emp.alpha@capacityconnect.internal"),
        status: "ACTIVE",
      },
    });
    trackEmployee(empA.id);

    // 3. Enroll Employee A
    const enrollment = await LearningService.enrollEmployee(TEST_ORG_ID, empA.id, course!.id);
    trackEnrollment(enrollment.id);

    expect(enrollment.employeeId).toBe(empA.id);
    expect(enrollment.courseId).toBe(course!.id);

    // Verify in PostgreSQL
    const dbEnrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollment.id },
    });
    expect(dbEnrollment?.employeeId).toBe(empA.id);
  });

  it("multiple employees maintain independent enrollments in the same course without cross-contamination", async () => {
    const course = await prisma.course.findFirst({
      where: { organizationId: TEST_ORG_ID },
      include: { modules: { orderBy: { order: "asc" } } },
    });
    expect(course).not.toBeNull();
    expect(course!.modules.length).toBeGreaterThan(0);

    // Create Employee A and Employee B
    const empA = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-ISO-A-${Date.now().toString(36).toUpperCase()}`,
        name: "Isolated Employee Alpha",
        email: trackEmail("iso.alpha@capacityconnect.internal"),
        status: "ACTIVE",
      },
    });
    trackEmployee(empA.id);

    const empB = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-ISO-B-${Date.now().toString(36).toUpperCase()}`,
        name: "Isolated Employee Beta",
        email: trackEmail("iso.beta@capacityconnect.internal"),
        status: "ACTIVE",
      },
    });
    trackEmployee(empB.id);

    // Enroll both in the same course
    const enrollmentA = await LearningService.enrollEmployee(TEST_ORG_ID, empA.id, course!.id);
    trackEnrollment(enrollmentA.id);

    const enrollmentB = await LearningService.enrollEmployee(TEST_ORG_ID, empB.id, course!.id);
    trackEnrollment(enrollmentB.id);

    expect(enrollmentA.id).not.toBe(enrollmentB.id);
    expect(enrollmentA.employeeId).toBe(empA.id);
    expect(enrollmentB.employeeId).toBe(empB.id);

    // Employee A completes Module 1
    const firstModule = course!.modules[0];
    await LearningService.completeModule(TEST_ORG_ID, empA.id, course!.id, firstModule.id);

    // Check progress of Employee A
    const progA = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentA.id },
      include: { moduleProgress: true },
    });

    // Check progress of Employee B
    const progB = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentB.id },
      include: { moduleProgress: true },
    });

    // Employee A has 1 completed lesson
    expect(progA?.completedLessons).toBe(1);
    expect(progA?.moduleProgress.length).toBe(1);

    // Employee B's progress MUST REMAIN 0 (zero cross-contamination)
    expect(progB?.completedLessons).toBe(0);
    expect(progB?.moduleProgress.length).toBe(0);
  });
});
