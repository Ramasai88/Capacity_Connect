import { prisma } from "../lib/db/prisma";
import { EmployeeService } from "../lib/services/employee.service";
import { CompetencyService } from "../lib/services/competency.service";
import { DesignationService } from "../lib/services/designation.service";
import { CourseService } from "../lib/services/course.service";
import { LearningService } from "../lib/services/learning.service";
import { ReassessmentService } from "../lib/services/reassessment.service";
import { SkillGapService } from "../lib/services/skill-gap.service";
import { ReportService } from "../lib/services/report.service";
import { OrganizationService } from "../lib/services/organization.service";

async function main() {
  console.log("============================================================");
  console.log("FINAL FULL DATABASE & END-TO-END VERIFICATION");
  console.log("============================================================");

  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found.");
  const orgId = org.id;

  // 1. Table Counts Query
  console.log("1. QUERYING POSTGRESQL TABLE COUNTS ACROSS ALL 14 MODELS:");
  const [
    userCount,
    employeeCount,
    competencyCount,
    competencyLevelCount,
    designationCount,
    designationCompetencyCount,
    employeeCompetencyCount,
    courseCount,
    courseModuleCount,
    courseEnrollmentCount,
    moduleProgressCount,
    reassessmentCount,
    assessmentHistoryCount,
    organizationCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.employee.count(),
    prisma.competency.count(),
    prisma.competencyLevel.count(),
    prisma.designation.count(),
    prisma.designationCompetency.count(),
    prisma.employeeCompetency.count(),
    prisma.course.count(),
    prisma.courseModule.count(),
    prisma.courseEnrollment.count(),
    prisma.moduleProgress.count(),
    prisma.reassessment.count(),
    prisma.competencyAssessmentHistory.count(),
    prisma.organization.count(),
  ]);

  console.table({
    User: userCount,
    Employee: employeeCount,
    Competency: competencyCount,
    CompetencyLevel: competencyLevelCount,
    Designation: designationCount,
    DesignationCompetency: designationCompetencyCount,
    EmployeeCompetency: employeeCompetencyCount,
    Course: courseCount,
    CourseModule: courseModuleCount,
    CourseEnrollment: courseEnrollmentCount,
    ModuleProgress: moduleProgressCount,
    Reassessment: reassessmentCount,
    CompetencyAssessmentHistory: assessmentHistoryCount,
    Organization: organizationCount,
  });

  // 2. Comprehensive End-to-End User Journey Test
  console.log("\n2. EXECUTING REAL DATABASE END-TO-END FLOW:");
  
  // Step A: Create Competency with 5 Levels
  console.log(" -> A. Creating Competency...");
  const e2eComp = await CompetencyService.createCompetency(orgId, {
    name: "E2E Master Competency",
    code: "E2E-COMP-101",
    category: "Specialized Engineering",
    description: "End-to-end competency testing real database lifecycle.",
  });
  console.log("    ✓ Competency Created:", e2eComp.id);

  // Step B: Create Designation with Competency Requirement (Level 4)
  console.log(" -> B. Creating Designation with Level 4 Requirement...");
  const e2eDesig = await DesignationService.createDesignation(orgId, {
    title: "E2E Senior Specialist",
    code: "E2E-DESIG-101",
    department: "Advanced R&D",
    description: "Role requiring Level 4 in E2E Master Competency",
    competencyRequirements: [{ competencyId: e2eComp.id, requiredLevel: 4 }],
  });
  console.log("    ✓ Designation Created:", e2eDesig.id);

  // Step C: Create Employee assigned to Designation with Level 2 (Gap = 2)
  console.log(" -> C. Creating Employee with initial Level 2 assessment...");
  const e2eEmp = await EmployeeService.createEmployee(orgId, {
    name: "E2E Test Candidate",
    employeeCode: "E2E-EMP-999",
    email: "e2e.candidate@example.com",
    department: "Advanced R&D",
    designationId: e2eDesig.id,
    competencies: [{ competencyId: e2eComp.id, currentLevel: 2 }],
  });
  console.log("    ✓ Employee Created:", e2eEmp.id);

  // Step D: Verify Skill Gap in PostgreSQL (Expect Gap = 2, NEEDS_IMPROVEMENT)
  console.log(" -> D. Verifying initial skill gap calculation...");
  const initialGap = await SkillGapService.getEmployeeSkillGaps(orgId, e2eEmp.id);
  const compGap1 = initialGap?.gaps.find((g) => g.competencyId === e2eComp.id);
  console.log("    ✓ Skill Gap:", { gap: compGap1?.gap, status: compGap1?.status });
  if (compGap1?.gap !== 2 || compGap1?.status !== "NEEDS_IMPROVEMENT") {
    throw new Error("Initial skill gap mismatch!");
  }

  // Step E: Create Course mapped to Competency
  console.log(" -> E. Creating Course with 2 modules...");
  const e2eCourse = await CourseService.createCourse(orgId, {
    title: "E2E Capacity Mastery Course",
    code: "E2E-CRS-101",
    category: "Specialized Engineering",
    description: "Training to elevate proficiency from Level 2 to Level 4",
    competencyId: e2eComp.id,
    targetLevel: 4,
    durationHours: 15,
    status: "PUBLISHED",
    modules: [
      { order: 1, title: "E2E Part 1", summary: "Part 1 summary", durationMinutes: 30, overview: "Overview 1", practicalExercise: "Ex 1", competencyVerification: "Ver 1" },
      { order: 2, title: "E2E Part 2", summary: "Part 2 summary", durationMinutes: 45, overview: "Overview 2", practicalExercise: "Ex 2", competencyVerification: "Ver 2" },
    ],
  });
  console.log("    ✓ Course Created:", e2eCourse.id);

  // Step F: Enroll Employee in Course
  console.log(" -> F. Enrolling Employee in Course...");
  const e2eEnrollment = await LearningService.enrollEmployee(orgId, e2eEmp.id, e2eCourse.id);
  console.log("    ✓ Enrollment Created:", e2eEnrollment.id);

  // Step G: Complete Modules 1 & 2
  console.log(" -> G. Completing Modules 1 & 2 (100% progress)...");
  await LearningService.completeModule(orgId, e2eEmp.id, e2eCourse.id, e2eCourse.modules[0].id);
  const completeRes = await LearningService.completeModule(orgId, e2eEmp.id, e2eCourse.id, e2eCourse.modules[1].id);
  console.log("    ✓ Course Progress:", completeRes.progressPercent + "% (" + completeRes.status + ")");

  // Step H: Verify Reassessment auto-generated in PostgreSQL
  console.log(" -> H. Verifying Reassessment in PostgreSQL...");
  const e2eReassessment = await prisma.reassessment.findFirst({
    where: { organizationId: orgId, employeeId: e2eEmp.id, courseId: e2eCourse.id },
  });
  console.log("    ✓ Reassessment Record:", { id: e2eReassessment?.id, status: e2eReassessment?.status });
  if (!e2eReassessment || e2eReassessment.status !== "PENDING_REASSESSMENT") {
    throw new Error("Reassessment was not generated!");
  }

  // Step I: Manager Reviews and Approves Reassessment
  console.log(" -> I. Manager Approving Reassessment...");
  await ReassessmentService.reviewReassessment(orgId, e2eReassessment.id, "Dr. Sarah Jenkins", {
    status: "APPROVED",
    reviewerComments: "E2E full journey verification approved.",
  });

  // Step J: Verify Employee Competency elevated in PostgreSQL to Level 4
  console.log(" -> J. Verifying elevated competency in PostgreSQL...");
  const elevatedComp = await prisma.employeeCompetency.findUnique({
    where: { employeeId_competencyId: { employeeId: e2eEmp.id, competencyId: e2eComp.id } },
  });
  console.log("    ✓ Elevated Competency Level:", elevatedComp?.currentLevel);
  if (elevatedComp?.currentLevel !== 4) {
    throw new Error("Competency level was not elevated to 4!");
  }

  // Step K: Verify Skill Gap recalculated to 0 (MEETS_REQUIREMENT)
  console.log(" -> K. Verifying resolved skill gap in PostgreSQL...");
  const finalGap = await SkillGapService.getEmployeeSkillGaps(orgId, e2eEmp.id);
  const compGap2 = finalGap?.gaps.find((g) => g.competencyId === e2eComp.id);
  console.log("    ✓ Final Skill Gap:", { gap: compGap2?.gap, status: compGap2?.status });
  if (compGap2?.gap !== 0 || compGap2?.status !== "MEETS_REQUIREMENT") {
    throw new Error("Skill gap did not close to 0!");
  }

  // Step L: Clean up E2E temporary records
  console.log(" -> L. Cleaning up E2E test data...");
  await prisma.competencyAssessmentHistory.deleteMany({ where: { employeeId: e2eEmp.id } });
  await prisma.reassessment.deleteMany({ where: { employeeId: e2eEmp.id } });
  await prisma.moduleProgress.deleteMany({ where: { enrollmentId: e2eEnrollment.id } });
  await prisma.courseEnrollment.deleteMany({ where: { employeeId: e2eEmp.id } });
  await prisma.courseModule.deleteMany({ where: { courseId: e2eCourse.id } });
  await prisma.course.deleteMany({ where: { id: e2eCourse.id } });
  await prisma.employeeCompetency.deleteMany({ where: { employeeId: e2eEmp.id } });
  await prisma.employee.deleteMany({ where: { id: e2eEmp.id } });
  await prisma.designationCompetency.deleteMany({ where: { designationId: e2eDesig.id } });
  await prisma.designation.deleteMany({ where: { id: e2eDesig.id } });
  await prisma.competencyLevel.deleteMany({ where: { competencyId: e2eComp.id } });
  await prisma.competency.deleteMany({ where: { id: e2eComp.id } });
  console.log("    ✓ E2E Clean Up Completed.");

  await prisma.$disconnect();
  console.log("\n============================================================");
  console.log("ALL REAL POSTGRESQL DATABASE CRUD & DOMAIN WORKFLOWS VERIFIED!");
  console.log("============================================================");
}

main().catch((err) => {
  console.error("E2E verification failed:", err);
  process.exit(1);
});
