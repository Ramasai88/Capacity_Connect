import { describe, it, expect } from "vitest";
import {
  calculateSkillGap,
  summarizeOrganizationSkillGaps,
  type RequiredCompetencyInput,
  type CurrentCompetencyInput,
} from "@/lib/skill-gap/calculateSkillGap";

describe("Skill Gap Engine (calculateSkillGap)", () => {
  it("calculates gap when current level is lower than required level", () => {
    const required: RequiredCompetencyInput[] = [
      { competencyId: "comp-python", competencyName: "Python", requiredLevel: 4 },
    ];
    const current: CurrentCompetencyInput[] = [
      { competencyId: "comp-python", currentLevel: 2 },
    ];

    const results = calculateSkillGap(required, current);

    expect(results).toHaveLength(1);
    expect(results[0].competencyId).toBe("comp-python");
    expect(results[0].requiredLevel).toBe(4);
    expect(results[0].currentLevel).toBe(2);
    expect(results[0].gap).toBe(2); // max(0, 4 - 2) = 2
    expect(results[0].status).toBe("NEEDS_IMPROVEMENT");
  });

  it("calculates zero gap when current level equals required level", () => {
    const required: RequiredCompetencyInput[] = [
      { competencyId: "comp-sql", competencyName: "SQL", requiredLevel: 3 },
    ];
    const current: CurrentCompetencyInput[] = [
      { competencyId: "comp-sql", currentLevel: 3 },
    ];

    const results = calculateSkillGap(required, current);

    expect(results[0].gap).toBe(0); // max(0, 3 - 3) = 0
    expect(results[0].status).toBe("MEETS_REQUIREMENT");
  });

  it("calculates zero gap when current level exceeds required level", () => {
    const required: RequiredCompetencyInput[] = [
      { competencyId: "comp-communication", competencyName: "Communication", requiredLevel: 3 },
    ];
    const current: CurrentCompetencyInput[] = [
      { competencyId: "comp-communication", currentLevel: 5 },
    ];

    const results = calculateSkillGap(required, current);

    expect(results[0].gap).toBe(0); // max(0, 3 - 5) = 0
    expect(results[0].status).toBe("MEETS_REQUIREMENT");
  });

  it("handles unassessed competency (null level) as gap equal to required level", () => {
    const required: RequiredCompetencyInput[] = [
      { competencyId: "comp-ml", competencyName: "Machine Learning", requiredLevel: 4 },
    ];
    const current: CurrentCompetencyInput[] = [];

    const results = calculateSkillGap(required, current);

    expect(results[0].currentLevel).toBeNull();
    expect(results[0].gap).toBe(4);
    expect(results[0].status).toBe("NOT_ASSESSED");
  });

  it("correctly evaluates multiple mixed competencies for an employee", () => {
    const required: RequiredCompetencyInput[] = [
      { competencyId: "comp-python", competencyName: "Python", requiredLevel: 4 },
      { competencyId: "comp-java", competencyName: "Java", requiredLevel: 4 },
      { competencyId: "comp-sql", competencyName: "SQL", requiredLevel: 3 },
      { competencyId: "comp-com", competencyName: "Communication", requiredLevel: 3 },
    ];

    const current: CurrentCompetencyInput[] = [
      { competencyId: "comp-python", currentLevel: 2 }, // Gap 2
      { competencyId: "comp-java", currentLevel: 3 },   // Gap 1
      { competencyId: "comp-sql", currentLevel: 3 },    // Gap 0
      { competencyId: "comp-com", currentLevel: 2 },    // Gap 1
    ];

    const results = calculateSkillGap(required, current);

    expect(results).toHaveLength(4);
    expect(results.find((r) => r.competencyId === "comp-python")?.gap).toBe(2);
    expect(results.find((r) => r.competencyId === "comp-java")?.gap).toBe(1);
    expect(results.find((r) => r.competencyId === "comp-sql")?.gap).toBe(0);
    expect(results.find((r) => r.competencyId === "comp-com")?.gap).toBe(1);
  });
});
