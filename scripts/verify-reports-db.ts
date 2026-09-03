import { prisma } from "../lib/db/prisma";
import { ReportService } from "../lib/services/report.service";
import { CompetencyService } from "../lib/services/competency.service";

async function main() {
  console.log("=== VERIFYING DOMAIN 9: REPORTS & DASHBOARD METRICS FROM POSTGRESQL ===");
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found in database.");
  const orgId = org.id;

  // 1. Initial Capacity Report from PostgreSQL
  const initialReport = await ReportService.getCapacityReport(orgId);
  console.log("✓ Initial Capacity Report Metrics:", initialReport.metrics);

  const initialCompCount = initialReport.metrics.totalCompetencies;

  // 2. Create a Competency and verify report metric dynamically reflects changes
  console.log("1. Creating dynamic competency to verify live report updates...");
  const tempComp = await CompetencyService.createCompetency(orgId, {
    name: "Dynamic Report Test Competency",
    code: "COMP-REP-TEST",
    category: "Analytics",
    description: "Testing live report count updates.",
    levels: [
      { level: 1, label: "L1", description: "L1" },
      { level: 2, label: "L2", description: "L2" },
      { level: 3, label: "L3", description: "L3" },
      { level: 4, label: "L4", description: "L4" },
      { level: 5, label: "L5", description: "L5" },
    ],
  });

  const updatedReport = await ReportService.getCapacityReport(orgId);
  console.log("✓ Updated Report Competency Count in PostgreSQL:", updatedReport.metrics.totalCompetencies);

  if (updatedReport.metrics.totalCompetencies !== initialCompCount + 1) {
    throw new Error(`Expected competency count ${initialCompCount + 1}, got ${updatedReport.metrics.totalCompetencies}`);
  }

  // 3. Delete the temporary competency
  console.log("2. Deleting temporary competency...");
  await CompetencyService.deleteCompetency(orgId, tempComp.id);

  const finalReport = await ReportService.getCapacityReport(orgId);
  console.log("✓ Final Report Competency Count in PostgreSQL:", finalReport.metrics.totalCompetencies);

  if (finalReport.metrics.totalCompetencies !== initialCompCount) {
    throw new Error(`Expected competency count ${initialCompCount}, got ${finalReport.metrics.totalCompetencies}`);
  }

  await prisma.$disconnect();
  console.log("=== DOMAIN 9 (REPORTS & DASHBOARD) DATABASE VERIFICATION COMPLETE AND PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
