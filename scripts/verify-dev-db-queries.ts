import { PrismaClient } from "@prisma/client";
import fs from "fs";
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

async function verifyDevQueries() {
  const env = parseEnv(".env");
  let dbUrl = assertSafeDevDatabaseUrl(env.DATABASE_URL);

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });


  try {
    console.log("=== VERIFYING API MODEL QUERIES AGAINST DEV DB ===");

    // 1. Users query (tests users.approvalStatus and UserRole enum)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        isActivated: true,
      },
      take: 5,
    });
    console.log("✓ /api/users query: OK (Found", users.length, "users)");

    // 2. Pending users query
    const pendingUsers = await prisma.user.findMany({
      where: { approvalStatus: "PENDING" },
    });
    console.log("✓ /api/users/pending query: OK (Pending count:", pendingUsers.length, ")");

    // 3. Employees query (tests employees.qualifications, skills, etc.)
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        skills: true,
        interests: true,
        qualifications: true,
        workExperience: true,
        certificates: true,
      },
      take: 5,
    });
    console.log("✓ /api/employees query: OK (Found", employees.length, "employees)");

    // 4. Published posts query (tests published_posts table)
    const posts = await prisma.publishedPost.findMany({
      take: 5,
    });
    console.log("✓ /api/admin/publishing query: OK (Found", posts.length, "posts)");

    // 5. Trainer resources query (tests trainer_resources table)
    const resources = await prisma.trainerResource.findMany({
      take: 5,
    });
    console.log("✓ /api/trainer/library query: OK (Found", resources.length, "resources)");

    // 6. Questionnaires query (tests questionnaires table)
    const questionnaires = await prisma.questionnaire.findMany({
      take: 5,
    });
    console.log("✓ /api/questionnaires query: OK (Found", questionnaires.length, "questionnaires)");

    // 7. Course feedback query (tests course_feedbacks table)
    const feedbacks = await prisma.courseFeedback.findMany({
      take: 5,
    });
    console.log("✓ /api/feedback query: OK (Found", feedbacks.length, "feedbacks)");

    // 8. Courses query
    const courses = await prisma.course.findMany({
      take: 5,
    });
    console.log("✓ /api/courses query: OK (Found", courses.length, "courses)");

    // 9. Designations query
    const designations = await prisma.designation.findMany({
      take: 5,
    });
    console.log("✓ /api/designations query: OK (Found", designations.length, "designations)");

    // 10. Reassessments query
    const reassessments = await prisma.reassessment.findMany({
      take: 5,
    });
    console.log("✓ /api/reassessments query: OK (Found", reassessments.length, "reassessments)");

    console.log("\n✅ ALL DEVELOPMENT QUERIES EXECUTED WITH ZERO ERRORS!");
  } finally {
    await prisma.$disconnect();
  }
}

verifyDevQueries().catch((e) => {
  console.error("Query verification failed:", e);
  process.exit(1);
});
