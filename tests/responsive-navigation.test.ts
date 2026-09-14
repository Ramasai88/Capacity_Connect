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

  it("exposes the complete authorized navigation for MANAGER and excludes Admin-only views", () => {
    const managerItems = navItems.filter(
      (item) => !item.roles || item.roles.includes("MANAGER")
    );
    const managerHrefs = managerItems.map((i) => i.href);

    expect(managerHrefs).toContain("/dashboard");
    expect(managerHrefs).toContain("/employees");
    expect(managerHrefs).toContain("/competencies");
    expect(managerHrefs).toContain("/designations");
    expect(managerHrefs).toContain("/skill-gaps");
    expect(managerHrefs).toContain("/recommendations");
    expect(managerHrefs).toContain("/assistant");
    expect(managerHrefs).toContain("/courses");
    expect(managerHrefs).toContain("/reassessments");
    expect(managerHrefs).toContain("/reports");

    // Manager should NOT have access to Admin settings
    expect(managerHrefs).not.toContain("/settings");
    // Manager should not have employee personal development views
    expect(managerHrefs).not.toContain("/my-development");
    expect(managerHrefs).not.toContain("/my-learning");
  });

  it("exposes the complete authorized navigation for EMPLOYEE and excludes management views", () => {
    const employeeItems = navItems.filter(
      (item) => !item.roles || item.roles.includes("EMPLOYEE")
    );
    const employeeHrefs = employeeItems.map((i) => i.href);

    expect(employeeHrefs).toContain("/dashboard");
    expect(employeeHrefs).toContain("/my-development");
    expect(employeeHrefs).toContain("/skill-gaps");
    expect(employeeHrefs).toContain("/recommendations");
    expect(employeeHrefs).toContain("/assistant");
    expect(employeeHrefs).toContain("/courses");
    expect(employeeHrefs).toContain("/my-learning");

    // Employee should NOT have management / admin views
    expect(employeeHrefs).not.toContain("/employees");
    expect(employeeHrefs).not.toContain("/competencies");
    expect(employeeHrefs).not.toContain("/designations");
    expect(employeeHrefs).not.toContain("/reassessments");
    expect(employeeHrefs).not.toContain("/reports");
    expect(employeeHrefs).not.toContain("/settings");
  });

  it("verifies all navigation items have non-empty labels, valid paths, and icons", () => {
    for (const item of navItems) {
      expect(item.label).toBeTruthy();
      expect(item.href).toMatch(/^\/[a-z0-9-]+$/);
      expect(item.icon).toBeDefined();
    }
  });
});
