import path from "path";
import { assertSafeTestDatabaseUrl, parseEnvFile } from "./safety-guard";

// 1. Explicitly load .env.test if it exists
const testEnvPath = path.resolve(process.cwd(), ".env.test");
const testEnv = parseEnvFile(testEnvPath);

for (const [key, val] of Object.entries(testEnv)) {
  process.env[key] = val;
}

// 2. Prioritize TEST_DATABASE_URL if explicitly provided
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// 3. Enforce strict safety guard BEFORE any Prisma connection or test runs
const safeUrl = assertSafeTestDatabaseUrl(process.env.DATABASE_URL);
process.env.DATABASE_URL = safeUrl;

// 4. Test environment defaults
(process.env as Record<string, string | undefined>).NODE_ENV = "test";
process.env.APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret-at-least-32-characters-long-key";
process.env.DEMO_MODE = "false";
process.env.NEXT_PUBLIC_DEMO_MODE = "false";
