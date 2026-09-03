import { prisma } from "@/lib/db/prisma";
import { EnrollmentQueryInput } from "@/lib/validations/learning";
import { EnrollmentStatus } from "@prisma/client";

export class LearningServiceError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 400,
    code = "LEARNING_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "LearningServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface EnrollmentListItem {
  id: string;
  employeeId: string;
  employeeName: string;
  courseId: string;
  courseTitle: string;
  courseCode: string;
  category: string;
  targetLevel: number;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
}

export interface EnrollmentDetailResponse {
  id: string;
  employeeId: string;
  courseId: string;
  course: {
    id: string;
    title: string;
    code: string;
    description: string;
    category: string;
    competencyId: string;
    targetLevel: number;
    durationHours: number;
    modules: Array<{
      id: string;
      order: number;
      title: string;
      summary: string;
      durationMinutes: number;
      learningObjectives: string[];
      overview: string;
      keyConcepts: any;
      practicalExercise: string;
      competencyVerification: string;
      isCompleted: boolean;
      completedAt: string | null;
    }>;
  };
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  reassessment: {
    id: string;
    status: string;
    requestedLevel: number;
    submittedAt: string;
  } | null;
}

export class LearningService {
  /**
   * 1. Get enrollments with filters.
   */
  static async getEnrollments(
    organizationId: string,
    query: Partial<EnrollmentQueryInput> = {}
  ): Promise<{
    enrollments: EnrollmentListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { employeeId, courseId, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      employee: {
        organizationId,
      },
    };

    if (employeeId) where.employeeId = employeeId;
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;

    const [total, records] = await Promise.all([
      prisma.courseEnrollment.count({ where }),
      prisma.courseEnrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              category: true,
              targetLevel: true,
            },
          },
        },
      }),
    ]);

    const enrollments: EnrollmentListItem[] = records.map((enr) => ({
      id: enr.id,
      employeeId: enr.employeeId,
      employeeName: enr.employee.name,
      courseId: enr.courseId,
      courseTitle: enr.course.title,
      courseCode: enr.course.code,
      category: enr.course.category,
      targetLevel: enr.course.targetLevel,
      progressPercent: enr.progressPercent,
      completedLessons: enr.completedLessons,
      totalLessons: enr.totalLessons,
      status: enr.status,
      enrolledAt: enr.enrolledAt.toISOString(),
      completedAt: enr.completedAt ? enr.completedAt.toISOString() : null,
    }));

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. Get detailed enrollment with module completion statuses.
   */
  static async getEnrollmentByCourse(
    organizationId: string,
    employeeId: string,
    courseId: string
  ): Promise<EnrollmentDetailResponse | null> {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        employeeId,
        courseId,
        employee: {
          organizationId,
        },
      },
      include: {
        course: {
          include: {
            modules: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        moduleProgress: true,
      },
    });

    if (!enrollment) {
      return null;
    }

    const completedModuleMap = new Map<string, Date>();
    for (const mp of enrollment.moduleProgress) {
      if (mp.completed) {
        completedModuleMap.set(mp.moduleId, mp.completedAt);
      }
    }

    const reassessment = await prisma.reassessment.findFirst({
      where: {
        organizationId,
        employeeId,
        courseId,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return {
      id: enrollment.id,
      employeeId: enrollment.employeeId,
      courseId: enrollment.courseId,
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        code: enrollment.course.code,
        description: enrollment.course.description,
        category: enrollment.course.category,
        competencyId: enrollment.course.competencyId,
        targetLevel: enrollment.course.targetLevel,
        durationHours: enrollment.course.durationHours,
        modules: enrollment.course.modules.map((m) => {
          const completedAt = completedModuleMap.get(m.id);
          return {
            id: m.id,
            order: m.order,
            title: m.title,
            summary: m.summary,
            durationMinutes: m.durationMinutes,
            learningObjectives: m.learningObjectives,
            overview: m.overview,
            keyConcepts: m.keyConcepts,
            practicalExercise: m.practicalExercise,
            competencyVerification: m.competencyVerification,
            isCompleted: !!completedAt,
            completedAt: completedAt ? completedAt.toISOString() : null,
          };
        }),
      },
      progressPercent: enrollment.progressPercent,
      completedLessons: enrollment.completedLessons,
      totalLessons: enrollment.totalLessons,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
      reassessment: reassessment
        ? {
            id: reassessment.id,
            status: reassessment.status,
            requestedLevel: reassessment.requestedLevel,
            submittedAt: reassessment.submittedAt.toISOString(),
          }
        : null,
    };
  }

  /**
   * 3. Enroll employee into course.
   */
  static async enrollEmployee(
    organizationId: string,
    employeeId: string,
    courseId: string
  ): Promise<EnrollmentDetailResponse> {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
    });

    if (!employee) {
      throw new LearningServiceError("Employee not found in organization.", 404, "NOT_FOUND");
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, organizationId },
      include: { _count: { select: { modules: true } } },
    });

    if (!course) {
      throw new LearningServiceError("Course not found in organization.", 404, "NOT_FOUND");
    }

    const existing = await prisma.courseEnrollment.findFirst({
      where: { employeeId, courseId },
    });

    if (existing) {
      throw new LearningServiceError(
        "Employee is already enrolled in this course.",
        409,
        "ALREADY_ENROLLED"
      );
    }

    await prisma.courseEnrollment.create({
      data: {
        employeeId,
        courseId,
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: course._count.modules,
        status: EnrollmentStatus.IN_PROGRESS,
      },
    });

    const fullRecord = await this.getEnrollmentByCourse(organizationId, employeeId, courseId);
    if (!fullRecord) {
      throw new LearningServiceError("Failed to retrieve enrollment record.", 500);
    }

    return fullRecord;
  }

  /**
   * 4. Complete a module and auto-trigger reassessment on 100% completion.
   */
  static async completeModule(
    organizationId: string,
    employeeId: string,
    courseId: string,
    moduleId: string
  ): Promise<EnrollmentDetailResponse> {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        employeeId,
        courseId,
        employee: { organizationId },
      },
      include: {
        course: {
          include: {
            modules: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new LearningServiceError("Enrollment not found.", 404, "NOT_FOUND");
    }

    const targetModule = enrollment.course.modules.find((m) => m.id === moduleId);
    if (!targetModule) {
      throw new LearningServiceError("Module does not belong to this course.", 400, "INVALID_MODULE");
    }

    // Atomic transaction: mark module progress, recalculate progress, auto-trigger reassessment
    await prisma.$transaction(async (tx) => {
      // Upsert module progress
      await tx.moduleProgress.upsert({
        where: {
          enrollmentId_moduleId: {
            enrollmentId: enrollment.id,
            moduleId,
          },
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
        create: {
          enrollmentId: enrollment.id,
          moduleId,
          completed: true,
          completedAt: new Date(),
        },
      });

      const totalLessons = enrollment.course.modules.length;
      const completedCount = await tx.moduleProgress.count({
        where: {
          enrollmentId: enrollment.id,
          completed: true,
        },
      });

      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 100;
      const isCompleted = progressPercent === 100;

      await tx.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPercent,
          completedLessons: completedCount,
          status: isCompleted ? EnrollmentStatus.COMPLETED : EnrollmentStatus.IN_PROGRESS,
          completedAt: isCompleted ? new Date() : null,
        },
      });

      // If 100% completed, auto-trigger Reassessment
      if (isCompleted) {
        // Query employee's current level for the course competency
        const currentComp = await tx.employeeCompetency.findUnique({
          where: {
            employeeId_competencyId: {
              employeeId,
              competencyId: enrollment.course.competencyId,
            },
          },
        });

        const previousLevel = currentComp?.currentLevel ?? 1;

        // Check if reassessment already pending
        const existingReassess = await tx.reassessment.findFirst({
          where: {
            organizationId,
            employeeId,
            courseId,
            status: "PENDING_REASSESSMENT",
          },
        });

        if (!existingReassess) {
          await tx.reassessment.create({
            data: {
              organizationId,
              employeeId,
              courseId,
              competencyId: enrollment.course.competencyId,
              previousLevel,
              requestedLevel: enrollment.course.targetLevel,
              status: "PENDING_REASSESSMENT",
            },
          });
        }
      }
    });

    const fullRecord = await this.getEnrollmentByCourse(organizationId, employeeId, courseId);
    if (!fullRecord) {
      throw new LearningServiceError("Failed to retrieve updated enrollment.", 500);
    }

    return fullRecord;
  }
}
