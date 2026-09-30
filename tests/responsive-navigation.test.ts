import { describe, it, expect } from "vitest";
import { navItems } from "@/components/layout/sidebar";

describe("Responsive Role-Based Navigation Architecture", () => {
  it("maintains a single source of truth for all role-based navigation items", () => {
    expect(navItems).toBeDefined();
    expect(Array.isArray(navItems)).toBe(true);
    expect(navItems.length).toBeGreaterThanOrEqual(10);
  });

  it("exposes the complete authorized navigation for ADMIN", () => {
    const adminItems = navItems.filter(
      (item) => !item.roles || item.roles.includes("ADMIN")
    );
    const adminHrefs = adminItems.map((i) => i.href);

    expect(adminHrefs).toContain("/dashboard");
    expect(adminHrefs).toContain("/employees");
    expect(adminHrefs).toContain("/competencies");
    expect(adminHrefs).toContain("/designations");
    expect(adminHrefs).toContain("/skill-gaps");
    expect(adminHrefs).toContain("/recommendations");
    expect(adminHrefs).toContain("/assistant");
    expect(adminHrefs).toContain("/courses");
    expect(adminHrefs).toContain("/reassessments");
    expect(adminHrefs).toContain("/reports");
    expect(adminHrefs).toContain("/settings");

    // Admin should not have employee personal development views
    expect(adminHrefs).not.toContain("/my-development");
    expect(adminHrefs).not.toContain("/my-learning");
  });

  it("exposes the complete authorized navigation for TRAINER and excludes Admin-only views", () => {
    const trainerItems = navItems.filter(
      (item) => !item.roles || item.roles.includes("TRAINER")
    );
    const trainerHrefs = trainerItems.map((i) => i.href);

    expect(trainerHrefs).toContain("/dashboard");
    expect(trainerHrefs).toContain("/employees");
    expect(trainerHrefs).toContain("/competencies");
    expect(trainerHrefs).toContain("/designations");
    expect(trainerHrefs).toContain("/skill-gaps");
    expect(trainerHrefs).toContain("/recommendations");
    expect(trainerHrefs).toContain("/assistant");
    expect(trainerHrefs).toContain("/courses");
    expect(trainerHrefs).toContain("/reassessments");
    expect(trainerHrefs).toContain("/reports");

    // Trainer should NOT have access to Admin settings
    expect(trainerHrefs).not.toContain("/settings");
    // Trainer should not have trainee personal development views
    expect(trainerHrefs).not.toContain("/my-development");
    expect(trainerHrefs).not.toContain("/my-learning");
  });

  it("exposes the complete authorized navigation for TRAINEE and excludes management views", () => {
    const traineeItems = navItems.filter(
      (item) => !item.roles || item.roles.includes("TRAINEE")
    );
    const traineeHrefs = traineeItems.map((i) => i.href);

    expect(traineeHrefs).toContain("/dashboard");
    expect(traineeHrefs).toContain("/my-development");
    expect(traineeHrefs).toContain("/skill-gaps");
    expect(traineeHrefs).toContain("/recommendations");
    expect(traineeHrefs).toContain("/assistant");
    expect(traineeHrefs).toContain("/courses");
    expect(traineeHrefs).toContain("/my-learning");

    // Trainee should NOT have management / admin views
    expect(traineeHrefs).not.toContain("/employees");
    expect(traineeHrefs).not.toContain("/competencies");
    expect(traineeHrefs).not.toContain("/designations");
    expect(traineeHrefs).not.toContain("/reassessments");
    expect(traineeHrefs).not.toContain("/reports");
    expect(traineeHrefs).not.toContain("/settings");
  });

  it("verifies all navigation items have non-empty labels, valid paths, and icons", () => {
    for (const item of navItems) {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^(\/[a-z0-9-]+)+$/);
      expect(item.icon).toBeDefined();
    }
  });
});
