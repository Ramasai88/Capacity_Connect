"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DEMO_ORGANIZATION,
  DEFAULT_COMPETENCY_LEVELS,
  DEMO_COMPETENCIES,
  DEMO_DESIGNATIONS,
  DEMO_EMPLOYEES,
  DEMO_COURSES,
  DEMO_ENROLLMENTS,
  type DemoOrganization,
  type DemoCompetency,
  type DemoDesignation,
  type DemoEmployee,
  type DemoCourse,
  type DemoEnrollment,
} from "@/lib/demo/data";

// Re-export types so consumers can import them from demo-store directly
export type {
  DemoOrganization,
  DemoCompetency,
  DemoDesignation,
  DemoEmployee,
  DemoCourse,
  DemoEnrollment,
} from "@/lib/demo/data";
import {
  getCourseCurriculum,
  registerCourseCurriculum,
  type CourseModule,
} from "@/lib/demo/learning-curriculum";
import {
  calculateSkillGap,
  summarizeOrganizationSkillGaps,
  type EmployeeSkillGapSummary,
  type OrganizationSkillGapSummary,
  type CompetencyGapResult,
} from "@/lib/skill-gap/calculateSkillGap";

export interface DemoReassessment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  designationTitle: string;
  courseId: string;
  courseTitle: string;
  competencyId: string;
  competencyName: string;
  previousLevel: number;
  requestedLevel: number;
  status: "PENDING_REASSESSMENT" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerComments?: string;
}

// Initial seed reassessments
export const DEFAULT_REASSESSMENTS: DemoReassessment[] = [
  {
    id: "reassess-1",
    employeeId: "emp-5",
    employeeName: "Sneha Reddy",
    employeeEmail: "sneha.reddy@capacityconnect.demo",
    designationTitle: "Software Engineer",
    courseId: "course-sql-301",
    courseTitle: "Relational Query Optimization & Analytical SQL",
    competencyId: "comp-sql",
    competencyName: "SQL",
    previousLevel: 2,
    requestedLevel: 3,
    status: "PENDING_REASSESSMENT",
    submittedAt: "2024-06-18",
  },
];

// LocalStorage Keys
const KEYS = {
  EMPLOYEES: "capacity_connect_employees_v2",
  COMPETENCIES: "capacity_connect_competencies_v2",
  DESIGNATIONS: "capacity_connect_designations_v2",
  COURSES: "capacity_connect_courses_v2",
  ENROLLMENTS: "capacity_connect_enrollments_v2",
  COMPLETED_MODULES: "capacity_connect_completed_modules_v2",
  REASSESSMENTS: "capacity_connect_reassessments_v2",
  ORGANIZATION: "capacity_connect_org_v2",
};

export const GLOBAL_STATE_CHANGE_EVENT = "capacity_connect_global_state_change";

function dispatchGlobalChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(GLOBAL_STATE_CHANGE_EVENT));
    window.dispatchEvent(new Event("storage"));
  }
}

// ---------------------------------------------------------------------------
// Pure Getters with LocalStorage Fallback & SSR Safety
// ---------------------------------------------------------------------------

export function getStoredEmployees(): DemoEmployee[] {
  if (typeof window === "undefined") return DEMO_EMPLOYEES;
  try {
    const raw = localStorage.getItem(KEYS.EMPLOYEES);
    if (!raw) {
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(DEMO_EMPLOYEES));
      return DEMO_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_EMPLOYEES;
  }
}

export function getStoredCompetencies(): DemoCompetency[] {
  if (typeof window === "undefined") return DEMO_COMPETENCIES;
  try {
    const raw = localStorage.getItem(KEYS.COMPETENCIES);
    if (!raw) {
      localStorage.setItem(KEYS.COMPETENCIES, JSON.stringify(DEMO_COMPETENCIES));
      return DEMO_COMPETENCIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_COMPETENCIES;
  }
}

export function getStoredDesignations(): DemoDesignation[] {
  if (typeof window === "undefined") return DEMO_DESIGNATIONS;
  try {
    const raw = localStorage.getItem(KEYS.DESIGNATIONS);
    if (!raw) {
      localStorage.setItem(KEYS.DESIGNATIONS, JSON.stringify(DEMO_DESIGNATIONS));
      return DEMO_DESIGNATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_DESIGNATIONS;
  }
}

export function getStoredCourses(): DemoCourse[] {
  if (typeof window === "undefined") return DEMO_COURSES;
  try {
    const raw = localStorage.getItem(KEYS.COURSES);
    if (!raw) {
      localStorage.setItem(KEYS.COURSES, JSON.stringify(DEMO_COURSES));
      return DEMO_COURSES;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_COURSES;
  }
}

export function getStoredEnrollments(): DemoEnrollment[] {
  if (typeof window === "undefined") return DEMO_ENROLLMENTS;
  try {
    const raw = localStorage.getItem(KEYS.ENROLLMENTS);
    if (!raw) {
      localStorage.setItem(KEYS.ENROLLMENTS, JSON.stringify(DEMO_ENROLLMENTS));
      return DEMO_ENROLLMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_ENROLLMENTS;
  }
}

export function getStoredCompletedModules(): Record<string, string[]> {
  const defaults: Record<string, string[]> = {
    "course-py-401": ["py-mod-1", "py-mod-2", "py-mod-3", "py-mod-4"],
    "course-jv-401": ["jv-mod-1", "jv-mod-2"],
  };
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(KEYS.COMPLETED_MODULES);
    if (!raw) {
      localStorage.setItem(KEYS.COMPLETED_MODULES, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return defaults;
  }
}

export function getStoredReassessments(): DemoReassessment[] {
  if (typeof window === "undefined") return DEFAULT_REASSESSMENTS;
  try {
    const raw = localStorage.getItem(KEYS.REASSESSMENTS);
    if (!raw) {
      localStorage.setItem(KEYS.REASSESSMENTS, JSON.stringify(DEFAULT_REASSESSMENTS));
      return DEFAULT_REASSESSMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REASSESSMENTS;
  }
}

export function getStoredOrganization(): DemoOrganization {
  if (typeof window === "undefined") return DEMO_ORGANIZATION;
  try {
    const raw = localStorage.getItem(KEYS.ORGANIZATION);
    if (!raw) {
      localStorage.setItem(KEYS.ORGANIZATION, JSON.stringify(DEMO_ORGANIZATION));
      return DEMO_ORGANIZATION;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_ORGANIZATION;
  }
}

export function calculateDynamicEmployeeSkillGaps(
  employeeId: string,
  employees = getStoredEmployees(),
  designations = getStoredDesignations(),
  competencies = getStoredCompetencies()
): EmployeeSkillGapSummary | null {
  const employee = employees.find((e) => e.id === employeeId);
  if (!employee) return null;

  const designation = designations.find((d) => d.id === employee.designationId);
  if (!designation) return null;

  const requiredInputs = designation.requirements.map((req) => {
    const comp = competencies.find((c) => c.id === req.competencyId);
    return {
      competencyId: req.competencyId,
      competencyName: comp?.name ?? req.competencyId,
      category: comp?.category,
      requiredLevel: req.requiredLevel,
    };
  });

  const currentInputs = (employee.competencies || []).map((curr) => ({
    competencyId: curr.competencyId,
    currentLevel: curr.currentLevel,
    assessedAt: curr.assessedAt,
  }));

  const gaps = calculateSkillGap(requiredInputs, currentInputs);

  const meetsRequirementCount = gaps.filter((g) => g.status === "MEETS_REQUIREMENT").length;
  const needsImprovementCount = gaps.filter((g) => g.status === "NEEDS_IMPROVEMENT").length;
  const notAssessedCount = gaps.filter((g) => g.status === "NOT_ASSESSED").length;
  const totalGapSum = gaps.reduce((acc, g) => acc + g.gap, 0);

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    designationTitle: designation.title,
    totalRequired: designation.requirements.length,
    meetsRequirementCount,
    needsImprovementCount,
    notAssessedCount,
    averageGap: gaps.length > 0 ? Number((totalGapSum / gaps.length).toFixed(1)) : 0,
    gaps,
  };
}

export function calculateDynamicOrganizationSkillGaps(
  employees = getStoredEmployees(),
  designations = getStoredDesignations(),
  competencies = getStoredCompetencies()
): {
  employeeSummaries: EmployeeSkillGapSummary[];
  organizationSummary: OrganizationSkillGapSummary;
} {
  const employeeSummaries: EmployeeSkillGapSummary[] = [];

  for (const emp of employees) {
    const summary = calculateDynamicEmployeeSkillGaps(
      emp.id,
      employees,
      designations,
      competencies
    );
    if (summary) {
      employeeSummaries.push(summary);
    }
  }

  const organizationSummary = summarizeOrganizationSkillGaps(employeeSummaries);

  return {
    employeeSummaries,
    organizationSummary,
  };
}

export function addEmployeeToStore(input: {
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  designationId: string;
  status?: "ACTIVE" | "INACTIVE";
  initialAssessments?: { competencyId: string; currentLevel: number }[];
}): { success: boolean; error?: string; employee?: DemoEmployee } {
  const employees = getStoredEmployees();
  const designations = getStoredDesignations();

  if (!input.name?.trim()) return { success: false, error: "Employee name is required" };
  if (!input.email?.trim() || !input.email.includes("@"))
    return { success: false, error: "A valid email address is required" };
  if (!input.employeeCode?.trim())
    return { success: false, error: "Employee code is required" };

  const emailExists = employees.some(
    (e) => e.email.toLowerCase() === input.email.trim().toLowerCase()
  );
  if (emailExists) return { success: false, error: "An employee with this email already exists" };

  const codeExists = employees.some(
    (e) => e.employeeCode.toUpperCase() === input.employeeCode.trim().toUpperCase()
  );
  if (codeExists) return { success: false, error: "An employee with this code already exists" };

  const designation = designations.find((d) => d.id === input.designationId);
  if (!designation) return { success: false, error: "Selected designation was not found" };

  const newEmployee: DemoEmployee = {
    id: `emp-${Date.now()}`,
    employeeCode: input.employeeCode.trim().toUpperCase(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    department: input.department.trim() || designation.department,
    designationId: designation.id,
    designationTitle: designation.title,
    joiningDate: new Date().toISOString().split("T")[0] ?? "2024-06-01",
    status: input.status || "ACTIVE",
    competencies: (input.initialAssessments || []).map((a) => ({
      competencyId: a.competencyId,
      currentLevel: a.currentLevel,
      assessedAt: new Date().toISOString().split("T")[0] ?? "2024-06-01",
      assessedBy: "Administrator",
    })),
  };

  const updated = [newEmployee, ...employees];
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(updated));
    dispatchGlobalChange();
  }

  return { success: true, employee: newEmployee };
}

export function addCompetencyToStore(input: {
  name: string;
  code: string;
  category: "Technical / Programming" | "Data & AI" | "Soft Skills" | "Management";
  description: string;
  levels?: {
    level: number;
    label: string;
    description: string;
    behavioralIndicators: string[];
  }[];
}): { success: boolean; error?: string; competency?: DemoCompetency } {
  const competencies = getStoredCompetencies();

  if (!input.name?.trim()) return { success: false, error: "Competency name is required" };
  if (!input.code?.trim()) return { success: false, error: "Competency code is required" };
  if (!input.description?.trim())
    return { success: false, error: "Competency description is required" };

  const codeExists = competencies.some(
    (c) => c.code.toUpperCase() === input.code.trim().toUpperCase()
  );
  if (codeExists) return { success: false, error: "Competency code already exists" };

  const newCompetency: DemoCompetency = {
    id: `comp-${input.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    category: input.category,
    description: input.description.trim(),
    levels: input.levels || DEFAULT_COMPETENCY_LEVELS,
  };

  const updated = [...competencies, newCompetency];
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.COMPETENCIES, JSON.stringify(updated));
    dispatchGlobalChange();
  }

  return { success: true, competency: newCompetency };
}

export function addDesignationToStore(input: {
  title: string;
  code: string;
  department: string;
  description: string;
  requirements: { competencyId: string; requiredLevel: number }[];
}): { success: boolean; error?: string; designation?: DemoDesignation } {
  const designations = getStoredDesignations();

  if (!input.title?.trim()) return { success: false, error: "Designation title is required" };
  if (!input.code?.trim()) return { success: false, error: "Designation code is required" };
  if (!input.department?.trim()) return { success: false, error: "Department is required" };

  const codeExists = designations.some(
    (d) => d.code.toUpperCase() === input.code.trim().toUpperCase()
  );
  if (codeExists) return { success: false, error: "Designation code already exists" };

  const newDesignation: DemoDesignation = {
    id: `desig-${input.code.toLowerCase()}-${Date.now()}`,
    title: input.title.trim(),
    code: input.code.trim().toUpperCase(),
    department: input.department.trim(),
    description: input.description.trim(),
    requirements: input.requirements || [],
  };

  const updated = [...designations, newDesignation];
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.DESIGNATIONS, JSON.stringify(updated));
    dispatchGlobalChange();
  }

  return { success: true, designation: newDesignation };
}

export function addCourseToStore(
  input: {
    title: string;
    code: string;
    description: string;
    category: string;
    competencyId: string;
    targetLevel: number;
    durationHours: number;
    rating?: number;
    status?: "PUBLISHED" | "DRAFT";
  },
  modules: {
    title: string;
    summary: string;
    durationMinutes: number;
    overview: string;
    keyConcepts: { title: string; description: string; codeSnippet?: string }[];
    practicalExercise: string;
    competencyVerification: string;
  }[]
): { success: boolean; error?: string; course?: DemoCourse } {
  const courses = getStoredCourses();
  const competencies = getStoredCompetencies();

  if (!input.title?.trim()) return { success: false, error: "Course title is required" };
  if (!input.competencyId) return { success: false, error: "Target competency is required" };
  if (input.targetLevel < 1 || input.targetLevel > 5)
    return { success: false, error: "Target level must be between 1 and 5" };
  if (!modules || modules.length === 0)
    return { success: false, error: "At least one module is required" };

  const comp = competencies.find((c) => c.id === input.competencyId);
  const courseId = `course-${input.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

  const newCourse: DemoCourse = {
    id: courseId,
    title: input.title.trim(),
    code: input.code?.trim() || `CRS-${Date.now().toString().slice(-4)}`,
    description: input.description.trim(),
    category: input.category || comp?.category || "Technical",
    competencyId: input.competencyId,
    competencyName: comp?.name || "Competency",
    targetLevel: input.targetLevel,
    durationHours: input.durationHours || 10,
    modulesCount: modules.length,
    status: input.status || "PUBLISHED",
    rating: input.rating || 4.8,
    enrolledCount: 0,
  };

  const courseModules: CourseModule[] = modules.map((m, idx) => ({
    id: `${courseId}-mod-${idx + 1}`,
    courseId,
    order: idx + 1,
    title: m.title,
    summary: m.summary || m.title,
    durationMinutes: m.durationMinutes || 60,
    learningObjectives: [
      `Master core principles of ${m.title}`,
      `Apply Level ${input.targetLevel} architectural patterns`,
    ],
    content: {
      overview: m.overview,
      keyConcepts: m.keyConcepts,
      practicalExercise: m.practicalExercise,
      competencyVerification: m.competencyVerification,
    },
  }));

  registerCourseCurriculum(courseId, {
    courseId,
    courseTitle: newCourse.title,
    targetCompetency: newCourse.competencyName,
    targetLevel: newCourse.targetLevel,
    modules: courseModules,
  });

  const updatedCourses = [newCourse, ...courses];
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.COURSES, JSON.stringify(updatedCourses));
    dispatchGlobalChange();
  }

  return { success: true, course: newCourse };
}

export function updateEmployeeInStore(
  employeeId: string,
  updates: {
    name?: string;
    email?: string;
    department?: string;
    designationId?: string;
    status?: "ACTIVE" | "INACTIVE";
    joiningDate?: string;
  }
): { success: boolean; error?: string; employee?: DemoEmployee } {
  const employees = getStoredEmployees();
  const designations = getStoredDesignations();

  const index = employees.findIndex((e) => e.id === employeeId);
  if (index === -1) return { success: false, error: "Employee not found" };

  const existing = employees[index]!;

  if (updates.email && updates.email.toLowerCase() !== existing.email.toLowerCase()) {
    const emailTaken = employees.some(
      (e) => e.id !== employeeId && e.email.toLowerCase() === updates.email!.toLowerCase()
    );
    if (emailTaken) return { success: false, error: "An employee with this email already exists" };
  }

  let designationTitle = existing.designationTitle;
  let designationId = existing.designationId;
  if (updates.designationId && updates.designationId !== existing.designationId) {
    const desig = designations.find((d) => d.id === updates.designationId);
    if (!desig) return { success: false, error: "Selected designation not found" };
    designationTitle = desig.title;
    designationId = desig.id;
  }

  const updated: DemoEmployee = {
    ...existing,
    name: updates.name?.trim() || existing.name,
    email: updates.email?.trim().toLowerCase() || existing.email,
    department: updates.department?.trim() || existing.department,
    designationId,
    designationTitle,
    status: updates.status || existing.status,
    joiningDate: updates.joiningDate || existing.joiningDate,
  };

  employees[index] = updated;

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
    dispatchGlobalChange();
  }

  return { success: true, employee: updated };
}

export function deactivateEmployeeInStore(
  employeeId: string
): { success: boolean; error?: string } {
  const employees = getStoredEmployees();
  const index = employees.findIndex((e) => e.id === employeeId);
  if (index === -1) return { success: false, error: "Employee not found" };

  employees[index] = { ...employees[index]!, status: "INACTIVE" };

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
    dispatchGlobalChange();
  }

  return { success: true };
}

export function reactivateEmployeeInStore(
  employeeId: string
): { success: boolean; error?: string } {
  const employees = getStoredEmployees();
  const index = employees.findIndex((e) => e.id === employeeId);
  if (index === -1) return { success: false, error: "Employee not found" };

  employees[index] = { ...employees[index]!, status: "ACTIVE" };

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
    dispatchGlobalChange();
  }

  return { success: true };
}

export function permanentlyDeleteEmployeeInStore(
  employeeId: string
): { success: boolean; error?: string } {
  const employees = getStoredEmployees();
  const updated = employees.filter((e) => e.id !== employeeId);

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(updated));
    dispatchGlobalChange();
  }

  return { success: true };
}

export function updateEmployeeCompetencyLevelInStore(
  employeeId: string,
  competencyId: string,
  newLevel: number,
  assessedBy = "Administrator"
): { success: boolean; error?: string } {
  if (newLevel < 1 || newLevel > 5)
    return { success: false, error: "Level must be between 1 and 5" };

  const employees = getStoredEmployees();
  const index = employees.findIndex((e) => e.id === employeeId);
  if (index === -1) return { success: false, error: "Employee not found" };

  const emp = employees[index]!;
  const today = new Date().toISOString().split("T")[0] ?? "2024-06-01";
  const compIndex = emp.competencies.findIndex((c) => c.competencyId === competencyId);
  const updatedComps = [...emp.competencies];

  if (compIndex >= 0) {
    updatedComps[compIndex] = {
      ...updatedComps[compIndex]!,
      currentLevel: newLevel,
      assessedAt: today,
      assessedBy,
    };
  } else {
    updatedComps.push({
      competencyId,
      currentLevel: newLevel,
      assessedAt: today,
      assessedBy,
    });
  }

  employees[index] = { ...emp, competencies: updatedComps };

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
    dispatchGlobalChange();
  }

  return { success: true };
}

export function updateCompetencyInStore(
  competencyId: string,
  updates: {
    name?: string;
    code?: string;
    category?: "Technical / Programming" | "Data & AI" | "Soft Skills" | "Management";
    description?: string;
  }
): { success: boolean; error?: string; competency?: DemoCompetency } {
  const competencies = getStoredCompetencies();
  const index = competencies.findIndex((c) => c.id === competencyId);
  if (index === -1) return { success: false, error: "Competency not found" };

  const existing = competencies[index]!;

  if (updates.code && updates.code.toUpperCase() !== existing.code.toUpperCase()) {
    const codeTaken = competencies.some(
      (c) => c.id !== competencyId && c.code.toUpperCase() === updates.code!.toUpperCase()
    );
    if (codeTaken) return { success: false, error: "Competency code already exists" };
  }

  const updated: DemoCompetency = {
    ...existing,
    name: updates.name?.trim() || existing.name,
    code: updates.code?.trim().toUpperCase() || existing.code,
    category: updates.category || existing.category,
    description: updates.description?.trim() || existing.description,
  };

  competencies[index] = updated;

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.COMPETENCIES, JSON.stringify(competencies));
    dispatchGlobalChange();
  }

  return { success: true, competency: updated };
}

export function deleteCompetencyFromStore(competencyId: string): {
  success: boolean;
  error?: string;
  usedByDesignations?: string[];
  usedByEmployees?: number;
} {
  const competencies = getStoredCompetencies();
  const designations = getStoredDesignations();
  const employees = getStoredEmployees();
  const courses = getStoredCourses();

  const usedByDesignations = designations
    .filter((d) => d.requirements.some((r) => r.competencyId === competencyId))
    .map((d) => d.title);

  const usedByEmployees = employees.filter((e) =>
    e.competencies.some((c) => c.competencyId === competencyId)
  ).length;

  const usedByCourses = courses.filter((c) => c.competencyId === competencyId).length;

  if (usedByDesignations.length > 0 || usedByEmployees > 0 || usedByCourses > 0) {
    const parts: string[] = [];
    if (usedByDesignations.length > 0)
      parts.push(`${usedByDesignations.length} designation(s): ${usedByDesignations.join(", ")}`);
    if (usedByEmployees > 0) parts.push(`${usedByEmployees} employee assessment(s)`);
    if (usedByCourses > 0) parts.push(`${usedByCourses} course(s)`);
    return {
      success: false,
      error: `Cannot delete: competency is used by ${parts.join("; ")}.`,
      usedByDesignations,
      usedByEmployees,
    };
  }

  const updated = competencies.filter((c) => c.id !== competencyId);
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.COMPETENCIES, JSON.stringify(updated));
    dispatchGlobalChange();
  }

  return { success: true };
}

export function updateDesignationInStore(
  designationId: string,
  updates: {
    title?: string;
    code?: string;
    department?: string;
    description?: string;
    requirements?: { competencyId: string; requiredLevel: number }[];
  }
): { success: boolean; error?: string; designation?: DemoDesignation } {
  const designations = getStoredDesignations();
  const index = designations.findIndex((d) => d.id === designationId);
  if (index === -1) return { success: false, error: "Designation not found" };

  const existing = designations[index]!;

  if (updates.code && updates.code.toUpperCase() !== existing.code.toUpperCase()) {
    const codeTaken = designations.some(
      (d) => d.id !== designationId && d.code.toUpperCase() === updates.code!.toUpperCase()
    );
    if (codeTaken) return { success: false, error: "Designation code already exists" };
  }

  const updated: DemoDesignation = {
    ...existing,
    title: updates.title?.trim() || existing.title,
    code: updates.code?.trim().toUpperCase() || existing.code,
    department: updates.department?.trim() || existing.department,
    description: updates.description?.trim() || existing.description,
    requirements: updates.requirements ?? existing.requirements,
  };

  designations[index] = updated;

  if (updates.title && updates.title !== existing.title) {
    const employees = getStoredEmployees();
    const updatedEmployees = employees.map((e) =>
      e.designationId === designationId ? { ...e, designationTitle: updated.title } : e
    );
    if (typeof window !== "undefined") {
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(updatedEmployees));
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.DESIGNATIONS, JSON.stringify(designations));
    dispatchGlobalChange();
  }

  return { success: true, designation: updated };
}

export function deleteDesignationFromStore(designationId: string): {
  success: boolean;
  error?: string;
  assignedEmployeeCount?: number;
} {
  const designations = getStoredDesignations();
  const employees = getStoredEmployees();

  const assignedCount = employees.filter((e) => e.designationId === designationId).length;
  if (assignedCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${assignedCount} employee(s) are currently assigned to this designation. Reassign them first.`,
      assignedEmployeeCount: assignedCount,
    };
  }

  const updated = designations.filter((d) => d.id !== designationId);
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.DESIGNATIONS, JSON.stringify(updated));
    dispatchGlobalChange();
  }

  return { success: true };
}

export function updateCourseInStore(
  courseId: string,
  updates: {
    title?: string;
    description?: string;
    category?: string;
    targetLevel?: number;
    durationHours?: number;
    status?: "PUBLISHED" | "DRAFT";
    modules?: {
      id?: string;
      title: string;
      summary?: string;
      durationMinutes?: number;
      learningObjectives?: string[];
      overview?: string;
      keyConcepts?: any;
      practicalExercise?: string;
      competencyVerification?: string;
    }[];
  }
): { success: boolean; error?: string; course?: DemoCourse } {
  const courses = getStoredCourses();
  const index = courses.findIndex((c) => c.id === courseId);
  if (index === -1) return { success: false, error: "Course not found" };

  const existing = courses[index]!;

  if (updates.targetLevel !== undefined && (updates.targetLevel < 1 || updates.targetLevel > 5))
    return { success: false, error: "Target level must be between 1 and 5" };

  const updated: DemoCourse = {
    ...existing,
    title: updates.title?.trim() || existing.title,
    description: updates.description?.trim() || existing.description,
    category: updates.category?.trim() || existing.category,
    targetLevel: updates.targetLevel ?? existing.targetLevel,
    durationHours: updates.durationHours ?? existing.durationHours,
    status: updates.status ?? existing.status,
    modulesCount: updates.modules ? updates.modules.length : existing.modulesCount,
  };

  if (updates.modules && updates.modules.length > 0) {
    const existingCurriculum = getCourseCurriculum(courseId);
    const existingModules = existingCurriculum.modules || [];
    const existingMap = new Map(existingModules.map((m) => [m.id, m]));

    const courseModules: CourseModule[] = updates.modules.map((m, idx) => {
      const existingMod = m.id ? existingMap.get(m.id) : undefined;
      const modId = m.id && existingMap.has(m.id) ? m.id : existingMod ? existingMod.id : `${courseId}-mod-${idx + 1}`;

      return {
        id: modId,
        order: idx + 1,
        title: m.title.trim(),
        summary: m.summary || m.title,
        durationMinutes: m.durationMinutes || 60,
        learningObjectives: m.learningObjectives || (existingMod?.learningObjectives ?? [`Master ${m.title}`]),
        content: {
          overview: m.overview || existingMod?.content?.overview || m.summary || m.title,
          keyConcepts: m.keyConcepts || existingMod?.content?.keyConcepts || [],
          practicalExercise: m.practicalExercise || existingMod?.content?.practicalExercise || "Complete practical exercise",
          competencyVerification: m.competencyVerification || existingMod?.content?.competencyVerification || "Verify competency standard",
        },
      };
    });

    registerCourseCurriculum(courseId, {
      courseId,
      courseTitle: updated.title,
      targetCompetency: updated.competencyName,
      targetLevel: updated.targetLevel,
      modules: courseModules,
    });
  }

  courses[index] = updated;

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
    dispatchGlobalChange();
  }

  return { success: true, course: updated };
}

export function archiveCourseInStore(courseId: string): {
  success: boolean;
  error?: string;
  activeEnrollmentCount?: number;
} {
  const courses = getStoredCourses();
  const enrollments = getStoredEnrollments();

  const activeEnrollments = enrollments.filter(
    (e) => e.courseId === courseId && e.status === "IN_PROGRESS"
  ).length;

  const index = courses.findIndex((c) => c.id === courseId);
  if (index === -1) return { success: false, error: "Course not found" };

  courses[index] = { ...courses[index]!, status: "DRAFT" };

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
    dispatchGlobalChange();
  }

  return { success: true, activeEnrollmentCount: activeEnrollments };
}

export function updateOrganizationInStore(updates: {
  name?: string;
  description?: string;
  industry?: string;
}): { success: boolean; error?: string; organization?: DemoOrganization } {
  const org = getStoredOrganization();
  const updated: DemoOrganization = {
    ...org,
    name: updates.name?.trim() || org.name,
    description: updates.description?.trim() || org.description,
    industry: updates.industry?.trim() || org.industry,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.ORGANIZATION, JSON.stringify(updated));
    dispatchGlobalChange();
  }

  return { success: true, organization: updated };
}

export function enrollInCourse(
  course: DemoCourse,
  employeeId = "emp-1"
): { success: boolean; isNew: boolean; enrollment: DemoEnrollment } {
  const enrollments = getStoredEnrollments();
  const existing = enrollments.find(
    (e) => e.courseId === course.id && e.employeeId === employeeId
  );

  if (existing) {
    return { success: true, isNew: false, enrollment: existing };
  }

  const curriculum = getCourseCurriculum(course.id);
  const newEnrollment: DemoEnrollment = {
    id: `enroll-${Date.now()}`,
    employeeId,
    courseId: course.id,
    courseTitle: course.title ?? "Untitled Course",
    competencyName: course.competencyName ?? "Competency",
    enrolledAt: new Date().toISOString().split("T")[0] ?? "2024-06-01",
    progressPercent: 0,
    completedLessons: 0,
    totalLessons: curriculum.modules.length,
    status: "IN_PROGRESS",
  };

  const updated = [newEnrollment, ...enrollments];
  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.ENROLLMENTS, JSON.stringify(updated));

    const completedMap = getStoredCompletedModules();
    if (!completedMap[course.id]) {
      completedMap[course.id] = [];
      localStorage.setItem(KEYS.COMPLETED_MODULES, JSON.stringify(completedMap));
    }
    dispatchGlobalChange();
  }

  return { success: true, isNew: true, enrollment: newEnrollment };
}

export function completeModuleAndTriggerReassessment(
  courseId: string,
  moduleId: string,
  employeeId = "emp-1"
) {
  const completedMap = getStoredCompletedModules();
  const existingCompleted = completedMap[courseId] ?? [];

  if (!existingCompleted.includes(moduleId)) {
    completedMap[courseId] = [...existingCompleted, moduleId];
  }

  const enrollments = getStoredEnrollments();
  const curriculum = getCourseCurriculum(courseId);
  const totalCount = curriculum.modules.length;
  const newCompletedCount = (completedMap[courseId] ?? []).length;
  const newPercent = Math.min(100, Math.round((newCompletedCount / totalCount) * 100));
  const isDone = newCompletedCount >= totalCount && totalCount > 0;

  const updatedEnrollments = enrollments.map((e) => {
    if (e.courseId === courseId && e.employeeId === employeeId) {
      return {
        ...e,
        completedLessons: newCompletedCount,
        progressPercent: newPercent,
        status: isDone ? ("COMPLETED" as const) : ("IN_PROGRESS" as const),
      };
    }
    return e;
  });

  if (isDone) {
    const reassessments = getStoredReassessments();
    const course = getStoredCourses().find((c) => c.id === courseId);
    const employee = getStoredEmployees().find((e) => e.id === employeeId);

    const alreadySubmitted = reassessments.some(
      (r) => r.courseId === courseId && r.employeeId === employeeId
    );

    if (!alreadySubmitted && course && employee) {
      const currentComp = employee.competencies.find(
        (c) => c.competencyId === course.competencyId
      );
      const prevLevel = currentComp?.currentLevel ?? 1;

      const newReassessment: DemoReassessment = {
        id: `reassess-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        designationTitle: employee.designationTitle,
        courseId: course.id,
        courseTitle: course.title,
        competencyId: course.competencyId,
        competencyName: course.competencyName,
        previousLevel: prevLevel,
        requestedLevel: course.targetLevel,
        status: "PENDING_REASSESSMENT",
        submittedAt: new Date().toISOString().split("T")[0] ?? "2024-06-01",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(
          KEYS.REASSESSMENTS,
          JSON.stringify([newReassessment, ...reassessments])
        );
      }
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.COMPLETED_MODULES, JSON.stringify(completedMap));
    localStorage.setItem(KEYS.ENROLLMENTS, JSON.stringify(updatedEnrollments));
    dispatchGlobalChange();
  }

  return {
    completedCount: newCompletedCount,
    totalCount,
    progressPercent: newPercent,
    isCompleted: isDone,
  };
}

export function reviewReassessmentInStore(
  reassessmentId: string,
  action: "APPROVE" | "REJECT",
  reviewerName = "Sarah Jenkins",
  comments?: string
): { success: boolean; message: string; reassessment?: DemoReassessment } {
  const reassessments = getStoredReassessments();
  const index = reassessments.findIndex((r) => r.id === reassessmentId);

  if (index === -1) {
    return { success: false, message: "Reassessment request not found" };
  }

  const req = reassessments[index];
  if (!req) {
    return { success: false, message: "Reassessment request is invalid" };
  }

  const today = new Date().toISOString().split("T")[0] ?? "2024-06-01";

  if (action === "APPROVE") {
    const employees = getStoredEmployees();
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === req.employeeId) {
        const compIndex = emp.competencies.findIndex(
          (c) => c.competencyId === req.competencyId
        );
        let updatedComps = [...emp.competencies];

        if (compIndex >= 0) {
          const prev = updatedComps[compIndex];
          if (prev) {
            updatedComps[compIndex] = {
              ...prev,
              currentLevel: req.requestedLevel,
              assessedAt: today,
              assessedBy: reviewerName,
            };
          }
        } else {
          updatedComps.push({
            competencyId: req.competencyId,
            currentLevel: req.requestedLevel,
            assessedAt: today,
            assessedBy: reviewerName,
          });
        }

        return {
          ...emp,
          competencies: updatedComps,
        };
      }
      return emp;
    });

    const updatedReassessment: DemoReassessment = {
      ...req,
      status: "APPROVED",
      reviewedAt: today,
      reviewedBy: reviewerName,
      reviewerComments: comments || "Approved after full verification of course completion and practical exercise benchmarks.",
    };

    reassessments[index] = updatedReassessment;

    if (typeof window !== "undefined") {
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(updatedEmployees));
      localStorage.setItem(KEYS.REASSESSMENTS, JSON.stringify(reassessments));
      dispatchGlobalChange();
    }

    return {
      success: true,
      message: `Successfully approved! ${req.employeeName}'s ${req.competencyName} competency level upgraded from Level ${req.previousLevel} to Level ${req.requestedLevel}. Skill gap is now resolved.`,
      reassessment: updatedReassessment,
    };
  } else {
    const updatedReassessment: DemoReassessment = {
      ...req,
      status: "REJECTED",
      reviewedAt: today,
      reviewedBy: reviewerName,
      reviewerComments: comments || "Additional project demonstration required before level elevation.",
    };

    reassessments[index] = updatedReassessment;

    if (typeof window !== "undefined") {
      localStorage.setItem(KEYS.REASSESSMENTS, JSON.stringify(reassessments));
      dispatchGlobalChange();
    }

    return {
      success: true,
      message: `Reassessment request marked as rejected.`,
      reassessment: updatedReassessment,
    };
  }
}

export function resetDemoStoreToDefaults() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(DEMO_EMPLOYEES));
  localStorage.setItem(KEYS.COMPETENCIES, JSON.stringify(DEMO_COMPETENCIES));
  localStorage.setItem(KEYS.DESIGNATIONS, JSON.stringify(DEMO_DESIGNATIONS));
  localStorage.setItem(KEYS.COURSES, JSON.stringify(DEMO_COURSES));
  localStorage.setItem(KEYS.ENROLLMENTS, JSON.stringify(DEMO_ENROLLMENTS));
  localStorage.setItem(
    KEYS.COMPLETED_MODULES,
    JSON.stringify({
      "course-py-401": ["py-mod-1", "py-mod-2", "py-mod-3", "py-mod-4"],
      "course-jv-401": ["jv-mod-1", "jv-mod-2"],
    })
  );
  localStorage.setItem(KEYS.REASSESSMENTS, JSON.stringify(DEFAULT_REASSESSMENTS));
  localStorage.setItem(KEYS.ORGANIZATION, JSON.stringify(DEMO_ORGANIZATION));
  dispatchGlobalChange();
}

export function useDemoStore() {
  const [employees, setEmployees] = useState<DemoEmployee[]>(DEMO_EMPLOYEES);
  const [competencies, setCompetencies] = useState<DemoCompetency[]>(DEMO_COMPETENCIES);
  const [designations, setDesignations] = useState<DemoDesignation[]>(DEMO_DESIGNATIONS);
  const [courses, setCourses] = useState<DemoCourse[]>(DEMO_COURSES);
  const [enrollments, setEnrollments] = useState<DemoEnrollment[]>(DEMO_ENROLLMENTS);
  const [completedModules, setCompletedModules] = useState<Record<string, string[]>>({});
  const [reassessments, setReassessments] = useState<DemoReassessment[]>(DEFAULT_REASSESSMENTS);
  const [organization, setOrganization] = useState<DemoOrganization>(DEMO_ORGANIZATION);
  const [isHydrated, setIsHydrated] = useState(false);

  const refresh = useCallback(() => {
    const emps = getStoredEmployees();
    const comps = getStoredCompetencies();
    const desigs = getStoredDesignations();
    const crss = getStoredCourses();
    const enrs = getStoredEnrollments();
    const mods = getStoredCompletedModules();
    const reas = getStoredReassessments();
    const org = getStoredOrganization();

    setEmployees(emps);
    setCompetencies(comps);
    setDesignations(desigs);
    setCourses(crss);
    setEnrollments(enrs);
    setCompletedModules(mods);
    setReassessments(reas);
    setOrganization(org);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener(GLOBAL_STATE_CHANGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(GLOBAL_STATE_CHANGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  const { employeeSummaries, organizationSummary } = calculateDynamicOrganizationSkillGaps(
    employees,
    designations,
    competencies
  );

  return {
    isHydrated,
    employees,
    competencies,
    designations,
    courses,
    enrollments,
    completedModules,
    reassessments,
    organization,
    employeeSummaries,
    organizationSummary,
    addEmployee: addEmployeeToStore,
    addCompetency: addCompetencyToStore,
    addDesignation: addDesignationToStore,
    addCourse: addCourseToStore,
    updateEmployee: updateEmployeeInStore,
    deactivateEmployee: deactivateEmployeeInStore,
    reactivateEmployee: reactivateEmployeeInStore,
    permanentlyDeleteEmployee: permanentlyDeleteEmployeeInStore,
    updateEmployeeCompetencyLevel: updateEmployeeCompetencyLevelInStore,
    updateCompetency: updateCompetencyInStore,
    updateDesignation: updateDesignationInStore,
    updateCourse: updateCourseInStore,
    updateOrganization: updateOrganizationInStore,
    deleteCompetency: deleteCompetencyFromStore,
    deleteDesignation: deleteDesignationFromStore,
    archiveCourse: archiveCourseInStore,
    enrollCourse: (course: DemoCourse, empId?: string) => enrollInCourse(course, empId),
    completeModule: (courseId: string, moduleId: string, empId?: string) =>
      completeModuleAndTriggerReassessment(courseId, moduleId, empId),
    reviewReassessment: reviewReassessmentInStore,
    resetToDefaults: resetDemoStoreToDefaults,
    refresh,
  };
}
