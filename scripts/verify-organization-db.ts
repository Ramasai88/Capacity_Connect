import { prisma } from "../lib/db/prisma";
import { OrganizationService } from "../lib/services/organization.service";

async function main() {
  console.log("=== VERIFYING DOMAIN 10: ORGANIZATION & SETTINGS DATABASE PERSISTENCE ===");
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found in database.");
  const orgId = org.id;

  const originalName = org.name;
  console.log("✓ Original Organization in DB:", { id: org.id, name: org.name, industry: org.industry });

  // 1. Update Organization in PostgreSQL
  console.log("1. Updating Organization details in PostgreSQL...");
  const updated = await OrganizationService.updateOrganization(orgId, {
    name: "Capacity Connect Enterprise Campus",
    industry: "Higher Education & EdTech",
    description: "Enterprise multi-tenant digital capacity building platform.",
  });
  console.log("✓ Updated Result from Service:", {
    id: updated.id,
    name: updated.name,
    industry: updated.industry,
    description: updated.description,
  });

  // 2. Direct PostgreSQL Query to confirm persistence
  const dbOrg = await prisma.organization.findUnique({ where: { id: orgId } });
  console.log("✓ Direct DB Query Result for Organization:", {
    id: dbOrg?.id,
    name: dbOrg?.name,
    industry: dbOrg?.industry,
    description: dbOrg?.description,
  });

  if (dbOrg?.name !== "Capacity Connect Enterprise Campus") {
    throw new Error(`Expected name "Capacity Connect Enterprise Campus", got "${dbOrg?.name}"`);
  }

  // 3. Revert to original name
  console.log("2. Restoring original organization profile...");
  await OrganizationService.updateOrganization(orgId, {
    name: originalName,
    industry: org.industry || "Higher Education",
    description: org.description || "Digital Capacity Building Platform",
  });
  console.log("✓ Restored Original Organization Name:", originalName);

  await prisma.$disconnect();
  console.log("=== DOMAIN 10 (ORGANIZATION & SETTINGS) DATABASE VERIFICATION COMPLETE AND PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
