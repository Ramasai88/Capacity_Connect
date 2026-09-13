import { prisma } from "@/lib/db/prisma";
import {
  CreateCourseInput,
  UpdateCourseInput,
  CourseQueryInput,
} from "@/lib/validations/course";
import { CourseStatus } from "@prisma/client";
import { getCourseCurriculum, type LearningResource } from "@/lib/demo/learning-curriculum";

export class CourseServiceError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 400,
    code = "COURSE_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "CourseServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface CourseModuleDetail {
  id: string;
  order: number;
  title: string;
  summary: string;
  durationMinutes: number;
  learningObjectives: string[];
  overview: string;
  keyConcepts: any;
  resources?: LearningResource[];
  practicalExercise: string;
  competencyVerification: string;
  content?: {
    overview: string;
    keyConcepts: any;
    resources?: LearningResource[];
    practicalExercise: string;
    competencyVerification: string;
  };
}

export interface CourseListItem {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  description: string;
  category: string;
  competencyId: string;
  competencyName: string;
  targetLevel: number;
  durationHours: number;
  rating: number;
  status: CourseStatus;
  modulesCount: number;
  enrollmentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetailResponse {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  description: string;
  category: string;
  competencyId: string;
  competency: {
    id: string;
    name: string;
    code: string;
    category: string;
  };
  targetLevel: number;
  durationHours: number;
  rating: number;
  status: CourseStatus;
  enrollmentsCount: number;
  modules: CourseModuleDetail[];
  createdAt: string;
  updatedAt: string;
}

export class CourseService {
  /**
   * 1. Get courses list with search and filters.
   */
  static async getCourses(
    organizationId: string,
    query: Partial<CourseQueryInput> = {}
  ): Promise<{
    courses: CourseListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, category, competencyId, targetLevel, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (status) where.status = status;
    if (category) where.category = { equals: category, mode: "insensitive" };
    if (competencyId) where.competencyId = competencyId;
    if (targetLevel) where.targetLevel = targetLevel;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.course.count({ where }),
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: "asc" },
        include: {
          competency: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              modules: true,
              enrollments: true,
            },
          },
        },
      }),
    ]);

    const courses: CourseListItem[] = records.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      title: c.title,
      code: c.code,
      description: c.description,
      category: c.category,
      competencyId: c.competencyId,
      competencyName: c.competency.name,
      targetLevel: c.targetLevel,
      durationHours: c.durationHours,
      rating: c.rating,
      status: c.status,
      modulesCount: c._count.modules,
      enrollmentsCount: c._count.enrollments,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return {
      courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. Get single course by ID with its ordered modules.
   */
  static async getCourseById(
    organizationId: string,
    courseId: string
  ): Promise<CourseDetailResponse | null> {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId,
      },
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
        },
        modules: {
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    return {
      id: course.id,
      organizationId: course.organizationId,
      title: course.title,
      code: course.code,
      description: course.description,
      category: course.category,
      competencyId: course.competencyId,
      competency: course.competency,
      targetLevel: course.targetLevel,
      durationHours: course.durationHours,
      rating: course.rating,
      status: course.status,
      enrollmentsCount: course._count.enrollments,
      modules: (() => {
        const curriculum = getCourseCurriculum(course.id);
        const curriculumMap = new Map(
          curriculum?.modules?.map((cm) => [cm.id, cm]) || []
        );
        const curriculumOrderMap = new Map(
          curriculum?.modules?.map((cm) => [cm.order, cm]) || []
        );

        return course.modules.map((m) => {
          const currMod = curriculumMap.get(m.id) || curriculumOrderMap.get(m.order);
          const resources = (currMod?.resources && currMod.resources.length > 0)
            ? currMod.resources
            : [];
          const keyConcepts = (Array.isArray(m.keyConcepts) && m.keyConcepts.length > 0)
            ? m.keyConcepts
            : (currMod?.content?.keyConcepts || currMod?.keyConcepts || m.keyConcepts);

          return {
            id: m.id,
            order: m.order,
            title: m.title,
            summary: m.summary,
            durationMinutes: m.durationMinutes,
            learningObjectives: m.learningObjectives,
            overview: m.overview,
            keyConcepts,
            resources,
            practicalExercise: m.practicalExercise,
            competencyVerification: m.competencyVerification,
            content: {
              overview: m.overview,
              keyConcepts,
              resources,
              practicalExercise: m.practicalExercise,
              competencyVerification: m.competencyVerification,
            },
          };
        });
      })(),
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }

  /**
   * 3. Create course with atomic transaction for modules.
   */
  static async createCourse(
    organizationId: string,
    data: CreateCourseInput
  ): Promise<CourseDetailResponse> {
    const code = data.code.trim().toUpperCase();

    // Check duplicate code
    const existing = await prisma.course.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new CourseServiceError(
        `A course with code "${code}" already exists in this organization.`,
        409,
        "DUPLICATE_CODE"
      );
    }

    // Check competency exists in organization
    const competency = await prisma.competency.findFirst({
      where: {
        id: data.competencyId,
        organizationId,
      },
    });

    if (!competency) {
      throw new CourseServiceError(
        "The specified competency does not exist in this organization.",
        400,
        "INVALID_COMPETENCY"
      );
    }

    // Atomic transaction
    const created = await prisma.$transaction(async (tx) => {
      const crs = await tx.course.create({
        data: {
          organizationId,
          title: data.title.trim(),
          code,
          description: data.description.trim(),
          category: data.category.trim(),
          competencyId: data.competencyId,
          targetLevel: data.targetLevel,
          durationHours: data.durationHours,
          rating: data.rating ?? 4.8,
          status: data.status as CourseStatus,
        },
      });

      if (data.modules && data.modules.length > 0) {
        for (let i = 0; i < data.modules.length; i++) {
          const mod = data.modules[i];
          if (!mod) continue;
          await tx.courseModule.create({
            data: {
              courseId: crs.id,
              order: mod.order ?? i + 1,
              title: mod.title.trim(),
              summary: mod.summary.trim(),
              durationMinutes: mod.durationMinutes,
              learningObjectives: mod.learningObjectives || [],
              overview: mod.overview.trim(),
              keyConcepts: (mod.keyConcepts as any) || [],
              practicalExercise: mod.practicalExercise.trim(),
              competencyVerification: mod.competencyVerification.trim(),
            },
          });
        }
      }

      return crs;
    });

    const fullRecord = await this.getCourseById(organizationId, created.id);
    if (!fullRecord) {
      throw new CourseServiceError("Failed to retrieve created course record", 500);
    }

    return fullRecord;
  }

  /**
   * 4. Update course metadata and replace modules.
   */
  static async updateCourse(
    organizationId: string,
    courseId: string,
    data: UpdateCourseInput
  ): Promise<CourseDetailResponse> {
    const existing = await prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId,
      },
    });

    if (!existing) {
      throw new CourseServiceError("Course not found.", 404, "NOT_FOUND");
    }

    // Code uniqueness check if changed
    if (data.code) {
      const normalizedCode = data.code.trim().toUpperCase();
      if (normalizedCode !== existing.code.toUpperCase()) {
        const duplicate = await prisma.course.findFirst({
          where: {
            organizationId,
            code: { equals: normalizedCode, mode: "insensitive" },
            id: { not: courseId },
          },
        });

        if (duplicate) {
          throw new CourseServiceError(
            `Course code "${normalizedCode}" is already in use in this organization.`,
            409,
            "DUPLICATE_CODE"
          );
        }
      }
    }

    // Competency validation if changed
    if (data.competencyId) {
      const competency = await prisma.competency.findFirst({
        where: {
          id: data.competencyId,
          organizationId,
        },
      });

      if (!competency) {
        throw new CourseServiceError(
          "The specified competency does not exist in this organization.",
          400,
          "INVALID_COMPETENCY"
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: courseId },
        data: {
          title: data.title?.trim() || undefined,
          code: data.code?.trim().toUpperCase() || undefined,
          description: data.description?.trim() || undefined,
          category: data.category?.trim() || undefined,
          competencyId: data.competencyId || undefined,
          targetLevel: data.targetLevel || undefined,
          durationHours: data.durationHours || undefined,
          rating: data.rating !== undefined ? data.rating : undefined,
          status: (data.status as CourseStatus) || undefined,
        },
      });

      if (data.modules !== undefined) {
        // Fetch existing modules for this course
        const existingModules = await tx.courseModule.findMany({
          where: { courseId },
          include: {
            _count: {
              select: { progress: true },
            },
          },
        });

        const existingModuleMap = new Map(existingModules.map((m) => [m.id, m]));
        const keptModuleIds = new Set<string>();

        // Pass 1: Temporarily shift orders of existing modules to avoid unique constraint collisions
        for (let i = 0; i < existingModules.length; i++) {
          const existingMod = existingModules[i];
          if (!existingMod) continue;
          await tx.courseModule.update({
            where: { id: existingMod.id },
            data: { order: 10000 + i },
          });
        }

        // Pass 2: Upsert / update modules in-place to preserve IDs and learning history
        for (let i = 0; i < data.modules.length; i++) {
          const mod = data.modules[i];
          if (!mod) continue;

          const targetOrder = mod.order ?? i + 1;
          const moduleData = {
            order: targetOrder,
            title: mod.title.trim(),
            summary: mod.summary.trim(),
            durationMinutes: mod.durationMinutes,
            learningObjectives: mod.learningObjectives || [],
            overview: mod.overview.trim(),
            keyConcepts: (mod.keyConcepts as any) || [],
            practicalExercise: mod.practicalExercise.trim(),
            competencyVerification: mod.competencyVerification.trim(),
          };

          if (mod.id && existingModuleMap.has(mod.id)) {
            // Update existing module in-place, preserving its ID and dependent records
            await tx.courseModule.update({
              where: { id: mod.id },
              data: moduleData,
            });
            keptModuleIds.add(mod.id);
          } else {
            // Create new module
            const created = await tx.courseModule.create({
              data: {
                ...moduleData,
                courseId,
              },
            });
            keptModuleIds.add(created.id);
          }
        }

        // Pass 3: Safely delete only removed modules that have NO learning history
        for (const oldMod of existingModules) {
          if (!keptModuleIds.has(oldMod.id)) {
            if (oldMod._count.progress === 0) {
              await tx.courseModule.delete({
                where: { id: oldMod.id },
              });
            }
          }
        }
      }
    });

    const fullRecord = await this.getCourseById(organizationId, courseId);
    if (!fullRecord) {
      throw new CourseServiceError("Failed to retrieve updated course record", 500);
    }

    return fullRecord;
  }

  /**
   * 5. Delete course with dependency check (cannot delete if active enrollments exist).
   */
  static async deleteCourse(
    organizationId: string,
    courseId: string
  ): Promise<{ id: string; title: string; message: string }> {
    const existing = await prisma.course.findFirst({
      where: {
        id: courseId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!existing) {
      throw new CourseServiceError("Course not found.", 404, "NOT_FOUND");
    }

    if (existing._count.enrollments > 0) {
      throw new CourseServiceError(
        `This course cannot be deleted because ${existing._count.enrollments} employee(s) are enrolled in it.`,
        409,
        "COURSE_IN_USE",
        { enrollmentsCount: existing._count.enrollments }
      );
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return {
      id: existing.id,
      title: existing.title,
      message: `Course "${existing.title}" was successfully deleted.`,
    };
  }
}
