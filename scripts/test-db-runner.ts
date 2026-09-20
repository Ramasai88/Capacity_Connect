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

try {
  if (action === "push" || action === "setup") {
    console.log("📦 Pushing Prisma schema to test database...");
    execSync("npx prisma db push --skip-generate", {
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
