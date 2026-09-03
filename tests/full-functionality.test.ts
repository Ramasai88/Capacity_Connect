import { describe, it, expect, beforeEach } from "vitest";
import {
  ROLE_PERMISSIONS,
  hasPermission,
  isRouteAllowed,
} from "@/lib/auth/rbac";
import {
  addEmployeeToStore,
  addCompetencyToStore,
  addDesignationToStore,
  addCourseToStore,
  reviewReassessmentInStore,
  calculateDynamicEmployeeSkillGaps,
  calculateDynamicOrganizationSkillGaps,
  type DemoReassessment,
} from "@/lib/demo/demo-store";
import {
  DEMO_EMPLOYEES,
  DEMO_COMPETENCIES,
  DEMO_DESIGNATIONS,
  DEMO_COURSES,
  type DemoEmployee,
} from "@/lib/demo/data";
import { calculateSkillGap } from "@/lib/skill-gap/calculateSkillGap";

describe("Part 1: Role-Based Access Control Matrix", () => {
  it("verifies ADMIN has full organizational authority", () => {
    expect(hasPermission("ADMIN", "canAddEmployee")).toBe(true);
    expect(hasPermission("ADMIN", "canCreateCompetency")).toBe(true);
    expect(hasPermission("ADMIN", "canCreateDesignation")).toBe(true);
    expect(hasPermission("ADMIN", "canCreateCourse")).toBe(true);
    expect(hasPermission("ADMIN", "canReviewReassessments")).toBe(true);
    expect(hasPermission("ADMIN", "canAccessSettings")).toBe(true);
    expect(isRouteAllowed("ADMIN", "/settings")).toBe(true);
    expect(isRouteAllowed("ADMIN", "/employees")).toBe(true);
  });

  it("verifies MANAGER can review reassessments and view reports, but cannot edit org settings", () => {
    expect(hasPermission("MANAGER", "canReviewReassessments")).toBe(true);
    expect(hasPermission("MANAGER", "canViewReports")).toBe(true);
    expect(hasPermission("MANAGER", "canCreateCourse")).toBe(true);
    expect(hasPermission("MANAGER", "canAddEmployee")).toBe(false);
    expect(hasPermission("MANAGER", "canCreateCompetency")).toBe(false);
    expect(hasPermission("MANAGER", "canAccessSettings")).toBe(false);
    expect(isRouteAllowed("MANAGER", "/reassessments")).toBe(true);
    expect(isRouteAllowed("MANAGER", "/settings")).toBe(false);
  });

  it("verifies EMPLOYEE is restricted to self learning and cannot perform administrative actions", () => {
    expect(hasPermission("EMPLOYEE", "canAddEmployee")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canCreateCompetency")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canCreateDesignation")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canReviewReassessments")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canAccessSettings")).toBe(false);
    expect(isRouteAllowed("EMPLOYEE", "/settings")).toBe(false);
    expect(isRouteAllowed("EMPLOYEE", "/courses")).toBe(true);
  });
});

describe("Part 2 & 3: Employee and Competency Creation Validation", () => {
  it("rejects employee creation with invalid or missing required fields", () => {
    const res1 = addEmployeeToStore({
      name: "",
      email: "test@demo.com",
      employeeCode: "EMP999",
      department: "Eng",
      designationId: "desig-swe",
    });
    expect(res1.success).toBe(false);
    expect(res1.error).toContain("name is required");

    const res2 = addEmployeeToStore({
      name: "John Doe",
      email: "invalid-email",
      employeeCode: "EMP999",
      department: "Eng",
      designationId: "desig-swe",
    });
    expect(res2.success).toBe(false);
    expect(res2.error).toContain("valid email");
  });

  it("rejects competency creation with duplicate code or missing rubric definitions", () => {
    const res = addCompetencyToStore({
      name: "",
      code: "TECH-PY-01", // Duplicate code
      category: "Technical / Programming",
      description: "Python programming",
    });
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});

describe("Part 4 & 5: Designation and Course Creation Validation", () => {
  it("validates designation requirements builder", () => {
    const res = addDesignationToStore({
      title: "",
      code: "NEW-ROLE",
      department: "Engineering",
      description: "Test description",
      requirements: [],
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("title is required");
  });

  it("validates course builder and module requirements", () => {
    const res = addCourseToStore(
      {
        title: "Test Course",
        code: "CRS-TEST",
        description: "Test description",
        category: "Technical",
        competencyId: "comp-python",
        targetLevel: 4,
        durationHours: 10,
      },
      [] // Empty modules
    );
    expect(res.success).toBe(false);
    expect(res.error).toContain("At least one module is required");
  });
});

describe("Part 10: Manager Reassessment Approval & Skill Gap Recalculation", () => {
  it("recalculates skill gap to 0 (MEETS_REQUIREMENT) when manager approves level upgrade", () => {
    // 1. Initial State for SWE Ravi Kumar (Python Level 2 vs Required Level 4 -> Gap = 2)
    const initialGaps = calculateSkillGap(
      [{ competencyId: "comp-python", competencyName: "Python", requiredLevel: 4 }],
      [{ competencyId: "comp-python", currentLevel: 2, assessedAt: "2024-05-10" }]
    );

    expect(initialGaps[0].gap).toBe(2);
    expect(initialGaps[0].status).toBe("NEEDS_IMPROVEMENT");

    // 2. Simulated Manager Approval: Upgrades level from 2 to 4
    const upgradedGaps = calculateSkillGap(
      [{ competencyId: "comp-python", competencyName: "Python", requiredLevel: 4 }],
      [{ competencyId: "comp-python", currentLevel: 4, assessedAt: "2024-06-20" }]
    );

    // 3. Verified Result: Gap is 0 and status is MEETS_REQUIREMENT
    expect(upgradedGaps[0].gap).toBe(0);
    expect(upgradedGaps[0].status).toBe("MEETS_REQUIREMENT");
  });
});
