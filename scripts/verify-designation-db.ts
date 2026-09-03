import { prisma } from "../lib/db/prisma";
import { DesignationService } from "../lib/services/designation.service";

async function main() {
  console.log("=== VERIFYING DOMAIN 3: DESIGNATION DATABASE PERSISTENCE ===");
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found in database.");
  const orgId = org.id;

  // Find an existing competency to link
  const comp = await prisma.competency.findFirst({ where: { organizationId: orgId } });
  if (!comp) throw new Error("No competency found to link to designation.");

  // Clean up if test designation exists
  await prisma.designationCompetency.deleteMany({
    where: { designation: { code: "DESIG-TEST-DB" } },
  });
  await prisma.designation.deleteMany({
    where: { code: "DESIG-TEST-DB" },
  });

  // 1. Create Designation with Competency Requirements
  console.log("1. Creating Database Test Role with Competency Requirements in PostgreSQL...");
  const created = await DesignationService.createDesignation(orgId, {
    title: "Database Test Role",
    code: "DESIG-TEST-DB",
    department: "Quality Assurance",
    description: "Testing live PostgreSQL persistence and requirement mappings.",
    competencyRequirements: [
      { competencyId: comp.id, requiredLevel: 4 },
    ],
  });
  console.log("✓ Created Designation ID:", created.id);

  // 2. Query Designation table in PostgreSQL
  const dbDesig = await prisma.designation.findUnique({ where: { id: created.id } });
  console.log("✓ Direct DB Query Result for Designation:", {
    id: dbDesig?.id,
    title: dbDesig?.title,
    code: dbDesig?.code,
    department: dbDesig?.department,
    organizationId: dbDesig?.organizationId,
  });

  // 3. Query DesignationCompetency table in PostgreSQL
  const dbReqs = await prisma.designationCompetency.findMany({
    where: { designationId: created.id },
    include: { competency: true },
  });
  console.log("✓ Direct DB Query Result for DesignationCompetency count:", dbReqs.length);
  dbReqs.forEach((r) => {
    console.log(`  Requirement: Competency "${r.competency.name}" (${r.competency.code}) -> Required Level ${r.requiredLevel}`);
  });

  if (dbReqs.length !== 1 || dbReqs[0].requiredLevel !== 4) {
    throw new Error("Expected 1 requirement with level 4");
  }

  // 4. Update Designation in PostgreSQL
  console.log("2. Updating Designation in PostgreSQL...");
  const updated = await DesignationService.updateDesignation(orgId, created.id, {
    title: "Database Test Role (Updated)",
    description: "Updated description in PostgreSQL.",
    competencyRequirements: [
      { competencyId: comp.id, requiredLevel: 5 },
    ],
  });
  console.log("✓ Updated Record in DB:", {
    id: updated.id,
    title: updated.title,
    requirementsCount: updated.requirements.length,
    newRequiredLevel: updated.requirements[0]?.requiredLevel,
  });

  // 5. Delete Designation from PostgreSQL
  console.log("3. Deleting Designation from PostgreSQL...");
  const deleted = await DesignationService.deleteDesignation(orgId, created.id);
  console.log("✓ Deleted Result:", deleted);

  // 6. Verify Deletion in DB
  const postDeleteDesig = await prisma.designation.findUnique({ where: { id: created.id } });
  const postDeleteReqs = await prisma.designationCompetency.findMany({ where: { designationId: created.id } });
  console.log("✓ Post-delete Designation Record in DB:", postDeleteDesig);
  console.log("✓ Post-delete DesignationCompetency Records in DB:", postDeleteReqs.length);

  await prisma.$disconnect();
  console.log("=== DOMAIN 3 (DESIGNATION) DATABASE VERIFICATION COMPLETE AND PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
