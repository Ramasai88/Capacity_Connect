import { prisma } from "../lib/db/prisma";
import bcrypt from "bcryptjs";
import { verifyUserCredentials, authOptions } from "../lib/auth/auth";

async function runDetailedAuthTest() {
  console.log("=== COMPREHENSIVE AUTHENTICATION & LOGIN AUDIT ===\n");

  const accounts = [
    { role: "ADMIN", email: "admin@capacityconnect.demo", password: "Admin@123" },
    { role: "ADMIN (KLU)", email: "admin@klu.edu", password: "Admin@123" },
    { role: "MANAGER", email: "sarah.jenkins@capacityconnect.demo", password: "Manager@123" },
    { role: "EMPLOYEE", email: "ravi.kumar@capacityconnect.demo", password: "Employee@123" },
  ];

  for (const acc of accounts) {
    console.log(`\n========================================`);
    console.log(`Testing [${acc.role}]: ${acc.email}`);
    console.log(`========================================`);

    // 1. Direct PostgreSQL query
    const dbUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: acc.email.toLowerCase().trim(),
          mode: "insensitive",
        },
      },
      include: {
        organization: true,
        employee: true,
      },
    });

    if (!dbUser) {
      console.log(`❌ DB Lookup FAILED: User not found in PostgreSQL!`);
      continue;
    }

    console.log(`✅ DB Lookup SUCCESS:`);
    console.log(`   - ID: ${dbUser.id}`);
    console.log(`   - Name: ${dbUser.name}`);
    console.log(`   - Email: ${dbUser.email}`);
    console.log(`   - Role in DB: ${dbUser.role}`);
    console.log(`   - Organization: ${dbUser.organization?.name} (${dbUser.organizationId})`);
    console.log(`   - Employee ID: ${dbUser.employeeId || "None (Not linked to employee profile)"}`);
    console.log(`   - Password Hash length: ${dbUser.passwordHash?.length}`);

    // 2. Direct bcrypt compare
    const isBcryptValid = await bcrypt.compare(acc.password, dbUser.passwordHash);
    console.log(`   - bcrypt.compare("${acc.password}", hash): ${isBcryptValid ? "✅ VALID" : "❌ INVALID"}`);

    // 3. verifyUserCredentials execution
    const verifiedUser = await verifyUserCredentials({
      email: acc.email,
      password: acc.password,
    });

    if (!verifiedUser) {
      console.log(`❌ verifyUserCredentials returned NULL!`);
      continue;
    }

    console.log(`✅ verifyUserCredentials SUCCESS:`);
    console.log(`   - Verified User:`, JSON.stringify(verifiedUser, null, 2));

    // 4. JWT Callback test
    const jwtCallback = authOptions.callbacks?.jwt;
    let token: any = {};
    if (jwtCallback) {
      token = await jwtCallback({
        token: {},
        user: verifiedUser as any,
        account: null as any,
      });
      console.log(`✅ JWT Callback Output:`, JSON.stringify(token, null, 2));
    }

    // 5. Session Callback test
    const sessionCallback = authOptions.callbacks?.session;
    if (sessionCallback) {
      const session = await sessionCallback({
        session: {
          user: {} as any,
          expires: new Date(Date.now() + 3600000).toISOString(),
        },
        token,
        user: verifiedUser as any,
        newSession: undefined,
        trigger: undefined as any,
      });
      console.log(`✅ Session Callback Output:`, JSON.stringify(session, null, 2));
      console.log(`   - Session Role: "${session.user?.role}" === "${acc.role.startsWith("ADMIN") ? "ADMIN" : acc.role}"`);
    }
  }

  await prisma.$disconnect();
  console.log("\n=== AUDIT COMPLETE ===");
}

runDetailedAuthTest().catch(console.error);
