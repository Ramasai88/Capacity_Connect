import { describe, it, expect } from "vitest";
import { EmployeeService, EmployeeServiceError } from "@/lib/services/employee.service";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
} from "@/lib/validations/employee";
import { calculateSkillGap } from "@/lib/skill-gap/calculateSkillGap";
import { prisma } from "@/lib/db/prisma";

const TEST_ORG_ID = "org-kl-university";

describe("Employee API & Service Layer", () => {
  it("validates valid and invalid employee creation inputs with Zod", () => {
    // Valid input
    const valid = createEmployeeSchema.safeParse({
      name: "Harish Varma",
      email: "harish.varma@klu.edu",
      employeeCode: "EMP-9001",
      department: "Engineering",
      designationId: "des-swe",
      joiningDate: "2024-01-15",
      status: "ACTIVE",
      competencies: [
        { competencyId: "comp-python", currentLevel: 3 },
      ],
    });
    expect(valid.success).toBe(true);

    // Invalid email
    const invalidEmail = createEmployeeSchema.safeParse({
      name: "Harish Varma",
      email: "not-an-email",
      employeeCode: "EMP-9001",
    });
    expect(invalidEmail.success).toBe(false);

    // Invalid level (> 5)
    const invalidLevel = createEmployeeSchema.safeParse({
      name: "Harish Varma",
      email: "harish@klu.edu",
      employeeCode: "EMP-9001",
      competencies: [{ competencyId: "comp-python", currentLevel: 6 }],
    });
    expect(invalidLevel.success).toBe(false);

    // Invalid level (< 1)
    const invalidLowLevel = createEmployeeSchema.safeParse({
      name: "Harish Varma",
      email: "harish@klu.edu",
      employeeCode: "EMP-9001",
      competencies: [{ competencyId: "comp-python", currentLevel: 0 }],
    });
    expect(invalidLowLevel.success).toBe(false);
  });

  it("validates update employee schemas properly", () => {
    const validPartial = updateEmployeeSchema.safeParse({
      name: "Updated Name",
      status: "INACTIVE",
    });
    expect(validPartial.success).toBe(true);

    const invalidEmail = updateEmployeeSchema.safeParse({
      email: "bad-email",
    });
    expect(invalidEmail.success).toBe(false);
  });

  it("retrieves employee list from PostgreSQL via EmployeeService.getEmployees", async () => {
    const result = await EmployeeService.getEmployees(TEST_ORG_ID, {
      page: 1,
      limit: 50,
    });

    expect(result.employees).toBeDefined();
    expect(result.employees.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);

    const ravi = result.employees.find((e) => e.email === "ravi.kumar@capacityconnect.demo");
    expect(ravi).toBeDefined();
    expect(ravi?.employeeCode).toBe("EMP001");
    expect(ravi?.designationTitle).toBe("Software Engineer");
  });

  it("supports search and filtering in EmployeeService.getEmployees", async () => {
    // Search by name
    const searchByName = await EmployeeService.getEmployees(TEST_ORG_ID, {
      search: "Priya",
    });
    expect(searchByName.employees.some((e) => e.name.includes("Priya"))).toBe(true);

    // Filter by department
    const deptResult = await EmployeeService.getEmployees(TEST_ORG_ID, {
      department: "Data & Analytics",
    });
    expect(deptResult.employees.every((e) => e.department === "Data & Analytics")).toBe(true);
  });

  it("retrieves detailed employee profile with dynamic skill gaps via EmployeeService.getEmployeeById", async () => {
    const ravi = await EmployeeService.getEmployeeById(TEST_ORG_ID, "emp-1");

    expect(ravi).not.toBeNull();
    expect(ravi?.name).toBe("Ravi Kumar");
    expect(ravi?.designation?.title).toBe("Software Engineer");
    expect(ravi?.competencies.length).toBeGreaterThan(0);
    expect(ravi?.skillGaps.length).toBeGreaterThan(0);

    // Verify Python skill gap: SWE requires Level 4, Ravi is Level 2 -> Gap = 2
    const pythonGap = ravi?.skillGaps.find((g) => g.competencyName === "Python");
    expect(pythonGap).toBeDefined();
    expect(pythonGap?.requiredLevel).toBe(4);
    expect(pythonGap?.currentLevel).toBe(2);
    expect(pythonGap?.gap).toBe(2);
    expect(pythonGap?.status).toBe("NEEDS_IMPROVEMENT");

    // Verify summary statistics
    expect(ravi?.summary.totalRequired).toBeGreaterThan(0);
    expect(ravi?.summary.needsImprovementCount).toBeGreaterThan(0);
  });

  it("returns null for non-existent employee ID in EmployeeService.getEmployeeById", async () => {
    const nonExistent = await EmployeeService.getEmployeeById(TEST_ORG_ID, "non-existent-emp-id-999");
    expect(nonExistent).toBeNull();
  });

  it("enforces tenant isolation — returns null for wrong organization ID", async () => {
    const wrongOrgResult = await EmployeeService.getEmployeeById("wrong-org-id-12345", "emp-1");
    expect(wrongOrgResult).toBeNull();
  });

  it("creates, updates, and deactivates an employee with database transactions", async () => {
    const testCode = `TEST-${Date.now()}`;
    const testEmail = `test.employee.${Date.now()}@klu.edu`;

    // 1. Create with real seeded designation desig-swe and competency comp-python
    const created = await EmployeeService.createEmployee(TEST_ORG_ID, {
      name: "Integration Test User",
      email: testEmail,
      employeeCode: testCode,
      department: "Engineering",
      designationId: "desig-swe",
      status: "ACTIVE",
      competencies: [
        { competencyId: "comp-python", currentLevel: 3 },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Integration Test User");
    expect(created.email).toBe(testEmail);
    expect(created.employeeCode).toBe(testCode);
    expect(created.competencies.some((c) => c.competencyId === "comp-python" && c.currentLevel === 3)).toBe(true);

    // 2. Prevent duplicate email in organization
    await expect(
      EmployeeService.createEmployee(TEST_ORG_ID, {
        name: "Duplicate Email User",
        email: testEmail,
        employeeCode: `DIFF-${Date.now()}`,
      })
    ).rejects.toThrow(EmployeeServiceError);

    // 3. Prevent duplicate employeeCode in organization
    await expect(
      EmployeeService.createEmployee(TEST_ORG_ID, {
        name: "Duplicate Code User",
        email: `unique.${Date.now()}@klu.edu`,
        employeeCode: testCode,
      })
    ).rejects.toThrow(EmployeeServiceError);

    // 4. Update
    const updated = await EmployeeService.updateEmployee(TEST_ORG_ID, created.id, {
      name: "Integration Test User (Updated)",
      competencies: [
        { competencyId: "comp-python", currentLevel: 4 },
      ],
    });
    expect(updated.name).toBe("Integration Test User (Updated)");
    expect(updated.competencies.find((c) => c.competencyId === "comp-python")?.currentLevel).toBe(4);

    // 5. Deactivate (soft-delete)
    const deactivated = await EmployeeService.deactivateEmployee(TEST_ORG_ID, created.id);
    expect(deactivated.status).toBe("INACTIVE");

    // Clean up test employee from DB
    await prisma.employeeCompetency.deleteMany({ where: { employeeId: created.id } });
    await prisma.competencyAssessmentHistory.deleteMany({ where: { employeeId: created.id } });
    await prisma.employee.delete({ where: { id: created.id } });
  });
});