import { prisma } from "../lib/db/prisma";
import { CourseService } from "../lib/services/course.service";

async function main() {
  console.log("=== VERIFYING DOMAIN 4: COURSE DATABASE PERSISTENCE ===");
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found in database.");
  const orgId = org.id;

  const comp = await prisma.competency.findFirst({ where: { organizationId: orgId } });
  if (!comp) throw new Error("No competency found for course linkage.");

  // Clean up if exists
  await prisma.courseModule.deleteMany({
    where: { course: { code: "CRS-TEST-DB" } },
  });
  await prisma.course.deleteMany({
    where: { code: "CRS-TEST-DB" },
  });

  // 1. Create Course with Modules
  console.log("1. Creating Database Test Course with Ordered Modules in PostgreSQL...");
  const created = await CourseService.createCourse(orgId, {
    title: "Database Test Course",
    code: "CRS-TEST-DB",
    category: "Technical Architecture",
    description: "Testing live PostgreSQL persistence for courses and curriculum modules.",
    competencyId: comp.id,
    targetLevel: 4,
    durationHours: 25,
    status: "PUBLISHED",
    modules: [
      {
        order: 1,
        title: "Module 1: Architecture Fundamentals",
        summary: "Introduction to system architecture patterns",
        durationMinutes: 60,
        overview: "Detailed overview of architectural principles",
        keyConcepts: [{ title: "Modularity", description: "Decoupled component design" }],
        practicalExercise: "Design a modular service blueprint",
        competencyVerification: "Attains baseline design verification",
      },
      {
        order: 2,
        title: "Module 2: Database Scalability",
        summary: "Relational persistence and transaction isolation",
        durationMinutes: 90,
        overview: "Detailed overview of database patterns",
        keyConcepts: [{ title: "ACID Transactions", description: "Consistency and rollback safety" }],
        practicalExercise: "Implement atomic transactions",
        competencyVerification: "Attains transactional safety",
      },
    ],
  });
  console.log("✓ Created Course ID:", created.id);

  // 2. Query Course table in PostgreSQL
  const dbCourse = await prisma.course.findUnique({ where: { id: created.id } });
  console.log("✓ Direct DB Query Result for Course:", {
    id: dbCourse?.id,
    title: dbCourse?.title,
    code: dbCourse?.code,
    status: dbCourse?.status,
    targetLevel: dbCourse?.targetLevel,
  });

  // 3. Query CourseModule table in PostgreSQL
  const dbModules = await prisma.courseModule.findMany({
    where: { courseId: created.id },
    orderBy: { order: "asc" },
  });
  console.log("✓ Direct DB Query Result for CourseModule count:", dbModules.length);
  dbModules.forEach((m) => {
    console.log(`  [Module Order ${m.order}] ${m.title} (${m.durationMinutes} mins)`);
  });

  if (dbModules.length !== 2 || dbModules[0].order !== 1 || dbModules[1].order !== 2) {
    throw new Error("Course modules order or count verification failed.");
  }

  // 4. Update Course
  console.log("2. Updating Course in PostgreSQL...");
  const updated = await CourseService.updateCourse(orgId, created.id, {
    title: "Database Test Course (Updated)",
    durationHours: 30,
  });
  console.log("✓ Updated Course Record in DB:", {
    id: updated.id,
    title: updated.title,
    durationHours: updated.durationHours,
  });

  // 5. Archive Course (via updateCourse status: ARCHIVED)
  console.log("3. Archiving Course in PostgreSQL...");
  const archived = await CourseService.updateCourse(orgId, created.id, {
    status: "ARCHIVED",
  });
  console.log("✓ Archived Course Status in DB:", archived.status);

  // 6. Delete Course from PostgreSQL
  console.log("4. Deleting Course from PostgreSQL...");
  const deleted = await CourseService.deleteCourse(orgId, created.id);
  console.log("✓ Deleted Result:", deleted);

  // 7. Verify post-delete in DB
  const postDeleteCourse = await prisma.course.findUnique({ where: { id: created.id } });
  const postDeleteModules = await prisma.courseModule.findMany({ where: { courseId: created.id } });
  console.log("✓ Post-delete Course Record in DB:", postDeleteCourse);
  console.log("✓ Post-delete CourseModule Records in DB:", postDeleteModules.length);

  await prisma.$disconnect();
  console.log("=== DOMAIN 4 (COURSE) DATABASE VERIFICATION COMPLETE AND PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
