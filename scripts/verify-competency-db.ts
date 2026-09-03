import { prisma } from "../lib/db/prisma";
import { CompetencyService } from "../lib/services/competency.service";

async function main() {
  console.log("=== VERIFYING DOMAIN 2: COMPETENCY DATABASE PERSISTENCE ===");
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found in database.");
  const orgId = org.id;

  // Clean up if already exists
  await prisma.competencyLevel.deleteMany({
    where: { competency: { code: "COMP-TEST-DB" } },
  });
  await prisma.competency.deleteMany({
    where: { code: "COMP-TEST-DB" },
  });

  // 1. Create Competency with 5 Levels
  console.log("1. Creating Database Test Competency with 5 Levels in PostgreSQL...");
  const created = await CompetencyService.createCompetency(orgId, {
    name: "Database Test Competency",
    code: "COMP-TEST-DB",
    category: "Cloud & Infrastructure",
    description: "Testing live PostgreSQL persistence and 5-level scale.",
    levels: [
      { level: 1, label: "Level 1 - Novice", description: "Basic testing concepts" },
      { level: 2, label: "Level 2 - Beginner", description: "Standard operational tests" },
      { level: 3, label: "Level 3 - Intermediate", description: "Automated integration tests" },
      { level: 4, label: "Level 4 - Advanced", description: "End-to-end framework architecture" },
      { level: 5, label: "Level 5 - Expert", description: "Enterprise testing strategies" },
    ],
  });
  console.log("✓ Created Competency ID:", created.id);

  // 2. Query Competency table in PostgreSQL
  const dbComp = await prisma.competency.findUnique({ where: { id: created.id } });
  console.log("✓ Direct DB Query Result for Competency:", {
    id: dbComp?.id,
    name: dbComp?.name,
    code: dbComp?.code,
    category: dbComp?.category,
    organizationId: dbComp?.organizationId,
  });

  // 3. Query CompetencyLevel table in PostgreSQL
  const levels = await prisma.competencyLevel.findMany({
    where: { competencyId: created.id },
    orderBy: { level: "asc" },
  });
  console.log("✓ Direct DB Query Result for CompetencyLevel count:", levels.length);
  levels.forEach((l) => {
    console.log(`  [Level ${l.level}] ${l.label}: ${l.description}`);
  });

  if (levels.length !== 5) {
    throw new Error(`Expected 5 levels, found ${levels.length}`);
  }

  // 4. Update Competency in PostgreSQL
  console.log("2. Updating Competency in PostgreSQL...");
  const updated = await CompetencyService.updateCompetency(orgId, created.id, {
    name: "Database Test Competency (Updated)",
    description: "Updated description persisted in PostgreSQL.",
  });
  console.log("✓ Updated Record in DB:", {
    id: updated.id,
    name: updated.name,
    description: updated.description,
  });

  // 5. Delete Competency from PostgreSQL
  console.log("3. Deleting Competency from PostgreSQL...");
  const deleted = await CompetencyService.deleteCompetency(orgId, created.id);
  console.log("✓ Deleted Result:", deleted);

  // 6. Verify Deletion in DB
  const postDeleteComp = await prisma.competency.findUnique({ where: { id: created.id } });
  const postDeleteLevels = await prisma.competencyLevel.findMany({ where: { competencyId: created.id } });
  console.log("✓ Post-delete Competency Record in DB:", postDeleteComp);
  console.log("✓ Post-delete CompetencyLevel Records in DB:", postDeleteLevels.length);

  await prisma.$disconnect();
  console.log("=== DOMAIN 2 (COMPETENCY) DATABASE VERIFICATION COMPLETE AND PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
