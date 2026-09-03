import type {
  DemoEmployee,
  DemoCompetency,
  DemoDesignation,
  DemoCourse,
} from "@/lib/demo/data";
import type { EmployeeSkillGapSummary, OrganizationSkillGapSummary } from "@/lib/skill-gap/calculateSkillGap";

/**
 * Triggers a browser download of a CSV file.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * 1. Export Employees CSV
 */
export function exportEmployeesCSV(
  employees: DemoEmployee[],
  employeeSummaries: EmployeeSkillGapSummary[]
) {
  const headers = [
    "Employee Code",
    "Full Name",
    "Email",
    "Department",
    "Designation",
    "Status",
    "Joining Date",
    "Assessed Competencies",
    "Open Skill Gaps",
  ];

  const rows = employees.map((emp) => {
    const summary = employeeSummaries.find((s) => s.employeeId === emp.id);
    const openGaps = summary ? summary.needsImprovementCount + summary.notAssessedCount : 0;

    return [
      escapeCSV(emp.employeeCode),
      escapeCSV(emp.name),
      escapeCSV(emp.email),
      escapeCSV(emp.department),
      escapeCSV(emp.designationTitle),
      escapeCSV(emp.status),
      escapeCSV(emp.joiningDate),
      escapeCSV((emp.competencies || []).length),
      escapeCSV(openGaps),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(`CapacityConnect_Employees_${new Date().toISOString().split("T")[0]}.csv`, csv);
}

/**
 * 2. Export Skill Gap Analysis CSV
 */
export function exportSkillGapCSV(employeeSummaries: EmployeeSkillGapSummary[]) {
  const headers = [
    "Employee Name",
    "Designation",
    "Competency",
    "Category",
    "Required Level",
    "Current Level",
    "Identified Gap",
    "Status",
  ];

  const rows: string[] = [];
  for (const emp of employeeSummaries) {
    for (const gap of emp.gaps) {
      rows.push(
        [
          escapeCSV(emp.employeeName),
          escapeCSV(emp.designationTitle),
          escapeCSV(gap.competencyName),
          escapeCSV(gap.category || "Technical"),
          escapeCSV(`Level ${gap.requiredLevel}`),
          escapeCSV(gap.currentLevel !== null ? `Level ${gap.currentLevel}` : "Not Assessed"),
          escapeCSV(gap.gap > 0 ? `${gap.gap}` : "0"),
          escapeCSV(gap.status),
        ].join(",")
      );
    }
  }

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(`CapacityConnect_SkillGapAnalysis_${new Date().toISOString().split("T")[0]}.csv`, csv);
}

/**
 * 3. Export Competencies CSV
 */
export function exportCompetenciesCSV(competencies: DemoCompetency[]) {
  const headers = [
    "Code",
    "Competency Name",
    "Category",
    "Description",
    "Level 1 Definition",
    "Level 2 Definition",
    "Level 3 Definition",
    "Level 4 Definition",
    "Level 5 Definition",
  ];

  const rows = competencies.map((comp) => {
    const l1 = comp.levels?.find((l) => l.level === 1)?.description || "";
    const l2 = comp.levels?.find((l) => l.level === 2)?.description || "";
    const l3 = comp.levels?.find((l) => l.level === 3)?.description || "";
    const l4 = comp.levels?.find((l) => l.level === 4)?.description || "";
    const l5 = comp.levels?.find((l) => l.level === 5)?.description || "";

    return [
      escapeCSV(comp.code),
      escapeCSV(comp.name),
      escapeCSV(comp.category),
      escapeCSV(comp.description),
      escapeCSV(l1),
      escapeCSV(l2),
      escapeCSV(l3),
      escapeCSV(l4),
      escapeCSV(l5),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(`CapacityConnect_Competencies_${new Date().toISOString().split("T")[0]}.csv`, csv);
}

/**
 * 4. Export Designations / Competency Matrix CSV
 */
export function exportDesignationsCSV(
  designations: DemoDesignation[],
  competencies: DemoCompetency[]
) {
  const headers = [
    "Designation Code",
    "Title",
    "Department",
    "Description",
    "Required Competencies & Target Levels",
  ];

  const rows = designations.map((desig) => {
    const reqStr = (desig.requirements || [])
      .map((r) => {
        const comp = competencies.find((c) => c.id === r.competencyId);
        return `${comp?.name || r.competencyId}: Level ${r.requiredLevel}`;
      })
      .join(" | ");

    return [
      escapeCSV(desig.code),
      escapeCSV(desig.title),
      escapeCSV(desig.department),
      escapeCSV(desig.description),
      escapeCSV(reqStr),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(`CapacityConnect_Designations_Matrix_${new Date().toISOString().split("T")[0]}.csv`, csv);
}

/**
 * 5. Export Courses CSV
 */
export function exportCoursesCSV(courses: DemoCourse[]) {
  const headers = [
    "Course Code",
    "Course Title",
    "Category",
    "Target Competency",
    "Target Level",
    "Duration (Hours)",
    "Modules Count",
    "Status",
    "Rating",
    "Enrolled Count",
  ];

  const rows = courses.map((c) =>
    [
      escapeCSV(c.code),
      escapeCSV(c.title),
      escapeCSV(c.category),
      escapeCSV(c.competencyName),
      escapeCSV(`Level ${c.targetLevel}`),
      escapeCSV(c.durationHours),
      escapeCSV(c.modulesCount),
      escapeCSV(c.status),
      escapeCSV(c.rating),
      escapeCSV(c.enrolledCount),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(`CapacityConnect_Courses_${new Date().toISOString().split("T")[0]}.csv`, csv);
}

/**
 * 6. Export Reports CSV
 */
export function exportReportsCSV(
  orgSummary: OrganizationSkillGapSummary,
  employeeSummaries: EmployeeSkillGapSummary[]
) {
  const headers = [
    "Report Section",
    "Metric / Employee",
    "Details",
    "Value / Status",
  ];

  const rows: string[] = [
    ["Organization KPI", "Total Evaluated Employees", "Count", escapeCSV(orgSummary.totalEmployees)].join(","),
    ["Organization KPI", "Total Defined Competencies", "Count", escapeCSV(orgSummary.totalCompetencies)].join(","),
    ["Organization KPI", "Meets Requirement", "Total", escapeCSV(orgSummary.meetsRequirementTotal)].join(","),
    ["Organization KPI", "Needs Improvement", "Total", escapeCSV(orgSummary.needsImprovementTotal)].join(","),
    ["Organization KPI", "Not Assessed", "Total", escapeCSV(orgSummary.notAssessedTotal)].join(","),
    ["Organization KPI", "Total Open Gaps", "Count", escapeCSV(orgSummary.totalGapsIdentified)].join(","),
  ];


  for (const emp of employeeSummaries) {
    rows.push(
      [
        "Employee Summary",
        escapeCSV(emp.employeeName),
        escapeCSV(emp.designationTitle),
        escapeCSV(`Meets: ${emp.meetsRequirementCount}, Needs: ${emp.needsImprovementCount}, Avg Gap: ${emp.averageGap}`),
      ].join(",")
    );
  }

  const csv = [headers.join(","), ...rows].join("\n");
  downloadCSV(`CapacityConnect_Executive_Report_${new Date().toISOString().split("T")[0]}.csv`, csv);
}
