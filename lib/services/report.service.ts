import { prisma } from "@/lib/db/prisma";
import { SkillGapService } from "@/lib/services/skill-gap.service";

export interface CapacityReportResponse {
  organizationId: string;
  generatedAt: string;
  metrics: {
    totalEmployees: number;
    totalCompetencies: number;
    totalDesignations: number;
    totalCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
    courseCompletionRate: number;
    pendingReassessments: number;
    overallReadinessPercent: number;
  };
  skillGapsSummary: {
    totalRequired: number;
    meetsRequirementTotal: number;
    needsImprovementTotal: number;
    notAssessedTotal: number;
    totalGapsIdentified: number;
  };
  topGapCompetencies: Array<{
    competencyId: string;
    competencyName: string;
    category?: string;
    affectedEmployeesCount: number;
    averageGap: number;
  }>;
}

export class ReportService {
  /**
   * Generates comprehensive organizational capacity and learning analytics.
   */
  static async getCapacityReport(organizationId: string): Promise<CapacityReportResponse> {
    const [
      employeesCount,
      competenciesCount,
      designationsCount,
      coursesCount,
      enrollmentsCount,
      completedEnrollmentsCount,
      pendingReassessmentsCount,
      gapSummary,
    ] = await Promise.all([
      prisma.employee.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.competency.count({ where: { organizationId } }),
      prisma.designation.count({ where: { organizationId } }),
      prisma.course.count({ where: { organizationId } }),
      prisma.courseEnrollment.count({ where: { employee: { organizationId } } }),
      prisma.courseEnrollment.count({
        where: { employee: { organizationId }, status: "COMPLETED" },
      }),
      prisma.reassessment.count({
        where: { organizationId, status: "PENDING_REASSESSMENT" },
      }),
      SkillGapService.getOrganizationSummary(organizationId),
    ]);

    const totalRequired =
      gapSummary.meetsRequirementTotal +
      gapSummary.needsImprovementTotal +
      gapSummary.notAssessedTotal;

    const overallReadinessPercent =
      totalRequired > 0
        ? Math.round((gapSummary.meetsRequirementTotal / totalRequired) * 100)
        : 100;

    const courseCompletionRate =
      enrollmentsCount > 0
        ? Math.round((completedEnrollmentsCount / enrollmentsCount) * 100)
        : 0;

    const topGapCompetencies = [...gapSummary.competencySummaries]
      .sort((a, b) => b.affectedEmployeesCount - a.affectedEmployeesCount || b.averageGap - a.averageGap)
      .slice(0, 5);

    return {
      organizationId,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalEmployees: employeesCount,
        totalCompetencies: competenciesCount,
        totalDesignations: designationsCount,
        totalCourses: coursesCount,
        totalEnrollments: enrollmentsCount,
        completedEnrollments: completedEnrollmentsCount,
        courseCompletionRate,
        pendingReassessments: pendingReassessmentsCount,
        overallReadinessPercent,
      },
      skillGapsSummary: {
        totalRequired,
        meetsRequirementTotal: gapSummary.meetsRequirementTotal,
        needsImprovementTotal: gapSummary.needsImprovementTotal,
        notAssessedTotal: gapSummary.notAssessedTotal,
        totalGapsIdentified: gapSummary.totalGapsIdentified,
      },
      topGapCompetencies,
    };
  }
}
