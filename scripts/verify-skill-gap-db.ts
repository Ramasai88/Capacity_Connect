import { prisma } from "../lib/db/prisma";
import { SkillGapService } from "../lib/services/skill-gap.service";
import { EmployeeService } from "../lib/services/employee.service";

async function main() {
  console.log("=== VERIFYING DOMAIN 8: SKILL GAP CALCULATION IN POSTGRESQL ===");
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found in database.");
  const orgId = org.id;

  const employee = await prisma.employee.findFirst({
    where: { organizationId: orgId },
    include: { designation: { include: { requirements: true } } },
  });
  if (!employee || !employee.designation || employee.designation.requirements.length === 0) {
    throw new Error("No employee with designation requirements found.");
  }

  const targetReq = employee.designation.requirements[0];
  if (!targetReq) throw new Error("No target requirement found.");
  console.log(`Testing Employee: ${employee.name} (${employee.employeeCode})`);
  console.log(`Designation: ${employee.designation.title}, Target Requirement: Competency ${targetReq.competencyId} -> Level ${targetReq.requiredLevel}`);

  // 1. Set current competency level to required - 2 (e.g. 4 -> 2, gap = 2)
  const initialCurrentLevel = Math.max(1, targetReq.requiredLevel - 2);
  await prisma.employeeCompetency.upsert({
    where: {
      employeeId_competencyId: {
        employeeId: employee.id,
        competencyId: targetReq.competencyId,
      },
    },
    update: { currentLevel: initialCurrentLevel, organizationId: orgId },
    create: {
      organizationId: orgId,
      employeeId: employee.id,
      competencyId: targetReq.competencyId,
      currentLevel: initialCurrentLevel,
    },
  });

  // 2. Query Skill Gap via SkillGapService
  const gapBefore = await SkillGapService.getEmployeeSkillGaps(orgId, employee.id);
  const targetGapBefore = gapBefore?.gaps.find((g) => g.competencyId === targetReq.competencyId);
  console.log("✓ Calculated Skill Gap (Before):", {
    requiredLevel: targetGapBefore?.requiredLevel,
    currentLevel: targetGapBefore?.currentLevel,
    gap: targetGapBefore?.gap,
    status: targetGapBefore?.status,
  });

  const expectedGap = targetReq.requiredLevel - initialCurrentLevel;
  if (targetGapBefore?.gap !== expectedGap || targetGapBefore?.status !== "NEEDS_IMPROVEMENT") {
    throw new Error(`Expected gap ${expectedGap} (NEEDS_IMPROVEMENT), got ${targetGapBefore?.gap} (${targetGapBefore?.status})`);
  }

  // 3. Elevate employee competency level to targetReq.requiredLevel (e.g. 4)
  console.log(`2. Elevating Competency Level in PostgreSQL to ${targetReq.requiredLevel}...`);
  await prisma.employeeCompetency.update({
    where: {
      employeeId_competencyId: {
        employeeId: employee.id,
        competencyId: targetReq.competencyId,
      },
    },
    data: { currentLevel: targetReq.requiredLevel },
  });

  // 4. Query Skill Gap again (Expect gap = 0, MEETS_REQUIREMENT)
  const gapAfter = await SkillGapService.getEmployeeSkillGaps(orgId, employee.id);
  const targetGapAfter = gapAfter?.gaps.find((g) => g.competencyId === targetReq.competencyId);
  console.log("✓ Calculated Skill Gap (After Elevation):", {
    requiredLevel: targetGapAfter?.requiredLevel,
    currentLevel: targetGapAfter?.currentLevel,
    gap: targetGapAfter?.gap,
    status: targetGapAfter?.status,
  });

  if (targetGapAfter?.gap !== 0 || targetGapAfter?.status !== "MEETS_REQUIREMENT") {
    throw new Error(`Expected gap 0 (MEETS_REQUIREMENT), got ${targetGapAfter?.gap} (${targetGapAfter?.status})`);
  }

  // 5. Query Organization-Wide Summary
  const orgSummary = await SkillGapService.getOrganizationSummary(orgId);
  console.log("✓ Organization Summary from PostgreSQL:", {
    totalEmployees: orgSummary.totalEmployees,
    totalCompetencies: orgSummary.totalCompetencies,
    totalGapsIdentified: orgSummary.totalGapsIdentified,
    meetsRequirementTotal: orgSummary.meetsRequirementTotal,
    needsImprovementTotal: orgSummary.needsImprovementTotal,
  });

  await prisma.$disconnect();
  console.log("=== DOMAIN 8 (SKILL GAP) DATABASE VERIFICATION COMPLETE AND PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
