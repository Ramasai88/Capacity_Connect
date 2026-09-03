import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function count() {
  console.log("=== CAPACITY CONNECT DATABASE COUNTS ===");
  console.log("Organizations:             ", await prisma.organization.count());
  console.log("Users:                     ", await prisma.user.count());
  console.log("Employees:                 ", await prisma.employee.count());
  console.log("Competencies:              ", await prisma.competency.count());
  console.log("Competency Levels (1-5):   ", await prisma.competencyLevel.count());
  console.log("Designations:              ", await prisma.designation.count());
  console.log("Designation Requirements:  ", await prisma.designationCompetency.count());
  console.log("Employee Competencies:     ", await prisma.employeeCompetency.count());
  console.log("Assessment History Logs:   ", await prisma.competencyAssessmentHistory.count());
  console.log("Courses:                   ", await prisma.course.count());
  console.log("Course Modules:            ", await prisma.courseModule.count());
  console.log("Course Enrollments:        ", await prisma.courseEnrollment.count());
  console.log("Module Progress Records:   ", await prisma.moduleProgress.count());
  console.log("Reassessments:             ", await prisma.reassessment.count());
  console.log("========================================");
  await prisma.$disconnect();
}
count();