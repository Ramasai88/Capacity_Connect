import { prisma } from "@/lib/db/prisma";
import {
  calculateSkillGap,
  summarizeOrganizationSkillGaps,
  EmployeeSkillGapSummary,
  OrganizationSkillGapSummary,
  RequiredCompetencyInput,
  CurrentCompetencyInput,
} from "@/lib/skill-gap/calculateSkillGap";

export class SkillGapService {
  /**
   * 1. Get skill gap profile for a single employee.
   */
  static async getEmployeeSkillGaps(
    organizationId: string,
    employeeId: string
  ): Promise<EmployeeSkillGapSummary | null> {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
      include: {
        designation: {
          include: {
            requirements: {
              include: {
                competency: true,
              },
            },
          },
        },
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    });

    if (!employee) return null;

    const requiredInputs: RequiredCompetencyInput[] = (
      employee.designation?.requirements || []
    ).map((req) => ({
      competencyId: req.competencyId,
      competencyName: req.competency.name,
      category: req.competency.category,
      requiredLevel: req.requiredLevel,
    }));

    const currentInputs: CurrentCompetencyInput[] = employee.competencies.map((comp) => ({
      competencyId: comp.competencyId,
      currentLevel: comp.currentLevel,
      assessedAt: comp.assessedAt.toISOString().split("T")[0],
    }));

    const gaps = calculateSkillGap(requiredInputs, currentInputs);

    let meetsCount = 0;
    let needsImprovementCount = 0;
    let notAssessedCount = 0;
    let totalGap = 0;

    for (const g of gaps) {
      if (g.status === "MEETS_REQUIREMENT") meetsCount++;
      else if (g.status === "NEEDS_IMPROVEMENT") needsImprovementCount++;
      else if (g.status === "NOT_ASSESSED") notAssessedCount++;

      if (g.gap > 0) totalGap += g.gap;
    }

    const averageGap = gaps.length > 0 ? Number((totalGap / gaps.length).toFixed(1)) : 0;

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      designationTitle: employee.designation?.title ?? "Unassigned",
      totalRequired: requiredInputs.length,
      meetsRequirementCount: meetsCount,
      needsImprovementCount,
      notAssessedCount,
      averageGap,
      gaps,
    };
  }

  /**
   * 2. Get skill gaps for all organization employees.
   */
  static async getOrganizationEmployeeGaps(
    organizationId: string,
    department?: string
  ): Promise<EmployeeSkillGapSummary[]> {
    const where: any = {
      organizationId,
      status: "ACTIVE",
    };

    if (department) {
      where.department = { equals: department, mode: "insensitive" };
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        designation: {
          include: {
            requirements: {
              include: {
                competency: true,
              },
            },
          },
        },
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    });

    const summaries: EmployeeSkillGapSummary[] = [];

    for (const emp of employees) {
      const requiredInputs: RequiredCompetencyInput[] = (
        emp.designation?.requirements || []
      ).map((req) => ({
        competencyId: req.competencyId,
        competencyName: req.competency.name,
        category: req.competency.category,
        requiredLevel: req.requiredLevel,
      }));

      const currentInputs: CurrentCompetencyInput[] = emp.competencies.map((comp) => ({
        competencyId: comp.competencyId,
        currentLevel: comp.currentLevel,
        assessedAt: comp.assessedAt.toISOString().split("T")[0],
      }));

      const gaps = calculateSkillGap(requiredInputs, currentInputs);

      let meetsCount = 0;
      let needsImprovementCount = 0;
      let notAssessedCount = 0;
      let totalGap = 0;

      for (const g of gaps) {
        if (g.status === "MEETS_REQUIREMENT") meetsCount++;
        else if (g.status === "NEEDS_IMPROVEMENT") needsImprovementCount++;
        else if (g.status === "NOT_ASSESSED") notAssessedCount++;

        if (g.gap > 0) totalGap += g.gap;
      }

      const averageGap = gaps.length > 0 ? Number((totalGap / gaps.length).toFixed(1)) : 0;

      summaries.push({
        employeeId: emp.id,
        employeeName: emp.name,
        designationTitle: emp.designation?.title ?? "Unassigned",
        totalRequired: requiredInputs.length,
        meetsRequirementCount: meetsCount,
        needsImprovementCount,
        notAssessedCount,
        averageGap,
        gaps,
      });
    }

    return summaries;
  }

  /**
   * 3. Get organization skill gap analytics summary.
   */
  static async getOrganizationSummary(
    organizationId: string
  ): Promise<OrganizationSkillGapSummary> {
    const employeeSummaries = await this.getOrganizationEmployeeGaps(organizationId);
    return summarizeOrganizationSkillGaps(employeeSummaries);
  }
}
