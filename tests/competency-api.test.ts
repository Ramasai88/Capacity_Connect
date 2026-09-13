import { describe, it, expect } from "vitest";
import { CompetencyService, CompetencyServiceError } from "@/lib/services/competency.service";
import {
  createCompetencySchema,
  updateCompetencySchema,
} from "@/lib/validations/competency";
import { prisma } from "@/lib/db/prisma";

const TEST_ORG_ID = "org-kl-university";

describe("Competency API & Service Layer", () => {
  it("validates valid and invalid competency inputs with Zod", () => {
    // Valid
    const valid = createCompetencySchema.safeParse({
      name: "Cloud Architecture",
      code: "COMP-CLOUD",
      category: "Infrastructure",
      description: "Designing resilient, highly-available cloud systems on AWS and GCP.",
    });
    expect(valid.success).toBe(true);

    // Invalid: empty name
    const invalidName = createCompetencySchema.safeParse({
      name: "",
      code: "COMP-CLOUD",
      category: "Infrastructure",
      description: "Description",
    });
    expect(invalidName.success).toBe(false);

    // Invalid: code with spaces
    const invalidCode = createCompetencySchema.safeParse({
      name: "Cloud Architecture",
      code: "COMP CLOUD",
      category: "Infrastructure",
      description: "Description",
    });
    expect(invalidCode.success).toBe(false);
  });

  it("retrieves competencies list from PostgreSQL with levels and usage counts", async () => {
    const result = await CompetencyService.getCompetencies(TEST_ORG_ID, {
      page: 1,
      limit: 10,
    });

    expect(result.competencies).toBeDefined();
    expect(result.competencies.length).toBeGreaterThanOrEqual(7);
    expect(result.total).toBeGreaterThanOrEqual(7);

    const python = result.competencies.find((c) => c.code === "TECH-PY-01");
    expect(python).toBeDefined();
    expect(python?.name).toBe("Python");
    expect(python?.levels.length).toBe(5);
    expect(python?.usage.designationsCount).toBeGreaterThan(0);
    expect(python?.usage.employeesAssessedCount).toBeGreaterThan(0);
  });

  it("supports category filtering and search in CompetencyService.getCompetencies", async () => {
    // Search
    const searchResult = await CompetencyService.getCompetencies(TEST_ORG_ID, {
      search: "Python",
    });
    expect(searchResult.competencies.some((c) => c.name === "Python")).toBe(true);

    // Category filter
    const techResult = await CompetencyService.getCompetencies(TEST_ORG_ID, {
      category: "Technical / Programming",
    });
    expect(techResult.competencies.every((c) => c.category === "Technical / Programming")).toBe(true);
  });

  it("retrieves detailed competency by ID with 5-level rubric", async () => {
    const comp = await CompetencyService.getCompetencyById(TEST_ORG_ID, "comp-python");

    expect(comp).not.toBeNull();
    expect(comp?.name).toBe("Python");
    expect(comp?.code).toBe("TECH-PY-01");
    expect(comp?.levels.length).toBe(5);

    // Verify level scale 1 to 5
    const levels = comp?.levels.map((l) => l.level) ?? [];
    expect(levels).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns null for non-existent competency ID", async () => {
    const missing = await CompetencyService.getCompetencyById(TEST_ORG_ID, "non-existent-comp-999");
    expect(missing).toBeNull();
  });

  it("enforces tenant isolation — returns null for foreign organization ID", async () => {
    const foreignOrg = await CompetencyService.getCompetencyById("wrong-org-456", "comp-python");
    expect(foreignOrg).toBeNull();
  });

  it("creates, updates, and atomically provisions 5-level scale", async () => {
    const uniqueCode = `COMP-TEST-${Date.now()}`;

    // 1. Create with transaction
    const created = await CompetencyService.createCompetency(TEST_ORG_ID, {
      name: "Distributed Systems Architecture",
      code: uniqueCode,
      category: "System Engineering",
      description: "Principles of consensus, partition tolerance, and microservices.",
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe("Distributed Systems Architecture");
    expect(created.code).toBe(uniqueCode);
    expect(created.levels.length).toBe(5);

    // Verify in database directly
    const dbLevels = await prisma.competencyLevel.findMany({
      where: { competencyId: created.id },
    });
    expect(dbLevels.length).toBe(5);

    // 2. Prevent duplicate code in organization
    await expect(
      CompetencyService.createCompetency(TEST_ORG_ID, {
        name: "Another Name",
        code: uniqueCode,
        category: "System Engineering",
        description: "Duplicate code test",
      })
    ).rejects.toThrow(CompetencyServiceError);

    // 3. Update metadata and level definitions
    const updated = await CompetencyService.updateCompetency(TEST_ORG_ID, created.id, {
      name: "Distributed Systems Architecture (Advanced)",
      levels: [
        {
          level: 5,
          label: "Principal Distributed Architect",
          description: "Leads global cluster designs and custom consensus implementations.",
          behavioralIndicators: ["Designs Raft/Paxos subsystems from scratch"],
        },
      ],
    });

    expect(updated.name).toBe("Distributed Systems Architecture (Advanced)");
    const lvl5 = updated.levels.find((l) => l.level === 5);
    expect(lvl5?.label).toBe("Principal Distributed Architect");

    // Clean up created competency
    await prisma.designationCompetency.deleteMany({ where: { competencyId: created.id } });
    await prisma.competencyLevel.deleteMany({ where: { competencyId: created.id } });
    await prisma.competency.delete({ where: { id: created.id } });
  });

  it("blocks deletion with 409 Conflict when competency is referenced by dependencies", async () => {
    // Python (comp-python) is referenced by SWE designation, employees, and courses
    try {
      await CompetencyService.deleteCompetency(TEST_ORG_ID, "comp-python");
      expect.unreachable("Should have thrown CompetencyServiceError");
    } catch (error: any) {
      expect(error).toBeInstanceOf(CompetencyServiceError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("COMPETENCY_IN_USE");
      expect(error.details?.designationRequirements).toBeGreaterThan(0);
      expect(error.details?.employeeAssessments).toBeGreaterThan(0);
    }
  });

  it("deletes an unreferenced competency safely and cascade-cleans its levels", async () => {
    // 1. Create a standalone unreferenced competency
    const uniqueCode = `COMP-UNUSED-${Date.now()}`;
    const created = await CompetencyService.createCompetency(TEST_ORG_ID, {
      name: "Unused Test Skill",
      code: uniqueCode,
      category: "General",
      description: "Temporary competency for delete verification.",
    });

    // 2. Delete
    const result = await CompetencyService.deleteCompetency(TEST_ORG_ID, created.id);
    expect(result.id).toBe(created.id);

    // 3. Confirm competency and its levels are deleted from PostgreSQL
    const checkComp = await prisma.competency.findUnique({ where: { id: created.id } });
    expect(checkComp).toBeNull();

    const checkLevels = await prisma.competencyLevel.findMany({ where: { competencyId: created.id } });
    expect(checkLevels.length).toBe(0);
  });
});
