import { execSync } from "child_process";
import path from "path";
import { assertSafeTestDatabaseUrl, parseEnvFile } from "../tests/safety-guard";

const action = process.argv[2] || "setup";

// 1. Explicitly load .env.test
const testEnvPath = path.resolve(process.cwd(), ".env.test");
if (!testEnvPath) {
  console.error("❌ Error: .env.test file not found. Please create .env.test from .env.test.example.");
  process.exit(1);
}

const testEnv = parseEnvFile(testEnvPath);
for (const [key, val] of Object.entries(testEnv)) {
  process.env[key] = val;
}

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// 2. Enforce strict safety guard
let safeDatabaseUrl = "";
try {
  safeDatabaseUrl = assertSafeTestDatabaseUrl(process.env.DATABASE_URL);
} catch (err: any) {
  console.error(`\n❌ FATAL SAFETY GUARD: ${err.message}\n`);
  process.exit(1);
}

const envWithTestDb = {
  ...process.env,
  DATABASE_URL: safeDatabaseUrl,
  NODE_ENV: "test",
};

console.log(`\n🔒 Safety guard passed. Operating strictly on test database.`);
console.log(`🎯 Test Database Target: ${safeDatabaseUrl.replace(/:[^:@]+@/, ":****@")}\n`);

import { PrismaClient } from "@prisma/client";

function isExpectedFreshDbError(err: any): boolean {
  const message = String(err?.message || "").toLowerCase();
  const code = String(err?.code || "");
  const metaCode = String(err?.meta?.code || "");

  // PostgreSQL 42P01 = undefined_table ("relation ... does not exist")
  // PostgreSQL 42704 = undefined_object ("type ... does not exist")
  return (
    code === "42P01" ||
    code === "42704" ||
    metaCode === "42P01" ||
    metaCode === "42704" ||
    message.includes("does not exist") ||
    message.includes("undefined_table") ||
    message.includes("undefined_object")
  );
}

async function executeSafeSql(prisma: PrismaClient, sql: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (err: any) {
    if (isExpectedFreshDbError(err)) {
      // Expected in a clean/fresh test database where the relation or enum does not exist yet
      return;
    }
    // Any unexpected database error MUST be thrown and terminate the setup immediately
    throw new Error(`Pre-migration SQL failed [${sql}]: ${err.message || err}`);
  }
}

async function preMigrateTestDb(dbUrl: string) {
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    // 1. Add new enum values to PostgreSQL enum if not existing
    await executeSafeSql(prisma, `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TRAINER';`);
    await executeSafeSql(prisma, `ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TRAINEE';`);
    // 2. Safely migrate existing role records
    await executeSafeSql(prisma, `UPDATE users SET role = 'TRAINER' WHERE role::text = 'MANAGER';`);
    await executeSafeSql(prisma, `UPDATE users SET role = 'TRAINEE' WHERE role::text = 'EMPLOYEE';`);
    await executeSafeSql(prisma, `UPDATE audit_logs SET "actorRole" = 'TRAINER' WHERE "actorRole"::text = 'MANAGER';`);
    await executeSafeSql(prisma, `UPDATE audit_logs SET "actorRole" = 'TRAINEE' WHERE "actorRole"::text = 'EMPLOYEE';`);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  try {
    if (action === "push" || action === "setup") {
      console.log("🔄 Running safe pre-migration role data update on test database...");
      await preMigrateTestDb(safeDatabaseUrl);

      console.log("📦 Pushing Prisma schema to test database...");
      execSync("npx prisma db push --skip-generate --accept-data-loss", {
        stdio: "inherit",
        env: envWithTestDb,
      });
    }

    if (action === "seed" || action === "setup") {
      console.log("\n🌱 Seeding test database with baseline fixtures...");
      execSync("npx tsx prisma/seed-test.ts", {
        stdio: "inherit",
        env: envWithTestDb,
      });
    }

    console.log("\n✅ Test database operation completed successfully.\n");
  } catch (error: any) {
    console.error("\n❌ Test database operation failed:", error.message || error);
    process.exit(1);
  }
}

run();
