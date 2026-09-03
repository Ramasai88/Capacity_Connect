import { describe, it, expect } from "vitest";
import { DesignationService, DesignationServiceError } from "@/lib/services/designation.service";
import {
  createDesignationSchema,
  updateDesignationSchema,
} from "@/lib/validations/designation";
import { prisma } from "@/lib/db/prisma";

const TEST_ORG_ID = "org-kl-university";

describe("Designation API & Service Layer", () => {
  it("validates valid and invalid designation inputs with Zod", () => {
    // Valid
    const valid = createDesignationSchema.safeParse({
      title: "DevOps Engineer",
      code: "DEVOPS",
      department: "Platform Engineering",
      description: "Automates CI/CD, Kubernetes clusters, and infrastructure as code.",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 3 },
      ],
    });
    expect(valid.success).toBe(true);

    // Invalid: empty title
    const invalidTitle = createDesignationSchema.safeParse({
      title: "",
      code: "DEVOPS",
    });
    expect(invalidTitle.success).toBe(false);

    // Invalid: duplicate competency requirements
    const duplicateComps = createDesignationSchema.safeParse({
      title: "DevOps Engineer",
      code: "DEVOPS",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 3 },
        { competencyId: "comp-python", requiredLevel: 4 },
      ],
    });
    expect(duplicateComps.success).toBe(false);

    // Invalid: level > 5
    const highLevel = createDesignationSchema.safeParse({
      title: "DevOps Engineer",
      code: "DEVOPS",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 6 },
      ],
    });
    expect(highLevel.success).toBe(false);

    // Invalid: level < 1
    const lowLevel = createDesignationSchema.safeParse({
      title: "DevOps Engineer",
      code: "DEVOPS",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 0 },
      ],
    });
    expect(lowLevel.success).toBe(false);
  });

  it("retrieves designations list from PostgreSQL with requirements and employee counts", async () => {
    const result = await DesignationService.getDesignations(TEST_ORG_ID, {
      page: 1,
      limit: 10,
    });

    expect(result.designations).toBeDefined();
    expect(result.designations.length).toBeGreaterThanOrEqual(4);
    expect(result.total).toBeGreaterThanOrEqual(4);

    const swe = result.designations.find((d) => d.code === "SWE");
    expect(swe).toBeDefined();
    expect(swe?.title).toBe("Software Engineer");
    expect(swe?.requirements.length).toBeGreaterThanOrEqual(4);
    expect(swe?.assignedEmployeesCount).toBeGreaterThanOrEqual(1);
  });

  it("supports search and department filtering in DesignationService.getDesignations", async () => {
    // Search
    const searchResult = await DesignationService.getDesignations(TEST_ORG_ID, {
      search: "Data Scientist",
    });
    expect(searchResult.designations.some((d) => d.title === "Data Scientist")).toBe(true);

    // Filter by department
    const engResult = await DesignationService.getDesignations(TEST_ORG_ID, {
      department: "Engineering",
    });
    expect(engResult.designations.every((d) => d.department === "Engineering")).toBe(true);
  });

  it("retrieves detailed designation by ID with all competency requirements", async () => {
    const des = await DesignationService.getDesignationById(TEST_ORG_ID, "desig-swe");

    expect(des).not.toBeNull();
    expect(des?.title).toBe("Software Engineer");
    expect(des?.code).toBe("SWE");
    expect(des?.requirements.length).toBeGreaterThanOrEqual(4);

    const pyReq = des?.requirements.find((r) => r.competencyId === "comp-python");
    expect(pyReq).toBeDefined();
    expect(pyReq?.requiredLevel).toBe(4);
    expect(pyReq?.competencyName).toBe("Python");
  });

  it("returns null for non-existent designation ID", async () => {
    const missing = await DesignationService.getDesignationById(TEST_ORG_ID, "non-existent-desig-999");
    expect(missing).toBeNull();
  });

  it("enforces tenant isolation — returns null for wrong organization ID", async () => {
    const foreignOrg = await DesignationService.getDesignationById("foreign-org-999", "desig-swe");
    expect(foreignOrg).toBeNull();
  });

  it("rejects invalid or cross-organization competency IDs during creation", async () => {
    await expect(
      DesignationService.createDesignation(TEST_ORG_ID, {
        title: "Security Engineer",
        code: `SEC-${Date.now()}`,
        department: "Security",
        competencyRequirements: [
          { competencyId: "non-existent-comp-id", requiredLevel: 4 },
        ],
      })
    ).rejects.toThrow(DesignationServiceError);
  });

  it("creates, updates, and atomically replaces competency requirements", async () => {
    const uniqueCode = `ARCH-${Date.now()}`;

    // 1. Create with atomic transaction
    const created = await DesignationService.createDesignation(TEST_ORG_ID, {
      title: "Solutions Architect",
      code: uniqueCode,
      department: "Enterprise Architecture",
      description: "Guides technical roadmap and integration standards.",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 4 },
        { competencyId: "comp-sql", requiredLevel: 3 },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe("Solutions Architect");
    expect(created.requirements.length).toBe(2);

    // Verify in database
    const dbReqs = await prisma.designationCompetency.findMany({
      where: { designationId: created.id },
    });
    expect(dbReqs.length).toBe(2);

    // 2. Prevent duplicate code in organization
    await expect(
      DesignationService.createDesignation(TEST_ORG_ID, {
        title: "Duplicate Architect",
        code: uniqueCode,
        department: "Architecture",
      })
    ).rejects.toThrow(DesignationServiceError);

    // 3. Update metadata and replace requirement set
    const updated = await DesignationService.updateDesignation(TEST_ORG_ID, created.id, {
      title: "Principal Solutions Architect",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 5 },
        { competencyId: "comp-leadership", requiredLevel: 4 },
      ],
    });

    expect(updated.title).toBe("Principal Solutions Architect");
    expect(updated.requirements.length).toBe(2);
    expect(updated.requirements.find((r) => r.competencyId === "comp-python")?.requiredLevel).toBe(5);
    expect(updated.requirements.find((r) => r.competencyId === "comp-leadership")?.requiredLevel).toBe(4);
    // Old comp-sql requirement should have been removed
    expect(updated.requirements.some((r) => r.competencyId === "comp-sql")).toBe(false);

    // Clean up created designation
    await prisma.designationCompetency.deleteMany({ where: { designationId: created.id } });
    await prisma.designation.delete({ where: { id: created.id } });
  });

  it("blocks deletion with 409 Conflict when employees are assigned to the designation", async () => {
    // Software Engineer (desig-swe) has Ravi Kumar assigned
    try {
      await DesignationService.deleteDesignation(TEST_ORG_ID, "desig-swe");
      expect.unreachable("Should have thrown DesignationServiceError");
    } catch (error: any) {
      expect(error).toBeInstanceOf(DesignationServiceError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("DESIGNATION_IN_USE");
      expect(error.details?.assignedEmployeesCount).toBeGreaterThan(0);
    }
  });

  it("deletes an unassigned designation safely and cascade-removes requirements", async () => {
    // 1. Create a standalone unassigned designation
    const uniqueCode = `TEMP-${Date.now()}`;
    const created = await DesignationService.createDesignation(TEST_ORG_ID, {
      title: "Temporary Role",
      code: uniqueCode,
      department: "Operations",
      competencyRequirements: [
        { competencyId: "comp-python", requiredLevel: 2 },
      ],
    });

    // 2. Delete
    const result = await DesignationService.deleteDesignation(TEST_ORG_ID, created.id);
    expect(result.id).toBe(created.id);

    // 3. Confirm deletion in PostgreSQL
    const checkDes = await prisma.designation.findUnique({ where: { id: created.id } });
    expect(checkDes).toBeNull();

    const checkReqs = await prisma.designationCompetency.findMany({ where: { designationId: created.id } });
    expect(checkReqs.length).toBe(0);
  });
});
