import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DemoEmployee,
  DemoCompetency,
  DemoDesignation,
} from "@/lib/demo/data";
import type {
  EmployeeSkillGapSummary,
  OrganizationSkillGapSummary,
} from "@/lib/skill-gap/calculateSkillGap";

const BRAND_NAVY = [15, 23, 42] as const; // #0f172a
const BRAND_PRIMARY = [30, 58, 138] as const; // #1e3a8a
const BRAND_GRAY = [100, 116, 139] as const;

function addHeader(doc: jsPDF, title: string, subtitle?: string, orgName = "Capacity Connect") {
  doc.setFontSize(18);
  doc.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Capacity Connect", 14, 18);

  const cleanOrgName = orgName === "KL University" ? "Capacity Connect" : orgName;
  if (cleanOrgName && cleanOrgName !== "Capacity Connect") {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BRAND_GRAY[0], BRAND_GRAY[1], BRAND_GRAY[2]);
    doc.text(cleanOrgName, 14, 24);
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 28, 196, 28);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_PRIMARY[0], BRAND_PRIMARY[1], BRAND_PRIMARY[2]);
  doc.text(title, 14, 37);

  const dateStr = `Generated on ${new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(BRAND_GRAY[0], BRAND_GRAY[1], BRAND_GRAY[2]);
  doc.text(dateStr, 196 - doc.getTextWidth(dateStr), 37);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 14, 43);
  }
}

/**
 * 1. Export Skill Gap PDF
 */
export function exportSkillGapPDF(
  employeeSummaries: EmployeeSkillGapSummary[],
  orgSummary: OrganizationSkillGapSummary,
  orgName = "Capacity Connect"
) {
  const doc = new jsPDF();

  addHeader(
    doc,
    "Skill Gap Analysis & Capacity Building Report",
    `Evaluated using gap = max(0, Required - Current). Total Open Gaps: ${orgSummary.totalGapsIdentified}`,
    orgName
  );

  // Summary Metrics Table
  autoTable(doc, {
    startY: 48,
    head: [["Total Evaluated", "Total Competencies", "Meets Requirement", "Needs Improvement", "Not Assessed"]],
    body: [
      [
        String(orgSummary.totalEmployees),
        String(orgSummary.totalCompetencies),
        String(orgSummary.meetsRequirementTotal),
        String(orgSummary.needsImprovementTotal),
        String(orgSummary.notAssessedTotal),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, halign: "center" },
  });

  // Detailed Gaps Table
  const tableData: (string | number)[][] = [];

  for (const emp of employeeSummaries) {
    for (const g of emp.gaps) {
      tableData.push([
        emp.employeeName,
        emp.designationTitle,
        g.competencyName,
        `Level ${g.requiredLevel}`,
        g.currentLevel !== null ? `Level ${g.currentLevel}` : "None",
        g.gap > 0 ? `${g.gap}` : "0",
        g.status === "MEETS_REQUIREMENT"
          ? "Meets"
          : g.status === "NEEDS_IMPROVEMENT"
          ? "Needs Imp."
          : "Not Assessed",
      ]);
    }
  }

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["Employee", "Designation", "Competency", "Req.", "Curr.", "Gap", "Status"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 15, halign: "center" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 30, halign: "center" },
    },
  });

  doc.save(`CapacityConnect_SkillGap_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * 2. Export Employee Directory PDF
 */
export function exportEmployeesPDF(
  employees: DemoEmployee[],
  employeeSummaries: EmployeeSkillGapSummary[],
  orgName = "Capacity Connect"
) {
  const doc = new jsPDF();

  addHeader(
    doc,
    "Employee Directory & Profile Summary",
    `Total Active Employees: ${employees.length}`,
    orgName
  );

  const tableData = employees.map((emp) => {
    const summary = employeeSummaries.find((s) => s.employeeId === emp.id);
    const gapsCount = summary ? summary.needsImprovementCount + summary.notAssessedCount : 0;
    return [
      emp.employeeCode,
      emp.name,
      emp.email,
      emp.designationTitle,
      emp.department,
      emp.status,
      String(gapsCount),
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [["Code", "Full Name", "Email", "Designation", "Department", "Status", "Open Gaps"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  doc.save(`CapacityConnect_Employees_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * 3. Export Designation & Competency Matrix PDF
 */
export function exportDesignationsMatrixPDF(
  designations: DemoDesignation[],
  competencies: DemoCompetency[],
  orgName = "Capacity Connect"
) {
  const doc = new jsPDF("landscape");

  addHeader(
    doc,
    "Role Designation & Competency Requirements Matrix",
    "Universal 1–5 Level Proficiency Requirements",
    orgName
  );

  // Headers: Role, Dept, and each competency name
  const compNames = competencies.map((c) => c.name);
  const headRow = ["Designation Title", "Code", "Department", ...compNames];

  const bodyRows = designations.map((d) => {
    const row = [d.title, d.code, d.department];
    for (const c of competencies) {
      const req = (d.requirements || []).find((r) => r.competencyId === c.id);
      row.push(req ? `Level ${req.requiredLevel}` : "—");
    }
    return row;
  });

  autoTable(doc, {
    startY: 48,
    head: [headRow],
    body: bodyRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
    styles: { fontSize: 7.5, halign: "center", cellPadding: 2 },
    columnStyles: {
      0: { halign: "left", cellWidth: 45 },
      1: { cellWidth: 20 },
      2: { halign: "left", cellWidth: 35 },
    },
  });

  doc.save(`CapacityConnect_Matrix_${new Date().toISOString().split("T")[0]}.pdf`);
}

/**
 * 4. Export Executive Reports PDF
 */
export function exportExecutiveReportPDF(
  orgSummary: OrganizationSkillGapSummary,
  employeeSummaries: EmployeeSkillGapSummary[],
  orgName = "Capacity Connect"
) {
  const doc = new jsPDF();

  addHeader(
    doc,
    "Executive Capacity Building & Readiness Summary",
    "Strategic overview of organization skills and capacity interventions",
    orgName
  );

  // Executive KPI summary
  autoTable(doc, {
    startY: 48,
    head: [["Executive Indicator", "Score / Value"]],
    body: [
      ["Organization Total Evaluated Workforce", `${orgSummary.totalEmployees} Employees`],
      ["Defined Competencies Coverage", `${orgSummary.totalCompetencies} Competencies`],
      ["Workforce Meeting Role Proficiency", `${orgSummary.meetsRequirementTotal} competencies (100% Meets)`],
      ["Workforce Requiring Capacity Training", `${orgSummary.needsImprovementTotal} competencies`],
      ["Total Open Gaps Across Organization", `${orgSummary.totalGapsIdentified} Identified Gaps`],
    ],
    theme: "striped",
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
  });


  // Department / Employee breakdown
  const empRows = employeeSummaries.map((emp) => [
    emp.employeeName,
    emp.designationTitle,
    String(emp.totalRequired),
    String(emp.meetsRequirementCount),
    String(emp.needsImprovementCount + emp.notAssessedCount),
    `${emp.averageGap} Levels`,
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["Employee", "Designation", "Required Skills", "Met", "Open Gaps", "Avg Gap"]],
    body: empRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  doc.save(`CapacityConnect_Executive_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}
