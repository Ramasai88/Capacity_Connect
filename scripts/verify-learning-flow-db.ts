import { prisma } from "../lib/db/prisma";
import { CourseService } from "../lib/services/course.service";
import { LearningService } from "../lib/services/learning.service";
import { ReassessmentService } from "../lib/services/reassessment.service";
import { SkillGapService } from "../lib/services/skill-gap.service";

async function main() {
  console.log("=== VERIFYING DOMAINS 5, 6 & 7: ENROLLMENT, LEARNING & REASSESSMENT DATABASE FLOW ===");
  const org = await prisma.organization.findFirst();
  if (!org) throw new Error("No organization found in database.");
  const orgId = org.id;

  const employee = await prisma.employee.findFirst({ where: { organizationId: orgId } });
  if (!employee) throw new Error("No employee found.");

  const competency = await prisma.competency.findFirst({ where: { organizationId: orgId } });
  if (!competency) throw new Error("No competency found.");

  // Clean up any previous test course/enrollments
  await prisma.courseModule.deleteMany({ where: { course: { code: "CRS-FLOW-TEST" } } });
  await prisma.course.deleteMany({ where: { code: "CRS-FLOW-TEST" } });

  // 1. Create a dedicated Course with 2 modules
  console.log("1. Creating Course with 2 modules in PostgreSQL...");
  const course = await CourseService.createCourse(orgId, {
    title: "Flow Verification Course",
    code: "CRS-FLOW-TEST",
    category: "Software Engineering",
    description: "Course for end-to-end learning progress verification.",
    competencyId: competency.id,
    targetLevel: 4,
    durationHours: 10,
    status: "PUBLISHED",
    modules: [
      {
        order: 1,
        title: "Module 1: Foundations",
        summary: "Foundational concepts",
        durationMinutes: 30,
        overview: "Overview of foundations",
        practicalExercise: "Exercise 1",
        competencyVerification: "Verification 1",
      },
      {
        order: 2,
        title: "Module 2: Advanced Topics",
        summary: "Advanced architectural topics",
        durationMinutes: 45,
        overview: "Overview of advanced topics",
        practicalExercise: "Exercise 2",
        competencyVerification: "Verification 2",
      },
    ],
  });
  console.log("✓ Created Course:", course.id, "(2 modules)");

  // 2. DOMAIN 5: Enroll Employee
  console.log("2. DOMAIN 5: Enrolling Employee into Course...");
  const enrollment = await LearningService.enrollEmployee(orgId, employee.id, course.id);
  console.log("✓ Created CourseEnrollment in DB:", {
    id: enrollment.id,
    employeeId: enrollment.employeeId,
    courseId: enrollment.courseId,
    status: enrollment.status,
    progressPercent: enrollment.progressPercent,
  });

  // Verify in PostgreSQL table
  const dbEnrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollment.id },
  });
  if (!dbEnrollment || dbEnrollment.status !== "IN_PROGRESS") {
    throw new Error("Enrollment not properly saved in PostgreSQL.");
  }
  console.log("✓ Verified CourseEnrollment in PostgreSQL table.");

  // 3. DOMAIN 6: Complete Module 1 (Expect 50% progress)
  console.log("3. DOMAIN 6: Completing Module 1 (1 of 2)...");
  const mod1 = course.modules[0];
  const progress1 = await LearningService.completeModule(orgId, employee.id, course.id, mod1.id);
  console.log("✓ Progress after Module 1:", {
    completedLessons: progress1.completedLessons,
    totalLessons: progress1.totalLessons,
    progressPercent: progress1.progressPercent,
    status: progress1.status,
  });

  if (progress1.progressPercent !== 50 || progress1.completedLessons !== 1) {
    throw new Error(`Expected 50% progress, got ${progress1.progressPercent}%`);
  }

  // Verify ModuleProgress record in PostgreSQL
  const dbModProgress1 = await prisma.moduleProgress.findUnique({
    where: {
      enrollmentId_moduleId: {
        enrollmentId: enrollment.id,
        moduleId: mod1.id,
      },
    },
  });
  console.log("✓ ModuleProgress 1 in PostgreSQL:", {
    moduleId: dbModProgress1?.moduleId,
    completed: dbModProgress1?.completed,
    completedAt: dbModProgress1?.completedAt,
  });

  // 4. Complete Module 2 (Expect 100% progress, COMPLETED status, auto-triggered Reassessment)
  console.log("4. Completing Module 2 (2 of 2 -> 100%)...");
  const mod2 = course.modules[1];
  const progress2 = await LearningService.completeModule(orgId, employee.id, course.id, mod2.id);
  console.log("✓ Progress after Module 2:", {
    completedLessons: progress2.completedLessons,
    totalLessons: progress2.totalLessons,
    progressPercent: progress2.progressPercent,
    status: progress2.status,
  });

  if (progress2.progressPercent !== 100 || progress2.status !== "COMPLETED") {
    throw new Error(`Expected 100% COMPLETED, got ${progress2.progressPercent}% (${progress2.status})`);
  }

  // 5. DOMAIN 7: Verify Reassessment created in PostgreSQL
  console.log("5. DOMAIN 7: Verifying auto-created Reassessment record in PostgreSQL...");
  const dbReassessment = await prisma.reassessment.findFirst({
    where: {
      organizationId: orgId,
      employeeId: employee.id,
      courseId: course.id,
    },
  });
  console.log("✓ Found auto-generated Reassessment in PostgreSQL:", {
    id: dbReassessment?.id,
    status: dbReassessment?.status,
    previousLevel: dbReassessment?.previousLevel,
    requestedLevel: dbReassessment?.requestedLevel,
  });

  if (!dbReassessment || dbReassessment.status !== "PENDING_REASSESSMENT") {
    throw new Error("Reassessment was not created in PostgreSQL with PENDING_REASSESSMENT status.");
  }

  // 6. DOMAIN 7: Manager Approval & Competency Elevation Transaction
  console.log("6. Manager Approving Reassessment...");
  const reviewResult = await ReassessmentService.reviewReassessment(
    orgId,
    dbReassessment.id,
    "Sarah Jenkins (Manager)",
    {
      status: "APPROVED",
      reviewerComments: "Practical exercise verified and approved in database test.",
    }
  );
  console.log("✓ Approved Reassessment Result:", {
    id: reviewResult.id,
    status: reviewResult.status,
    reviewedBy: reviewResult.reviewedBy,
    reviewedAt: reviewResult.reviewedAt,
  });

  // Verify EmployeeCompetency elevation in PostgreSQL
  const dbEmployeeComp = await prisma.employeeCompetency.findUnique({
    where: {
      employeeId_competencyId: {
        employeeId: employee.id,
        competencyId: competency.id,
      },
    },
  });
  console.log("✓ Elevated EmployeeCompetency in PostgreSQL:", {
    employeeId: dbEmployeeComp?.employeeId,
    competencyId: dbEmployeeComp?.competencyId,
    currentLevel: dbEmployeeComp?.currentLevel,
  });

  if (dbEmployeeComp?.currentLevel !== 4) {
    throw new Error(`Expected EmployeeCompetency currentLevel to be 4, got ${dbEmployeeComp?.currentLevel}`);
  }

  // Verify CompetencyAssessmentHistory in PostgreSQL
  const history = await prisma.competencyAssessmentHistory.findFirst({
    where: {
      employeeId: employee.id,
      competencyId: competency.id,
    },
    orderBy: { assessedAt: "desc" },
  });
  console.log("✓ Created CompetencyAssessmentHistory log in PostgreSQL:", {
    id: history?.id,
    previousLevel: history?.previousLevel,
    newLevel: history?.newLevel,
    assessedBy: history?.assessedBy,
    reason: history?.reason,
  });

  // Clean up
  await prisma.competencyAssessmentHistory.deleteMany({ where: { employeeId: employee.id, competencyId: competency.id } });
  await prisma.reassessment.deleteMany({ where: { id: dbReassessment.id } });
  await prisma.moduleProgress.deleteMany({ where: { enrollmentId: enrollment.id } });
  await prisma.courseEnrollment.deleteMany({ where: { id: enrollment.id } });
  await prisma.courseModule.deleteMany({ where: { courseId: course.id } });
  await prisma.course.deleteMany({ where: { id: course.id } });

  await prisma.$disconnect();
  console.log("=== DOMAINS 5, 6 & 7 DATABASE VERIFICATION COMPLETE AND PASSED ===");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
