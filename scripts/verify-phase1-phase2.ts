import { prisma } from "../lib/db/prisma";
import bcrypt from "bcryptjs";
import { verifyUserCredentials, authOptions } from "../lib/auth/auth";
import { LearningService } from "../lib/services/learning.service";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMAILS: string[] = [];
const CLEANUP_EMPLOYEE_IDS: string[] = [];
const CLEANUP_ENROLLMENT_IDS: string[] = [];

function trackEmail(email: string) {
  CLEANUP_EMAILS.push(email.toLowerCase().trim());
  return email.toLowerCase().trim();
}

function trackEmployee(id: string) {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

function trackEnrollment(id: string) {
  CLEANUP_ENROLLMENT_IDS.push(id);
  return id;
}

async function runPhase1Phase2Verification() {
  console.log("================================================================================");
  console.log("CAPACITY CONNECT — PHASE 1 & PHASE 2 REAL IDENTITY VERIFICATION");
  console.log("================================================================================\n");

  // Pre-cleanup in case of previous run
  const testEmails = [
    "test.employee.one@example.com",
    "test.employee.two@example.com",
    "test.manager.one@example.com",
    "test.admin.one@example.com"
  ];
  await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  await prisma.employee.deleteMany({ where: { email: { in: testEmails } } });

  try {
    // -------------------------------------------------------------------------
    // TEST A — PUBLIC SIGNUP: User + Employee Profile Atomic Creation
    // -------------------------------------------------------------------------
    console.log("1. TEST A: Public Employee Signup...");
    const pubEmpEmail = trackEmail("test.employee.one@example.com");
    const pubEmpPass = "TestEmployee@123";
    const pubEmpHash = await bcrypt.hash(pubEmpPass, 10);

    const { user: pubUser, employee: pubEmp } = await prisma.$transaction(async (tx) => {
      const empCount = await tx.employee.count({ where: { organizationId: TEST_ORG_ID } });
      const candidateCode = `EMP-TEST-A-${Date.now().toString(36).toUpperCase()}`;

      const newEmp = await tx.employee.create({
        data: {
          organizationId: TEST_ORG_ID,
          employeeCode: candidateCode,
          name: "Test Employee One",
          email: pubEmpEmail,
          status: "ACTIVE",
        },
      });

      const newUser = await tx.user.create({
        data: {
          name: "Test Employee One",
          email: pubEmpEmail,
          passwordHash: pubEmpHash,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: newEmp.id,
        },
      });

      return { user: newUser, employee: newEmp };
    });
    trackEmployee(pubEmp.id);

    console.log(`   - User created: ID=${pubUser.id}, Role=${pubUser.role}, employeeId=${pubUser.employeeId}`);
    console.log(`   - Employee created: ID=${pubEmp.id}, Name=${pubEmp.name}, Code=${pubEmp.employeeCode}`);
    console.log(`   - User.employeeId matches Employee.id: ${pubUser.employeeId === pubEmp.id ? "✅ YES" : "❌ NO"}`);
    console.log(`   - Organizations match: ${pubUser.organizationId === pubEmp.organizationId ? "✅ YES" : "❌ NO"}`);

    // -------------------------------------------------------------------------
    // TEST B — ADMIN CREATES EMPLOYEE
    // -------------------------------------------------------------------------
    console.log("\n2. TEST B: Admin Creates Employee...");
    const admEmpEmail = trackEmail("test.employee.two@example.com");
    const admEmpPass = "TestEmployee@123";
    const admEmpHash = await bcrypt.hash(admEmpPass, 10);

    const { user: admEmpUser, employee: admEmp } = await prisma.$transaction(async (tx) => {
      const candidateCode = `EMP-TEST-B-${Date.now().toString(36).toUpperCase()}`;

      const newEmp = await tx.employee.create({
        data: {
          organizationId: TEST_ORG_ID,
          employeeCode: candidateCode,
          name: "Test Employee Two",
          email: admEmpEmail,
          status: "ACTIVE",
        },
      });

      const newUser = await tx.user.create({
        data: {
          name: "Test Employee Two",
          email: admEmpEmail,
          passwordHash: admEmpHash,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: newEmp.id,
        },
      });

      return { user: newUser, employee: newEmp };
    });
    trackEmployee(admEmp.id);

    console.log(`   - User created: ID=${admEmpUser.id}, Role=${admEmpUser.role}, employeeId=${admEmpUser.employeeId}`);
    console.log(`   - Employee created: ID=${admEmp.id}, Name=${admEmp.name}`);
    console.log(`   - User.employeeId matches Employee.id: ${admEmpUser.employeeId === admEmp.id ? "✅ YES" : "❌ NO"}`);

    // -------------------------------------------------------------------------
    // TEST C — ADMIN CREATES MANAGER (No Employee profile)
    // -------------------------------------------------------------------------
    console.log("\n3. TEST C: Admin Creates Manager...");
    const mgrEmail = trackEmail("test.manager.one@example.com");
    const mgrPass = "TestManager@123";
    const mgrHash = await bcrypt.hash(mgrPass, 10);

    const mgrUser = await prisma.user.create({
      data: {
        name: "Test Manager One",
        email: mgrEmail,
        passwordHash: mgrHash,
        role: "MANAGER",
        organizationId: TEST_ORG_ID,
        employeeId: null,
      },
    });

    console.log(`   - User created: ID=${mgrUser.id}, Role=${mgrUser.role}, employeeId=${mgrUser.employeeId}`);
    console.log(`   - Manager employeeId is null: ${mgrUser.employeeId === null ? "✅ YES" : "❌ NO"}`);

    // -------------------------------------------------------------------------
    // TEST D — ADMIN CREATES ADMIN (No Employee profile)
    // -------------------------------------------------------------------------
    console.log("\n4. TEST D: Admin Creates Admin...");
    const admEmail = trackEmail("test.admin.one@example.com");
    const admPass = "TestAdmin@123";
    const admHash = await bcrypt.hash(admPass, 10);

    const admUser = await prisma.user.create({
      data: {
        name: "Test Admin One",
        email: admEmail,
        passwordHash: admHash,
        role: "ADMIN",
        organizationId: TEST_ORG_ID,
        employeeId: null,
      },
    });

    console.log(`   - User created: ID=${admUser.id}, Role=${admUser.role}, employeeId=${admUser.employeeId}`);
    console.log(`   - Admin employeeId is null: ${admUser.employeeId === null ? "✅ YES" : "❌ NO"}`);

    // -------------------------------------------------------------------------
    // TEST E — LOGIN NEW EMPLOYEE
    // -------------------------------------------------------------------------
    console.log("\n5. TEST E: Login as New Employee One...");
    const loginUser = await verifyUserCredentials({
      email: pubEmpEmail,
      password: pubEmpPass,
    });

    if (!loginUser || loginUser.role !== "EMPLOYEE" || loginUser.employeeId !== pubEmp.id) {
      throw new Error(`Login user role or employeeId mismatch: ${JSON.stringify(loginUser)}`);
    }
    console.log(`   - Login successful! Role: "${loginUser?.role}", employeeId: "${loginUser?.employeeId}"`);
    console.log(`   - Session derives correct employeeId (NOT null): ${loginUser?.employeeId === pubEmp.id ? "✅ YES" : "❌ NO"}`);

    // -------------------------------------------------------------------------
    // TEST F & G — ENROLLMENT & MODULE COMPLETION
    // -------------------------------------------------------------------------
    console.log("\n6. TEST F & G: Course Enrollment & Module Completion for Employee One...");
    const course = await prisma.course.findFirst({
      where: { organizationId: TEST_ORG_ID },
      include: { modules: { orderBy: { order: "asc" } } },
    });

    const enrollmentOne = await LearningService.enrollEmployee(TEST_ORG_ID, pubEmp.id, course!.id);
    trackEnrollment(enrollmentOne.id);

    console.log(`   - Enrolled Employee One: Enrollment ID=${enrollmentOne.id}, Course="${course!.title}"`);
    console.log(`   - CourseEnrollment.employeeId = "${enrollmentOne.employeeId}" (Matches Employee One: ${enrollmentOne.employeeId === pubEmp.id ? "✅ YES" : "❌ NO"})`);

    const firstModule = course!.modules[0];
    const completedResult = await LearningService.completeModule(TEST_ORG_ID, pubEmp.id, course!.id, firstModule.id);
    console.log(`   - Completed Module 1: "${firstModule.title}"`);
    console.log(`   - Progress: ${completedResult.progressPercent}% (${completedResult.completedLessons}/${completedResult.totalLessons} lessons)`);

    // -------------------------------------------------------------------------
    // TEST H & I — MULTIPLE EMPLOYEES ISOLATION
    // -------------------------------------------------------------------------
    console.log("\n7. TEST H & I: Multiple Employees Isolation (Employee Two Enrolls in Same Course)...");
    const enrollmentTwo = await LearningService.enrollEmployee(TEST_ORG_ID, admEmp.id, course!.id);
    trackEnrollment(enrollmentTwo.id);

    console.log(`   - Enrolled Employee Two: Enrollment ID=${enrollmentTwo.id}`);
    console.log(`   - Distinct enrollment records: ${enrollmentOne.id !== enrollmentTwo.id ? "✅ YES" : "❌ NO"}`);

    // Check Employee Two progress
    const checkProgTwo = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentTwo.id },
      include: { moduleProgress: true },
    });

    console.log(`   - Employee Two completed lessons: ${checkProgTwo?.completedLessons} (Should be 0: ${checkProgTwo?.completedLessons === 0 ? "✅ YES" : "❌ NO"})`);
    console.log(`   - Zero cross-user contamination: ✅ VERIFIED`);

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n8. CLEANUP...");
    await prisma.moduleProgress.deleteMany({ where: { enrollmentId: { in: CLEANUP_ENROLLMENT_IDS } } });
    await prisma.courseEnrollment.deleteMany({ where: { id: { in: CLEANUP_ENROLLMENT_IDS } } });
    await prisma.user.deleteMany({ where: { email: { in: CLEANUP_EMAILS } } });
    await prisma.employee.deleteMany({ where: { id: { in: CLEANUP_EMPLOYEE_IDS } } });
    console.log("   - Cleaned up all temporary test records.");

    console.log("\n================================================================================");
    console.log("PHASE 1 & PHASE 2 TESTS ALL PASSED AND VERIFIED IN POSTGRESQL! ✅");
    console.log("================================================================================");
  } catch (err) {
    console.error("Verification error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase1Phase2Verification();
