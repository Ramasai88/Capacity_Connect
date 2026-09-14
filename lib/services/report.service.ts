import { prisma } from "@/lib/db/prisma";
import { SkillGapService } from "@/lib/services/skill-gap.service";

export interface DepartmentCapacityMetric {
  department: string;
  employeesCount: number;
  totalRequired: number;
  meetsRequirementTotal: number;
  needsImprovementTotal: number;
  notAssessedTotal: number;
  readinessPercent: number;
}

export interface CapacityReportResponse {
  organizationId: string;
  organizationName: string;
  generatedAt: string;
  metrics: {
    totalEmployees: number;
    activeEmployees: number;
    removedEmployees: number;
    totalManagers: number;
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
  departmentMetrics: DepartmentCapacityMetric[];
}

export class ReportService {
  /**
   * Generates comprehensive organizational capacity and learning analytics from real PostgreSQL data.
   */
  static async getCapacityReport(organizationId: string): Promise<CapacityReportResponse> {
    const [
      org,
      activeEmployeesCount,
      removedEmployeesCount,
      managersCount,
      competenciesCount,
      designationsCount,
      coursesCount,
      enrollmentsCount,
      completedEnrollmentsCount,
      pendingReassessmentsCount,
      gapSummary,
      activeEmployees,
    ] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      }),
      prisma.employee.count({ where: { organizationId, status: "ACTIVE" } }),
      prisma.employee.count({ where: { organizationId, status: "INACTIVE" } }),
      prisma.user.count({ where: { organizationId, role: "MANAGER" } }),
      prisma.competency.count({ where: { organizationId } }),
      prisma.designation.count({ where: { organizationId } }),
      prisma.course.count({ where: { organizationId } }),
      prisma.courseEnrollment.count({ where: { employee: { organizationId, status: "ACTIVE" } } }),
      prisma.courseEnrollment.count({
        where: { employee: { organizationId, status: "ACTIVE" }, status: "COMPLETED" },
      }),
      prisma.reassessment.count({
        where: { organizationId, status: "PENDING_REASSESSMENT", employee: { status: "ACTIVE" } },
      }),
      SkillGapService.getOrganizationSummary(organizationId),
      prisma.employee.findMany({
        where: { organizationId, status: "ACTIVE" },
        select: { id: true, department: true },
      }),
    ]);

    const totalRequired =
      gapSummary.meetsRequirementTotal +
      gapSummary.needsImprovementTotal +
      gapSummary.notAssessedTotal;

    const overallReadinessPercent =
      totalRequired > 0
        ? Math.round((gapSummary.meetsRequirementTotal / totalRequired) * 100)
        : activeEmployeesCount > 0 && competenciesCount > 0 ? 0 : 100;

    const courseCompletionRate =
      enrollmentsCount > 0
        ? Math.round((completedEnrollmentsCount / enrollmentsCount) * 100)
        : 0;

    const topGapCompetencies = [...gapSummary.competencySummaries]
      .sort((a, b) => b.affectedEmployeesCount - a.affectedEmployeesCount || b.averageGap - a.averageGap)
      .slice(0, 5);

    // Compute live departmental capacity distribution
    const employeeGapList = await SkillGapService.getOrganizationEmployeeGaps(organizationId);
    const empGapMap = new Map(employeeGapList.map((eg) => [eg.employeeId, eg]));

    const deptMap = new Map<string, {
      employeesCount: number;
      totalRequired: number;
      meets: number;
      needs: number;
      notAssessed: number;
    }>();

    for (const emp of activeEmployees) {
      const dept = emp.department || "General";
      const stats = deptMap.get(dept) || {
        employeesCount: 0,
        totalRequired: 0,
        meets: 0,
        needs: 0,
        notAssessed: 0,
      };

      stats.employeesCount += 1;
      const gaps = empGapMap.get(emp.id);
      if (gaps) {
        stats.totalRequired += gaps.totalRequired;
        stats.meets += gaps.meetsRequirementCount;
        stats.needs += gaps.needsImprovementCount;
        stats.notAssessed += gaps.notAssessedCount;
      }

      deptMap.set(dept, stats);
    }

    const departmentMetrics: DepartmentCapacityMetric[] = Array.from(deptMap.entries()).map(
      ([department, stats]) => {
        const total = stats.totalRequired;
        const readinessPercent = total > 0 ? Math.round((stats.meets / total) * 100) : 100;
        return {
          department,
          employeesCount: stats.employeesCount,
          totalRequired: stats.totalRequired,
          meetsRequirementTotal: stats.meets,
          needsImprovementTotal: stats.needs,
          notAssessedTotal: stats.notAssessed,
          readinessPercent,
        };
      }
    );

    return {
      organizationId,
      organizationName: org?.name || "Organization",
      generatedAt: new Date().toISOString(),
      metrics: {
        totalEmployees: activeEmployeesCount,
        activeEmployees: activeEmployeesCount,
        removedEmployees: removedEmployeesCount,
        totalManagers: managersCount,
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
      departmentMetrics,
    };
  }
}

