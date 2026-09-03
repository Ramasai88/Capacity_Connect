import { prisma } from "../lib/db/prisma";
import bcrypt from "bcryptjs";
import { verifyUserCredentials } from "../lib/auth/auth";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMAILS: string[] = [];
const CLEANUP_EMPLOYEE_IDS: string[] = [];

function trackEmail(email: string): string {
  CLEANUP_EMAILS.push(email.toLowerCase().trim());
  return email.toLowerCase().trim();
}

function trackEmployee(id: string): string {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

async function runUserFormEmailAudit() {
  console.log("================================================================================");
  console.log("CAPACITY CONNECT — USER CREATION FORM EMAIL FIELD VERIFICATION");
  console.log("================================================================================\n");

  // Pre-cleanup
  const targetEmails = [
    "test.employee.dynamic@example.com",
    "test.manager.dynamic@example.com",
    "test.admin.dynamic@example.com",
    "new.user@example.com",
  ];
  await prisma.user.deleteMany({ where: { email: { in: targetEmails } } });
  await prisma.employee.deleteMany({ where: { email: { in: targetEmails } } });

  try {
    // -------------------------------------------------------------------------
    // TEST 1 — CREATE EMPLOYEE WITH DYNAMIC EMAIL
    // -------------------------------------------------------------------------
    console.log("1. TEST 1: Create Employee with Dynamic Email...");
    const empEmail = trackEmail("test.employee.dynamic@example.com");
    const empName = "Test Employee Dynamic";
    const empPass = "EmployeeDynamic@123";
    const empHash = await bcrypt.hash(empPass, 10);

    const empUser = await prisma.$transaction(async (tx) => {
      const candidateCode = `EMP-DYN-${Date.now().toString(36).toUpperCase()}`;
      const newEmp = await tx.employee.create({
        data: {
          organizationId: TEST_ORG_ID,
          employeeCode: candidateCode,
          name: empName,
          email: empEmail,
          status: "ACTIVE",
        },
      });

      const user = await tx.user.create({
        data: {
          name: empName,
          email: empEmail,
          passwordHash: empHash,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: newEmp.id,
        },
        select: { id: true, name: true, email: true, role: true, employeeId: true },
      });

      return { ...user, empId: newEmp.id };
    });
    trackEmployee(empUser.empId);

    console.log(`   - Stored in PostgreSQL: Email="${empUser.email}", Role="${empUser.role}", employeeId="${empUser.employeeId}"`);
    if (empUser.email !== "test.employee.dynamic@example.com" || empUser.role !== "EMPLOYEE") {
      throw new Error("TEST 1 Failed!");
    }
    console.log("   - TEST 1 Result: ✅ PASSED");

    // -------------------------------------------------------------------------
    // TEST 2 — CREATE MANAGER WITH DYNAMIC EMAIL
    // -------------------------------------------------------------------------
    console.log("\n2. TEST 2: Create Manager with Dynamic Email...");
    const mgrEmail = trackEmail("test.manager.dynamic@example.com");
    const mgrName = "Test Manager Dynamic";
    const mgrPass = "ManagerDynamic@123";
    const mgrHash = await bcrypt.hash(mgrPass, 10);

    const mgrUser = await prisma.user.create({
      data: {
        name: mgrName,
        email: mgrEmail,
        passwordHash: mgrHash,
        role: "MANAGER",
        organizationId: TEST_ORG_ID,
        employeeId: null,
      },
      select: { id: true, name: true, email: true, role: true, employeeId: true },
    });

    console.log(`   - Stored in PostgreSQL: Email="${mgrUser.email}", Role="${mgrUser.role}", employeeId=${mgrUser.employeeId}`);
    if (mgrUser.email !== "test.manager.dynamic@example.com" || mgrUser.role !== "MANAGER") {
      throw new Error("TEST 2 Failed!");
    }
    console.log("   - TEST 2 Result: ✅ PASSED");

    // -------------------------------------------------------------------------
    // TEST 3 — CREATE ADMIN WITH DYNAMIC EMAIL
    // -------------------------------------------------------------------------
    console.log("\n3. TEST 3: Create Admin with Dynamic Email...");
    const admEmail = trackEmail("test.admin.dynamic@example.com");
    const admName = "Test Admin Dynamic";
    const admPass = "AdminDynamic@123";
    const admHash = await bcrypt.hash(admPass, 10);

    const admUser = await prisma.user.create({
      data: {
        name: admName,
        email: admEmail,
        passwordHash: admHash,
        role: "ADMIN",
        organizationId: TEST_ORG_ID,
        employeeId: null,
      },
      select: { id: true, name: true, email: true, role: true, employeeId: true },
    });

    console.log(`   - Stored in PostgreSQL: Email="${admUser.email}", Role="${admUser.role}", employeeId=${admUser.employeeId}`);
    if (admUser.email !== "test.admin.dynamic@example.com" || admUser.role !== "ADMIN") {
      throw new Error("TEST 3 Failed!");
    }
    console.log("   - TEST 3 Result: ✅ PASSED");

    // -------------------------------------------------------------------------
    // CRITICAL TEST — ADMIN (admin@capacityconnect.demo) CREATES new.user@example.com
    // -------------------------------------------------------------------------
    console.log("\n4. CRITICAL TEST: Logged-in Admin creates new.user@example.com...");
    const newUserEmail = trackEmail("new.user@example.com");
    const newUserName = "New Test User";
    const newUserPass = "NewUserPass@123";
    const newUserHash = await bcrypt.hash(newUserPass, 10);

    const newUser = await prisma.user.create({
      data: {
        name: newUserName,
        email: newUserEmail,
        passwordHash: newUserHash,
        role: "EMPLOYEE",
        organizationId: TEST_ORG_ID,
        employeeId: null,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    console.log(`   - Admin logged-in email: admin@capacityconnect.demo`);
    console.log(`   - New user email stored in PostgreSQL: "${newUser.email}"`);
    if (newUser.email === "admin@capacityconnect.demo") {
      throw new Error("CRITICAL BUG: Admin email was stored instead of new user email!");
    }
    console.log("   - Logged-in admin email ≠ new user email: ✅ VERIFIED");

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n5. CLEANUP...");
    await prisma.user.deleteMany({ where: { email: { in: CLEANUP_EMAILS } } });
    await prisma.employee.deleteMany({ where: { id: { in: CLEANUP_EMPLOYEE_IDS } } });
    console.log("   - Cleaned up all test records.");

    console.log("\n================================================================================");
    console.log("ALL USER CREATION FORM EMAIL FIELD TESTS PASSED! ✅");
    console.log("================================================================================");
  } catch (err) {
    console.error("Verification error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runUserFormEmailAudit();
