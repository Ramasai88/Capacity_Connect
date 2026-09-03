export type GapStatus = "MEETS_REQUIREMENT" | "NEEDS_IMPROVEMENT" | "NOT_ASSESSED";

export interface RequiredCompetencyInput {
  competencyId: string;
  competencyName: string;
  category?: string;
  requiredLevel: number;
}

export interface CurrentCompetencyInput {
  competencyId: string;
  currentLevel: number | null;
  assessedAt?: string;
}

export interface CompetencyGapResult {
  competencyId: string;
  competencyName: string;
  category?: string;
  requiredLevel: number;
  currentLevel: number | null;
  gap: number;
  status: GapStatus;
  assessedAt?: string;
}

export interface EmployeeSkillGapSummary {
  employeeId: string;
  employeeName: string;
  designationTitle: string;
  totalRequired: number;
  meetsRequirementCount: number;
  needsImprovementCount: number;
  notAssessedCount: number;
  averageGap: number;
  gaps: CompetencyGapResult[];
}

export interface OrganizationSkillGapSummary {
  totalEmployees: number;
  totalCompetencies: number;
  totalAssessedCount: number;
  totalGapsIdentified: number;
  meetsRequirementTotal: number;
  needsImprovementTotal: number;
  notAssessedTotal: number;
  competencySummaries: {
    competencyId: string;
    competencyName: string;
    category?: string;
    affectedEmployeesCount: number;
    averageGap: number;
  }[];
}

/**
 * Pure skill-gap calculation function.
 * Matches architecture Section 5:
 * - No current record / null -> gap = requiredLevel, status = NOT_ASSESSED
 * - gap = max(0, required - current)
 * - gap === 0 -> MEETS_REQUIREMENT, else NEEDS_IMPROVEMENT
 */
export function calculateSkillGap(
  requiredCompetencies: RequiredCompetencyInput[],
  currentCompetencies: CurrentCompetencyInput[]
): CompetencyGapResult[] {
  const currentMap = new Map<string, { currentLevel: number | null; assessedAt?: string }>();
  for (const c of currentCompetencies) {
    currentMap.set(c.competencyId, { currentLevel: c.currentLevel, assessedAt: c.assessedAt });
  }

  return requiredCompetencies.map((req) => {
    const currentEntry = currentMap.get(req.competencyId);
    const currentLevel = currentEntry?.currentLevel ?? null;

    if (currentLevel === null || currentLevel === undefined) {
      return {
        competencyId: req.competencyId,
        competencyName: req.competencyName,
        category: req.category,
        requiredLevel: req.requiredLevel,
        currentLevel: null,
        gap: req.requiredLevel,
        status: "NOT_ASSESSED",
        assessedAt: currentEntry?.assessedAt,
      };
    }

    const gap = Math.max(0, req.requiredLevel - currentLevel);
    const status: GapStatus = gap === 0 ? "MEETS_REQUIREMENT" : "NEEDS_IMPROVEMENT";

    return {
      competencyId: req.competencyId,
      competencyName: req.competencyName,
      category: req.category,
      requiredLevel: req.requiredLevel,
      currentLevel,
      gap,
      status,
      assessedAt: currentEntry?.assessedAt,
    };
  });
}

/**
 * Aggregates organization-wide skill gap metrics.
 */
export function summarizeOrganizationSkillGaps(
  employeeSummaries: EmployeeSkillGapSummary[]
): OrganizationSkillGapSummary {
  let meetsRequirementTotal = 0;
  let needsImprovementTotal = 0;
  let notAssessedTotal = 0;
  let totalGapsIdentified = 0;
  let totalAssessedCount = 0;

  const competencyStats = new Map<
    string,
    { name: string; category?: string; totalGap: number; affectedEmployees: number }
  >();

  for (const emp of employeeSummaries) {
    meetsRequirementTotal += emp.meetsRequirementCount;
    needsImprovementTotal += emp.needsImprovementCount;
    notAssessedTotal += emp.notAssessedCount;

    for (const gapResult of emp.gaps) {
      if (gapResult.currentLevel !== null) {
        totalAssessedCount++;
      }
      if (gapResult.gap > 0) {
        totalGapsIdentified++;
      }

      const existing = competencyStats.get(gapResult.competencyId) ?? {
        name: gapResult.competencyName,
        category: gapResult.category,
        totalGap: 0,
        affectedEmployees: 0,
      };

      if (gapResult.gap > 0) {
        existing.totalGap += gapResult.gap;
        existing.affectedEmployees += 1;
      }
      competencyStats.set(gapResult.competencyId, existing);
    }
  }

  const competencySummaries = Array.from(competencyStats.entries()).map(([competencyId, data]) => ({
    competencyId,
    competencyName: data.name,
    category: data.category,
    affectedEmployeesCount: data.affectedEmployees,
    averageGap: data.affectedEmployees > 0 ? Number((data.totalGap / data.affectedEmployees).toFixed(1)) : 0,
  }));

  return {
    totalEmployees: employeeSummaries.length,
    totalCompetencies: competencySummaries.length,
    totalAssessedCount,
    totalGapsIdentified,
    meetsRequirementTotal,
    needsImprovementTotal,
    notAssessedTotal,
    competencySummaries,
  };
}
