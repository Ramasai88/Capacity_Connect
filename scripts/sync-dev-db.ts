import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { assertSafeDevDatabaseUrl } from "../tests/safety-guard";

function parseEnv(path: string): Record<string, string> {
  if (!fs.existsSync(path)) return {};
  const content = fs.readFileSync(path, "utf8");
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  }
  return result;
}

async function executeSql(prisma: PrismaClient, sql: string) {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
}

async function syncDevDatabase() {
  console.log("==================================================");
  console.log("🔄 CAPACITY CONNECT — DIRECT DEV DATABASE SYNC");
  console.log("==================================================");

  const env = parseEnv(".env");
  let dbUrl = env.DATABASE_URL;

  // Enforce strict local development safety guard
  dbUrl = assertSafeDevDatabaseUrl(dbUrl);

  const maskedUrl = dbUrl.replace(/:\/\/[^@]+@/, "://***:***@");
  console.log(`🎯 Target Development Database: ${maskedUrl}`);


  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  try {
    console.log("\n1. Verifying database connection (with retry)...");
    let connected = false;
    let attempts = 0;
    while (!connected && attempts < 5) {
      try {
        attempts++;
        console.log(`   Attempt ${attempts}/5 connecting to database...`);
        const dbInfo: any[] = await prisma.$queryRawUnsafe("SELECT current_database(), current_user;");
        console.log("   Connected to database:", dbInfo[0]?.current_database);
        connected = true;
      } catch (connErr: any) {
        console.warn(`   Attempt ${attempts} failed: ${connErr.message}`);
        if (attempts >= 5) throw connErr;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    const initialUserCount: any[] = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int as count FROM users;");
    const initialEmpCount: any[] = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int as count FROM employees;");
    console.log(`   Existing records: ${initialUserCount[0]?.count} users, ${initialEmpCount[0]?.count} employees.`);

    console.log("\n2. Executing Idempotent Schema Migration SQL...");

    // 2.1 Enums
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TRAINER';
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'TRAINEE';
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "ResourceType" AS ENUM ('RECORDED_LECTURE', 'PRESENTATION', 'STUDY_MATERIAL');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "QuestionnaireStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "PostCategory" AS ENUM ('ANNOUNCEMENT', 'NOTIFICATION', 'ACHIEVEMENT', 'FEATURED_CONTENT');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("   ✓ Enums verified & created.");

    // 2.2 Migrate existing UserRole rows
    const uTrainer = await prisma.$executeRawUnsafe(`UPDATE users SET role = 'TRAINER' WHERE role::text = 'MANAGER';`);
    const uTrainee = await prisma.$executeRawUnsafe(`UPDATE users SET role = 'TRAINEE' WHERE role::text = 'EMPLOYEE';`);
    console.log(`   ✓ Role migration applied: ${uTrainer} MANAGER->TRAINER, ${uTrainee} EMPLOYEE->TRAINEE.`);

    // 2.3 Alter users table
    await executeSql(prisma, `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActivated" BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
      CREATE INDEX IF NOT EXISTS "users_approvalStatus_idx" ON "users"("approvalStatus");
    `);
    console.log("   ✓ users table columns & indexes verified.");

    // 2.4 Alter employees table
    await executeSql(prisma, `
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "qualifications" JSONB;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "workExperience" JSONB;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "interests" TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "skills" TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "certificates" JSONB;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "specializations" TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "teachingDomains" TEXT[] NOT NULL DEFAULT '{}';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS "bio" TEXT;
    `);
    console.log("   ✓ employees table professional profile columns verified.");

    // 2.5 account_activation_tokens
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "account_activation_tokens" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tokenHash" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "employeeId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "usedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "account_activation_tokens_userId_idx" ON "account_activation_tokens"("userId");
      CREATE INDEX IF NOT EXISTS "account_activation_tokens_employeeId_idx" ON "account_activation_tokens"("employeeId");
      CREATE INDEX IF NOT EXISTS "account_activation_tokens_organizationId_idx" ON "account_activation_tokens"("organizationId");
      CREATE INDEX IF NOT EXISTS "account_activation_tokens_expiresAt_idx" ON "account_activation_tokens"("expiresAt");
    `);
    console.log("   ✓ account_activation_tokens table verified.");

    // 2.6 skill_assessments
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "skill_assessments" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "employeeId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "competencyId" TEXT NOT NULL REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "title" TEXT NOT NULL,
        "score" DOUBLE PRECISION NOT NULL,
        "totalQuestions" INTEGER NOT NULL DEFAULT 10,
        "correctQuestions" INTEGER NOT NULL DEFAULT 0,
        "topicBreakdown" JSONB NOT NULL,
        "timeTakenMinutes" INTEGER DEFAULT 15,
        "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "skill_assessments_organizationId_idx" ON "skill_assessments"("organizationId");
      CREATE INDEX IF NOT EXISTS "skill_assessments_employeeId_idx" ON "skill_assessments"("employeeId");
      CREATE INDEX IF NOT EXISTS "skill_assessments_competencyId_idx" ON "skill_assessments"("competencyId");
    `);
    console.log("   ✓ skill_assessments table verified.");

    // 2.7 skill_recommendations
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "skill_recommendations" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "employeeId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "competencyId" TEXT NOT NULL REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "courseId" TEXT REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "priority" TEXT NOT NULL,
        "weakTopics" TEXT[] DEFAULT '{}',
        "scorePercentage" DOUBLE PRECISION,
        "currentLevel" INTEGER,
        "requiredLevel" INTEGER,
        "gap" INTEGER,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "engineType" TEXT NOT NULL DEFAULT 'RULE_BASED',
        "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "skill_recommendations_organizationId_idx" ON "skill_recommendations"("organizationId");
      CREATE INDEX IF NOT EXISTS "skill_recommendations_employeeId_idx" ON "skill_recommendations"("employeeId");
      CREATE INDEX IF NOT EXISTS "skill_recommendations_competencyId_idx" ON "skill_recommendations"("competencyId");
      CREATE INDEX IF NOT EXISTS "skill_recommendations_courseId_idx" ON "skill_recommendations"("courseId");
    `);
    console.log("   ✓ skill_recommendations table verified.");

    // 2.8 audit_logs
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "actorId" TEXT,
        "actorName" TEXT,
        "actorRole" "UserRole",
        "action" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "targetId" TEXT,
        "targetName" TEXT,
        "description" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'SUCCESS',
        "ipAddress" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");
      CREATE INDEX IF NOT EXISTS "audit_logs_actorId_idx" ON "audit_logs"("actorId");
      CREATE INDEX IF NOT EXISTS "audit_logs_category_idx" ON "audit_logs"("category");
      CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
      CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
    `);
    console.log("   ✓ audit_logs table verified.");

    // 2.9 trainer_resources (Trainer Library)
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "trainer_resources" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "trainerId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "courseId" TEXT REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "competencyId" TEXT REFERENCES "competencies"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "resourceType" "ResourceType" NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "fileSize" TEXT,
        "fileSizeBytes" BIGINT,
        "fileFormat" TEXT,
        "mimeType" TEXT,
        "originalFileName" TEXT,
        "storageKey" TEXT,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "trainer_resources_organizationId_idx" ON "trainer_resources"("organizationId");
      CREATE INDEX IF NOT EXISTS "trainer_resources_trainerId_idx" ON "trainer_resources"("trainerId");
      CREATE INDEX IF NOT EXISTS "trainer_resources_courseId_idx" ON "trainer_resources"("courseId");
      CREATE INDEX IF NOT EXISTS "trainer_resources_competencyId_idx" ON "trainer_resources"("competencyId");
    `);
    console.log("   ✓ trainer_resources table verified.");

    // 2.10 questionnaires
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "questionnaires" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "trainerId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "courseId" TEXT REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "competencyId" TEXT REFERENCES "competencies"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "deadline" TIMESTAMP(3),
        "durationMinutes" INTEGER DEFAULT 30,
        "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
        "status" "QuestionnaireStatus" NOT NULL DEFAULT 'DRAFT',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "questionnaires_organizationId_idx" ON "questionnaires"("organizationId");
      CREATE INDEX IF NOT EXISTS "questionnaires_trainerId_idx" ON "questionnaires"("trainerId");
      CREATE INDEX IF NOT EXISTS "questionnaires_courseId_idx" ON "questionnaires"("courseId");
      CREATE INDEX IF NOT EXISTS "questionnaires_competencyId_idx" ON "questionnaires"("competencyId");
      CREATE INDEX IF NOT EXISTS "questionnaires_deadline_idx" ON "questionnaires"("deadline");
    `);
    console.log("   ✓ questionnaires table verified.");

    // 2.11 questionnaire_questions
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "questionnaire_questions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "questionnaireId" TEXT NOT NULL REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "order" INTEGER NOT NULL,
        "questionText" TEXT NOT NULL,
        "options" TEXT[] NOT NULL,
        "correctOption" INTEGER NOT NULL,
        "explanation" TEXT,
        "points" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "questionnaire_questions_questionnaireId_order_key" UNIQUE ("questionnaireId", "order")
      );
      CREATE INDEX IF NOT EXISTS "questionnaire_questions_questionnaireId_idx" ON "questionnaire_questions"("questionnaireId");
    `);
    console.log("   ✓ questionnaire_questions table verified.");

    // 2.12 questionnaire_submissions
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "questionnaire_submissions" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "questionnaireId" TEXT NOT NULL REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "traineeId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "score" DOUBLE PRECISION NOT NULL,
        "totalPoints" INTEGER NOT NULL,
        "earnedPoints" INTEGER NOT NULL,
        "answers" JSONB NOT NULL,
        "timeSpentMinutes" INTEGER,
        "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "questionnaire_submissions_questionnaireId_traineeId_key" UNIQUE ("questionnaireId", "traineeId")
      );
      CREATE INDEX IF NOT EXISTS "questionnaire_submissions_organizationId_idx" ON "questionnaire_submissions"("organizationId");
      CREATE INDEX IF NOT EXISTS "questionnaire_submissions_questionnaireId_idx" ON "questionnaire_submissions"("questionnaireId");
      CREATE INDEX IF NOT EXISTS "questionnaire_submissions_traineeId_idx" ON "questionnaire_submissions"("traineeId");
    `);
    console.log("   ✓ questionnaire_submissions table verified.");

    // 2.13 course_feedbacks
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "course_feedbacks" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "traineeId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "rating" INTEGER NOT NULL,
        "contentQuality" INTEGER,
        "trainerClarity" INTEGER,
        "applicability" INTEGER,
        "feedbackText" TEXT,
        "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "course_feedbacks_courseId_traineeId_key" UNIQUE ("courseId", "traineeId")
      );
      CREATE INDEX IF NOT EXISTS "course_feedbacks_organizationId_idx" ON "course_feedbacks"("organizationId");
      CREATE INDEX IF NOT EXISTS "course_feedbacks_courseId_idx" ON "course_feedbacks"("courseId");
      CREATE INDEX IF NOT EXISTS "course_feedbacks_traineeId_idx" ON "course_feedbacks"("traineeId");
    `);
    console.log("   ✓ course_feedbacks table verified.");

    // 2.14 published_posts
    await executeSql(prisma, `
      CREATE TABLE IF NOT EXISTS "published_posts" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "authorId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "title" TEXT NOT NULL,
        "summary" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "category" "PostCategory" NOT NULL,
        "priority" TEXT NOT NULL DEFAULT 'NORMAL',
        "bannerUrl" TEXT,
        "targetRole" "UserRole",
        "pinned" BOOLEAN NOT NULL DEFAULT false,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "featuredCourseId" TEXT REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        "expiresAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "published_posts_organizationId_idx" ON "published_posts"("organizationId");
      CREATE INDEX IF NOT EXISTS "published_posts_authorId_idx" ON "published_posts"("authorId");
      CREATE INDEX IF NOT EXISTS "published_posts_category_idx" ON "published_posts"("category");
      CREATE INDEX IF NOT EXISTS "published_posts_isPublished_idx" ON "published_posts"("isPublished");
      CREATE INDEX IF NOT EXISTS "published_posts_pinned_idx" ON "published_posts"("pinned");
    `);
    console.log("   ✓ published_posts table verified.");

    console.log("\n3. Verifying Final Database State...");
    const allTables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    console.log("   All Tables in DB:", allTables.map((t) => t.table_name).sort());

    const rolesInDb: any[] = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT role::text FROM users;
    `);
    console.log("   User roles in users table:", rolesInDb);

    const finalUserCount: any[] = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int as count FROM users;");
    const finalEmpCount: any[] = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int as count FROM employees;");
    console.log(`   Preserved records: ${finalUserCount[0]?.count} users, ${finalEmpCount[0]?.count} employees.`);

    console.log("\n==================================================");
    console.log("✅ DEVELOPMENT DATABASE FULLY SYNCHRONIZED");
    console.log("==================================================");
  } finally {
    await prisma.$disconnect();
  }
}

syncDevDatabase().catch((err) => {
  console.error("❌ Synchronization failed:", err);
  process.exit(1);
});
