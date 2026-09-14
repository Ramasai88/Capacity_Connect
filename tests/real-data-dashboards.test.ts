import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { ReportService } from "@/lib/services/report.service";
import { SkillGapService } from "@/lib/services/skill-gap.service";
import { EmployeeService } from "@/lib/services/employee.service";
import { LearningService } from "@/lib/services/learning.service";
import { ReassessmentService } from "@/lib/services/reassessment.service";

const TEST_ORG_ID = "org-kl-university";
const ISOLATION_ORG_ID = "org-dashboard-isolation-test";

describe("Phase 2: Real-Data Dashboards & Reporting Suite", () => {
  let createdEmployeeId: string;
  let sampleDesignationId: string;
  let sampleCompetencyId: string;
  let sampleCourseId: string;
  const uniqueSuffix = Date.now().toString(36);

  beforeAll(async () => {
    // 0. Ensure secondary isolation organization exists
    await prisma.organization.upsert({
      where: { id: ISOLATION_ORG_ID },
      update: {},
      create: {
        id: ISOLATION_ORG_ID,
        name: "Isolation Test Org",
        code: `ISO-DASH-${uniqueSuffix}`,
      },
    });

    // 1. Fetch existing shared baseline metadata
    const designation = await prisma.designation.findFirst({
      where: { organizationId: TEST_ORG_ID },
      include: { requirements: true },
    });
    expect(designation).toBeDefined();
    sampleDesignationId = designation!.id;

    const competency = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID },
    });
    expect(competency).toBeDefined();
    sampleCompetencyId = competency!.id;

    const course = await prisma.course.findFirst({
      where: { organizationId: TEST_ORG_ID },
      include: { modules: true },
    });
    expect(course).toBeDefined();
    sampleCourseId = course!.id;
  });

  afterAll(async () => {
    // Clean up created test employee if still present
    if (createdEmployeeId) {
      try {
        await prisma.employee.deleteMany({ where: { id: createdEmployeeId } });
      } catch {
        // Ignore if already deleted
      }
    }
  });

  it("1. Course Catalog & Module Baseline: Exactly 13 canonical courses and 106 modules preserved", async () => {
    const canonicalCourseIds = [
      "course-fsw-401",
      "course-jv-401",
      "course-ts-301",
      "course-rct-401",
      "course-api-401",
      "course-py-401",
      "course-ml-402",
      "course-dl-501",
      "course-nlp-501",
      "course-mlops-501",
      "course-sql-301",
      "course-com-501",
      "course-ldr-401",
    ];

    const canonicalCourses = await prisma.course.findMany({
      where: { id: { in: canonicalCourseIds } },
      include: { modules: true },
    });

    expect(canonicalCourses).toHaveLength(13);
    const totalModules = canonicalCourses.reduce((sum, c) => sum + c.modules.length, 0);
    expect(totalModules).toBe(106);
  });

  it("2. Admin Dashboard Metrics: Pulls real PostgreSQL records and calculates live KPIs", async () => {
    const report = await ReportService.getCapacityReport(TEST_ORG_ID);

    expect(report.organizationId).toBe(TEST_ORG_ID);
    expect(report.organizationName).toBeDefined();
    expect(report.metrics.totalEmployees).toBeGreaterThanOrEqual(1);
    expect(report.metrics.activeEmployees).toBeGreaterThanOrEqual(1);
    expect(report.metrics.totalCompetencies).toBeGreaterThanOrEqual(1);
    expect(report.metrics.totalDesignations).toBeGreaterThanOrEqual(1);
    expect(report.metrics.totalCourses).toBeGreaterThanOrEqual(13);
    expect(typeof report.metrics.overallReadinessPercent).toBe("number");
    expect(report.metrics.overallReadinessPercent).toBeGreaterThanOrEqual(0);
    expect(report.metrics.overallReadinessPercent).toBeLessThanOrEqual(100);

    // Verify skill gaps summary matches canonical service
    const directSummary = await SkillGapService.getOrganizationSummary(TEST_ORG_ID);
    expect(report.skillGapsSummary.totalGapsIdentified).toBe(directSummary.totalGapsIdentified);
    expect(report.skillGapsSummary.meetsRequirementTotal).toBe(directSummary.meetsRequirementTotal);
    expect(report.skillGapsSummary.needsImprovementTotal).toBe(directSummary.needsImprovementTotal);
    expect(report.skillGapsSummary.notAssessedTotal).toBe(directSummary.notAssessedTotal);

    // Verify department metrics breakdown
    expect(Array.isArray(report.departmentMetrics)).toBe(true);
    if (report.departmentMetrics.length > 0) {
      const firstDept = report.departmentMetrics[0];
      expect(firstDept.department).toBeDefined();
      expect(firstDept.employeesCount).toBeGreaterThan(0);
      expect(typeof firstDept.readinessPercent).toBe("number");
    }
  });

  it("3. Organization Isolation: Dashboards never leak data across tenants", async () => {
    const isoReport = await ReportService.getCapacityReport(ISOLATION_ORG_ID);

    expect(isoReport.organizationId).toBe(ISOLATION_ORG_ID);
    expect(isoReport.metrics.totalEmployees).toBe(0);
    expect(isoReport.metrics.activeEmployees).toBe(0);
    expect(isoReport.metrics.removedEmployees).toBe(0);
    expect(isoReport.metrics.totalCourses).toBe(0);
    expect(isoReport.metrics.totalEnrollments).toBe(0);
    expect(isoReport.skillGapsSummary.totalGapsIdentified).toBe(0);
    expect(isoReport.departmentMetrics.length).toBe(0);
  });

  it("4. Phase 1 Lifecycle Integration: Inactive/removed employees excluded from active metrics", async () => {
    const baselineReport = await ReportService.getCapacityReport(TEST_ORG_ID);
    const initialActive = baselineReport.metrics.activeEmployees;
    const initialRemoved = baselineReport.metrics.removedEmployees;

    // Create a new employee
    const newEmp = await EmployeeService.createEmployee(
      TEST_ORG_ID,
      {
        name: "Dashboard Lifecycle Test",
        email: `dash.lifecycle.${uniqueSuffix}@capacityconnect.demo`,
        employeeCode: `EMP-DASH-${uniqueSuffix}`,
        department: "Operations",
        designationId: sampleDesignationId,
        joiningDate: "2025-01-01",
      },
      "Admin Tester"
    );
    createdEmployeeId = newEmp.id;

    // After creation: active count increases by 1
    const afterCreateReport = await ReportService.getCapacityReport(TEST_ORG_ID);
    expect(afterCreateReport.metrics.activeEmployees).toBe(initialActive + 1);

    // Step 1 Soft-Remove / Deactivate
    await EmployeeService.deactivateEmployee(TEST_ORG_ID, createdEmployeeId, "Admin Tester");

    // After deactivation: active count decrements, removed count increments
    const afterDeactivateReport = await ReportService.getCapacityReport(TEST_ORG_ID);
    expect(afterDeactivateReport.metrics.activeEmployees).toBe(initialActive);
    expect(afterDeactivateReport.metrics.removedEmployees).toBe(initialRemoved + 1);

    // Skill gaps query should not include inactive employee
    const activeGaps = await SkillGapService.getOrganizationEmployeeGaps(TEST_ORG_ID);
    const foundInactive = activeGaps.find((g) => g.employeeId === createdEmployeeId);
    expect(foundInactive).toBeUndefined();

    // Restore employee
    await EmployeeService.reactivateEmployee(TEST_ORG_ID, createdEmployeeId, "Admin Tester");
    const afterRestoreReport = await ReportService.getCapacityReport(TEST_ORG_ID);
    expect(afterRestoreReport.metrics.activeEmployees).toBe(initialActive + 1);
    expect(afterRestoreReport.metrics.removedEmployees).toBe(initialRemoved);

    // Step 2 Permanent Deletion
    await EmployeeService.permanentlyDeleteEmployee(TEST_ORG_ID, createdEmployeeId, "Admin Tester");
    createdEmployeeId = ""; // Marked as deleted

    const afterDeleteReport = await ReportService.getCapacityReport(TEST_ORG_ID);
    expect(afterDeleteReport.metrics.activeEmployees).toBe(initialActive);
    expect(afterDeleteReport.metrics.removedEmployees).toBe(initialRemoved);
  });

  it("5. Employee Personal Data Scope: Individual skill gaps and progress are employee-isolated", async () => {
    // Find an active employee in TEST_ORG_ID
    const employee = await prisma.employee.findFirst({
      where: { organizationId: TEST_ORG_ID, status: "ACTIVE" },
    });
    expect(employee).toBeDefined();

    const empGaps = await SkillGapService.getEmployeeSkillGaps(TEST_ORG_ID, employee!.id);
    expect(empGaps).toBeDefined();
    expect(empGaps!.employeeId).toBe(employee!.id);
    expect(empGaps!.employeeName).toBe(employee!.name);
    expect(Array.isArray(empGaps!.gaps)).toBe(true);

    for (const g of empGaps!.gaps) {
      expect(typeof g.requiredLevel).toBe("number");
      expect(g.gap).toBe(Math.max(0, g.requiredLevel - (g.currentLevel ?? 0)));
      if (g.currentLevel === null) {
        expect(g.status).toBe("NOT_ASSESSED");
      } else if (g.gap === 0) {
        expect(g.status).toBe("MEETS_REQUIREMENT");
      } else {
        expect(g.status).toBe("NEEDS_IMPROVEMENT");
      }
    }
  });

  it("6. Reassessment & Verification Metrics: Pending reassessments queue reflects real database state", async () => {
    const reassessments = await ReassessmentService.getReassessments(TEST_ORG_ID, {
      status: "PENDING_REASSESSMENT",
    });

    expect(Array.isArray(reassessments.reassessments)).toBe(true);
    expect(typeof reassessments.total).toBe("number");

    for (const r of reassessments.reassessments) {
      expect(r.status).toBe("PENDING_REASSESSMENT");
      expect(r.employeeName).toBeDefined();
      expect(r.courseTitle).toBeDefined();
      expect(r.competencyName).toBeDefined();
      expect(r.requestedLevel).toBeGreaterThan(0);
    }
  });
});
