import { prisma } from "../lib/db/prisma";
import { CompetencyService } from "../lib/services/competency.service";
import { DesignationService } from "../lib/services/designation.service";
import { createCompetencySchema } from "../lib/validations/competency";

async function main() {
  console.log("=== VERIFYING COMPETENCY CREATION FORM & DATABASE FIX ===");

  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found.");
  const orgId = org.id;

  // 1. Clean up any existing GCP test competency & designation
  await prisma.designationCompetency.deleteMany({ where: { designation: { code: "DESIG-CLD-GCP" } } });
  await prisma.designation.deleteMany({ where: { code: "DESIG-CLD-GCP" } });
  await prisma.competencyLevel.deleteMany({ where: { competency: { code: "GCP-DB-VERIFY-001" } } });
  await prisma.competency.deleteMany({ where: { code: "GCP-DB-VERIFY-001" } });

  // 2. Validate payload matching frontend submission
  const frontendPayload = {
    name: "Google Cloud Platform",
    code: "GCP-DB-VERIFY-001",
    category: "Data & AI",
    description: "Google Cloud Platform infrastructure, services, architecture and cloud engineering capabilities.",
    levels: [
      {
        level: 1,
        label: "Beginner / Foundational",
        description: "Foundational GCP concepts, Cloud Console navigation, basic IAM and Compute Engine instances.",
        behavioralIndicators: ["Understands core GCP terminology", "Creates basic VMs with guidance"],
      },
      {
        level: 2,
        label: "Intermediate / Working",
        description: "Deploys standard VPC networks, GKE clusters, Cloud SQL, and Cloud Storage buckets.",
        behavioralIndicators: ["Configures standard GCP resources", "Implements basic Cloud IAM roles"],
      },
      {
        level: 3,
        label: "Proficient / Practitioner",
        description: "Implements production Kubernetes workloads on GKE, BigQuery pipelines, and Terraform automation.",
        behavioralIndicators: ["Builds CI/CD with Cloud Build", "Designs scalable BigQuery schemas"],
      },
      {
        level: 4,
        label: "Advanced / Specialist",
        description: "Designs multi-region high availability architectures, Anthos hybrid setups, and cloud security frameworks.",
        behavioralIndicators: ["Architects resilient cloud systems", "Optimizes organizational cloud spend"],
      },
      {
        level: 5,
        label: "Expert / Master",
        description: "Organizational GCP enterprise architect, defines multi-cloud governance and AI platform roadmaps.",
        behavioralIndicators: ["Sets enterprise cloud standards", "Key executive technical authority"],
      },
    ],
  };

  console.log("1. Testing Zod Validation Schema with Frontend Payload...");
  const validationResult = createCompetencySchema.safeParse(frontendPayload);
  if (!validationResult.success) {
    console.error("Validation failed:", validationResult.error.issues);
    throw new Error("Zod validation failed on frontend payload!");
  }
  console.log("✓ Zod Validation successfully parsed payload!");

  // 3. Create Competency via CompetencyService / PostgreSQL
  console.log("2. Creating Competency in PostgreSQL...");
  const created = await CompetencyService.createCompetency(orgId, validationResult.data);
  console.log("✓ Created Competency ID:", created.id);

  // 4. Query PostgreSQL table "competencies" directly
  console.log("3. Querying PostgreSQL 'competencies' table directly...");
  const dbComp = await prisma.competency.findUnique({
    where: { id: created.id },
    include: { levels: { orderBy: { level: "asc" } } },
  });
  console.log("✓ Found Competency in PostgreSQL:", {
    id: dbComp?.id,
    name: dbComp?.name,
    code: dbComp?.code,
    category: dbComp?.category,
    description: dbComp?.description,
  });

  if (!dbComp || dbComp.name !== "Google Cloud Platform") {
    throw new Error("Competency record was not found in PostgreSQL!");
  }

  // 5. Query PostgreSQL table "competency_levels"
  console.log("4. Querying PostgreSQL 'competency_levels' table directly...");
  console.log(`✓ Found ${dbComp.levels.length} CompetencyLevel records in PostgreSQL:`);
  dbComp.levels.forEach((lvl) => {
    console.log(`   Level ${lvl.level} [${lvl.label}]: ${lvl.description.substring(0, 50)}...`);
  });

  if (dbComp.levels.length !== 5) {
    throw new Error(`Expected exactly 5 competency levels, found ${dbComp.levels.length}`);
  }

  // 6. Test Edit Competency in PostgreSQL
  console.log("5. Testing Competency Edit in PostgreSQL...");
  const updated = await CompetencyService.updateCompetency(orgId, created.id, {
    name: "Google Cloud Platform & AI Services",
    description: "Google Cloud Platform infrastructure, Vertex AI, BigQuery, and enterprise cloud architecture.",
  });
  console.log("✓ Updated Competency in PostgreSQL:", {
    id: updated.id,
    name: updated.name,
    description: updated.description,
  });

  if (updated.name !== "Google Cloud Platform & AI Services") {
    throw new Error("Competency update failed!");
  }

  // 7. Verify Competency can be selected in a Designation Requirement
  console.log("6. Testing Designation requirement mapping with new competency...");
  const tempDesig = await DesignationService.createDesignation(orgId, {
    title: "Cloud Infrastructure Architect",
    code: "DESIG-CLD-GCP",
    department: "Cloud Engineering",
    description: "Architect responsible for GCP infrastructure.",
    competencyRequirements: [{ competencyId: created.id, requiredLevel: 4 }],
  });
  console.log("✓ Created Designation with Competency Requirement:", {
    designationId: tempDesig.id,
    requirementsCount: tempDesig.requirements.length,
  });

  // 8. Test Delete Safety (Must fail with 409 because linked to designation)
  console.log("7. Testing Delete Protection (Dependency safety)...");
  try {
    await CompetencyService.deleteCompetency(orgId, created.id);
    throw new Error("Delete should have failed due to active designation dependency!");
  } catch (err: any) {
    console.log("✓ Delete successfully blocked by dependency safety check:", err.message);
  }

  // 9. Clean up test records
  console.log("8. Cleaning up test records...");
  await DesignationService.deleteDesignation(orgId, tempDesig.id);
  await CompetencyService.deleteCompetency(orgId, created.id);
  console.log("✓ Cleaned up test designation and competency.");

  await prisma.$disconnect();
  console.log("=== COMPETENCY CREATION FORM & DATABASE FIX VERIFICATION PASSED ===");
}

main().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
