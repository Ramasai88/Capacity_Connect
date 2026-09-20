import { PrismaClient, UserRole, EmployeeStatus, CourseStatus, EnrollmentStatus, ReassessmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEMO_ORGANIZATION,
  DEMO_COMPETENCIES,
  DEMO_DESIGNATIONS,
  DEMO_EMPLOYEES,
  DEMO_COURSES,
  DEFAULT_COMPETENCY_LEVELS,
} from "../lib/demo/data";
import { getCourseCurriculum } from "../lib/demo/learning-curriculum";
import { assertSafeTestDatabaseUrl } from "../tests/safety-guard";

// Validate that we are strictly running against a safe test database
const safeUrl = assertSafeTestDatabaseUrl(process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: safeUrl,
    },
  },
});

async function main() {
  console.log("🌱 Seeding Test Database (Baseline Fixtures)...");

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { id: DEMO_ORGANIZATION.id },
    update: {
      name: DEMO_ORGANIZATION.name,
      code: DEMO_ORGANIZATION.code,
      description: DEMO_ORGANIZATION.description,
      industry: DEMO_ORGANIZATION.industry,
    },
    create: {
      id: DEMO_ORGANIZATION.id,
      name: DEMO_ORGANIZATION.name,
      code: DEMO_ORGANIZATION.code,
      description: DEMO_ORGANIZATION.description,
      industry: DEMO_ORGANIZATION.industry,
    },
  });

  // 2. Competencies & Levels
  for (const comp of DEMO_COMPETENCIES) {
    const createdComp = await prisma.competency.upsert({
      where: { id: comp.id },
      update: {
        name: comp.name,
        code: comp.code,
        category: comp.category,
        description: comp.description,
        organizationId: org.id,
      },
      create: {
        id: comp.id,
        name: comp.name,
        code: comp.code,
        category: comp.category,
        description: comp.description,
        organizationId: org.id,
      },
    });

    for (let lvl = 1; lvl <= 5; lvl++) {
      const defaultInfo = DEFAULT_COMPETENCY_LEVELS[lvl] || {
        label: `Level ${lvl}`,
        description: `Proficiency level ${lvl} standard.`,
        behavioralIndicators: [`Demonstrates proficiency at Level ${lvl}`],
      };

      await prisma.competencyLevel.upsert({
        where: {
          competencyId_level: {
            competencyId: createdComp.id,
            level: lvl,
          },
        },
        update: {
          label: defaultInfo.label,
          description: defaultInfo.description,
          behavioralIndicators: defaultInfo.behavioralIndicators,
        },
        create: {
          competencyId: createdComp.id,
          level: lvl,
          label: defaultInfo.label,
          description: defaultInfo.description,
          behavioralIndicators: defaultInfo.behavioralIndicators,
        },
      });
    }
  }

  // 3. Designations & Requirements
  for (const desig of DEMO_DESIGNATIONS) {
    const createdDesig = await prisma.designation.upsert({
      where: { id: desig.id },
      update: {
        title: desig.title,
        code: desig.code,
        department: desig.department,
        description: desig.description,
        organizationId: org.id,
      },
      create: {
        id: desig.id,
        title: desig.title,
        code: desig.code,
        department: desig.department,
        description: desig.description,
        organizationId: org.id,
      },
    });

    for (const req of desig.requirements) {
      await prisma.designationCompetency.upsert({
        where: {
          designationId_competencyId: {
            designationId: createdDesig.id,
            competencyId: req.competencyId,
          },
        },
        update: {
          requiredLevel: req.requiredLevel,
          organizationId: org.id,
        },
        create: {
          designationId: createdDesig.id,
          competencyId: req.competencyId,
          requiredLevel: req.requiredLevel,
          organizationId: org.id,
        },
      });
    }
  }

  // 4. Employees & Assessments
  for (const emp of DEMO_EMPLOYEES) {
    const createdEmp = await prisma.employee.upsert({
      where: { id: emp.id },
      update: {
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designationId: emp.designationId,
        joiningDate: emp.joiningDate ? new Date(emp.joiningDate) : null,
        status: (emp.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
        organizationId: org.id,
      },
      create: {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        designationId: emp.designationId,
        joiningDate: emp.joiningDate ? new Date(emp.joiningDate) : null,
        status: (emp.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
        organizationId: org.id,
      },
    });

    for (const compAssessment of emp.competencies) {
      if (compAssessment.currentLevel === null || compAssessment.currentLevel === undefined) continue;
      const currentLevel = compAssessment.currentLevel;

      await prisma.employeeCompetency.upsert({
        where: {
          employeeId_competencyId: {
            employeeId: createdEmp.id,
            competencyId: compAssessment.competencyId,
          },
        },
        update: {
          currentLevel,
          assessedAt: compAssessment.assessedAt ? new Date(compAssessment.assessedAt) : new Date(),
          assessedBy: compAssessment.assessedBy || "Manager Baseline Assessment",
          organizationId: org.id,
        },
        create: {
          employeeId: createdEmp.id,
          competencyId: compAssessment.competencyId,
          currentLevel,
          assessedAt: compAssessment.assessedAt ? new Date(compAssessment.assessedAt) : new Date(),
          assessedBy: compAssessment.assessedBy || "Manager Baseline Assessment",
          organizationId: org.id,
        },
      });
    }
  }

  // 5. Users
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const managerPasswordHash = await bcrypt.hash("Manager@123", 10);
  const employeePasswordHash = await bcrypt.hash("Employee@123", 10);

  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@capacityconnect.demo" } },
    update: {
      name: "Dr. K. Srinivas",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Dr. K. Srinivas",
      email: "admin@capacityconnect.demo",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@klu.edu" } },
    update: {
      name: "Admin User",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Admin User",
      email: "admin@klu.edu",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "sarah.jenkins@capacityconnect.demo" } },
    update: {
      name: "Sarah Jenkins",
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
    },
    create: {
      name: "Sarah Jenkins",
      email: "sarah.jenkins@capacityconnect.demo",
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      organizationId: org.id,
    },
  });

  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "ravi.kumar@capacityconnect.demo" } },
    update: {
      name: "Ravi Kumar",
      passwordHash: employeePasswordHash,
      role: UserRole.EMPLOYEE,
      employeeId: "emp-1",
    },
    create: {
      name: "Ravi Kumar",
      email: "ravi.kumar@capacityconnect.demo",
      passwordHash: employeePasswordHash,
      role: UserRole.EMPLOYEE,
      organizationId: org.id,
      employeeId: "emp-1",
    },
  });

  // 6. Courses & Modules
  for (const course of DEMO_COURSES) {
    const createdCourse = await prisma.course.upsert({
      where: { id: course.id },
      update: {
        title: course.title,
        code: course.code,
        description: course.description,
        category: course.category,
        competencyId: course.competencyId,
        targetLevel: course.targetLevel,
        durationHours: course.durationHours,
        rating: course.rating,
        status: (course.status as CourseStatus) || CourseStatus.PUBLISHED,
        organizationId: org.id,
      },
      create: {
        id: course.id,
        title: course.title,
        code: course.code,
        description: course.description,
        category: course.category,
        competencyId: course.competencyId,
        targetLevel: course.targetLevel,
        durationHours: course.durationHours,
        rating: course.rating,
        status: (course.status as CourseStatus) || CourseStatus.PUBLISHED,
        organizationId: org.id,
      },
    });

    const curriculum = getCourseCurriculum(course.id);
    for (const mod of curriculum.modules) {
      const overview = mod.content?.overview || mod.overview || mod.summary;
      const keyConcepts = (mod.content?.keyConcepts || mod.keyConcepts || []) as any;
      const practicalExercise = mod.content?.practicalExercise || mod.practicalExercise || "Complete module practical exercise";
      const competencyVerification = mod.content?.competencyVerification || mod.competencyVerification || "Verify target competency level";
      const learningObjectives = mod.learningObjectives || [];

      await prisma.courseModule.upsert({
        where: {
          courseId_order: {
            courseId: createdCourse.id,
            order: mod.order,
          },
        },
        update: {
          courseId: createdCourse.id,
          order: mod.order,
          title: mod.title,
          summary: mod.summary,
          durationMinutes: mod.durationMinutes,
          learningObjectives,
          overview,
          keyConcepts,
          practicalExercise,
          competencyVerification,
        },
        create: {
          id: mod.id,
          courseId: createdCourse.id,
          order: mod.order,
          title: mod.title,
          summary: mod.summary,
          durationMinutes: mod.durationMinutes,
          learningObjectives,
          overview,
          keyConcepts,
          practicalExercise,
          competencyVerification,
        },
      });
    }
  }

  // 7. Course Enrollments
  const pyEnrollment = await prisma.courseEnrollment.upsert({
    where: { employeeId_courseId: { employeeId: "emp-1", courseId: "course-py-401" } },
    update: {
      progressPercent: 67,
      completedLessons: 4,
      totalLessons: 6,
      status: EnrollmentStatus.IN_PROGRESS,
    },
    create: {
      employeeId: "emp-1",
      courseId: "course-py-401",
      enrolledAt: new Date("2024-05-10"),
      progressPercent: 67,
      completedLessons: 4,
      totalLessons: 6,
      status: EnrollmentStatus.IN_PROGRESS,
    },
  });

  const pyCompletedModules = ["py-mod-1", "py-mod-2", "py-mod-3", "py-mod-4"];
  for (const modId of pyCompletedModules) {
    await prisma.moduleProgress.upsert({
      where: { enrollmentId_moduleId: { enrollmentId: pyEnrollment.id, moduleId: modId } },
      update: { completed: true },
      create: {
        enrollmentId: pyEnrollment.id,
        moduleId: modId,
        completed: true,
        completedAt: new Date("2024-05-20"),
      },
    });
  }

  const jvEnrollment = await prisma.courseEnrollment.upsert({
    where: { employeeId_courseId: { employeeId: "emp-1", courseId: "course-jv-401" } },
    update: {
      progressPercent: 29,
      completedLessons: 2,
      totalLessons: 7,
      status: EnrollmentStatus.IN_PROGRESS,
    },
    create: {
      employeeId: "emp-1",
      courseId: "course-jv-401",
      enrolledAt: new Date("2024-05-15"),
      progressPercent: 29,
      completedLessons: 2,
      totalLessons: 7,
      status: EnrollmentStatus.IN_PROGRESS,
    },
  });

  const jvCompletedModules = ["jv-mod-1", "jv-mod-2"];
  for (const modId of jvCompletedModules) {
    await prisma.moduleProgress.upsert({
      where: { enrollmentId_moduleId: { enrollmentId: jvEnrollment.id, moduleId: modId } },
      update: { completed: true },
      create: {
        enrollmentId: jvEnrollment.id,
        moduleId: modId,
        completed: true,
        completedAt: new Date("2024-05-25"),
      },
    });
  }

  // 8. Reassessment
  await prisma.reassessment.upsert({
    where: { id: "reassess-1" },
    update: {
      status: ReassessmentStatus.PENDING_REASSESSMENT,
    },
    create: {
      id: "reassess-1",
      organizationId: org.id,
      employeeId: "emp-5",
      courseId: "course-sql-301",
      competencyId: "comp-sql",
      previousLevel: 2,
      requestedLevel: 3,
      status: ReassessmentStatus.PENDING_REASSESSMENT,
      submittedAt: new Date("2024-06-18"),
    },
  });

  console.log("✓ Test database baseline fixtures seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Test database seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
