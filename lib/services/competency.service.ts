import { prisma } from "@/lib/db/prisma";
import {
  CreateCompetencyInput,
  UpdateCompetencyInput,
  CompetencyQueryInput,
  defaultCompetencyLevels,
  CompetencyLevelInput,
} from "@/lib/validations/competency";

export class CompetencyServiceError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 400,
    code = "COMPETENCY_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "CompetencyServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface CompetencyLevelRecord {
  id: string;
  level: number;
  label: string;
  description: string;
  behavioralIndicators: string[];
}

export interface CompetencyListItem {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: string;
  description: string;
  levelsCount: number;
  levels: CompetencyLevelRecord[];
  usage: {
    designationsCount: number;
    employeesAssessedCount: number;
    coursesCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyDetailResponse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: string;
  description: string;
  levels: CompetencyLevelRecord[];
  usage: {
    designationsCount: number;
    employeesAssessedCount: number;
    coursesCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Service providing database operations and business logic for Competencies.
 */
export class CompetencyService {
  /**
   * 1. List competencies with filtering, search, and tenant isolation.
   */
  static async getCompetencies(
    organizationId: string,
    query: Partial<CompetencyQueryInput> = {}
  ): Promise<{
    competencies: CompetencyListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, category, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (category) {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.competency.count({ where }),
      prisma.competency.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          levels: {
            orderBy: { level: "asc" },
          },
          _count: {
            select: {
              designationRequirements: true,
              employeeAssessments: true,
              courses: true,
            },
          },
        },
      }),
    ]);

    const competencies: CompetencyListItem[] = records.map((comp) => ({
      id: comp.id,
      organizationId: comp.organizationId,
      name: comp.name,
      code: comp.code,
      category: comp.category,
      description: comp.description,
      levelsCount: comp.levels.length,
      levels: comp.levels.map((lvl) => ({
        id: lvl.id,
        level: lvl.level,
        label: lvl.label,
        description: lvl.description,
        behavioralIndicators: lvl.behavioralIndicators,
      })),
      usage: {
        designationsCount: comp._count.designationRequirements,
        employeesAssessedCount: comp._count.employeeAssessments,
        coursesCount: comp._count.courses,
      },
      createdAt: comp.createdAt.toISOString(),
      updatedAt: comp.updatedAt.toISOString(),
    }));

    return {
      competencies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. Get single competency by ID with full level definitions.
   */
  static async getCompetencyById(
    organizationId: string,
    competencyId: string
  ): Promise<CompetencyDetailResponse | null> {
    const comp = await prisma.competency.findFirst({
      where: {
        id: competencyId,
        organizationId,
      },
      include: {
        levels: {
          orderBy: { level: "asc" },
        },
        _count: {
          select: {
            designationRequirements: true,
            employeeAssessments: true,
            courses: true,
          },
        },
      },
    });

    if (!comp) {
      return null;
    }

    return {
      id: comp.id,
      organizationId: comp.organizationId,
      name: comp.name,
      code: comp.code,
      category: comp.category,
      description: comp.description,
      levels: comp.levels.map((lvl) => ({
        id: lvl.id,
        level: lvl.level,
        label: lvl.label,
        description: lvl.description,
        behavioralIndicators: lvl.behavioralIndicators,
      })),
      usage: {
        designationsCount: comp._count.designationRequirements,
        employeesAssessedCount: comp._count.employeeAssessments,
        coursesCount: comp._count.courses,
      },
      createdAt: comp.createdAt.toISOString(),
      updatedAt: comp.updatedAt.toISOString(),
    };
  }

  /**
   * 3. Create a competency with atomic transaction for all 5 level definitions.
   */
  static async createCompetency(
    organizationId: string,
    data: CreateCompetencyInput
  ): Promise<CompetencyDetailResponse> {
    const code = data.code.trim().toUpperCase();
    const name = data.name.trim();

    // Check duplicate code within organization
    const existing = await prisma.competency.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new CompetencyServiceError(
        `A competency with code "${code}" already exists in this organization.`,
        409,
        "DUPLICATE_CODE"
      );
    }

    // Prepare complete 5-level scale
    const levelsMap = new Map<number, CompetencyLevelInput>();
    for (const defLvl of defaultCompetencyLevels) {
      levelsMap.set(defLvl.level, defLvl);
    }
    if (data.levels && data.levels.length > 0) {
      for (const customLvl of data.levels) {
        levelsMap.set(customLvl.level, customLvl);
      }
    }

    const levelsToCreate = Array.from(levelsMap.values()).sort((a, b) => a.level - b.level);

    // Atomic creation via transaction
    const createdCompetency = await prisma.$transaction(async (tx) => {
      const comp = await tx.competency.create({
        data: {
          organizationId,
          name,
          code,
          category: data.category.trim(),
          description: data.description.trim(),
        },
      });

      for (const lvl of levelsToCreate) {
        await tx.competencyLevel.create({
          data: {
            competencyId: comp.id,
            level: lvl.level,
            label: lvl.label.trim(),
            description: lvl.description.trim(),
            behavioralIndicators: lvl.behavioralIndicators || [],
          },
        });
      }

      return comp;
    });

    const fullRecord = await this.getCompetencyById(organizationId, createdCompetency.id);
    if (!fullRecord) {
      throw new CompetencyServiceError("Failed to retrieve created competency record", 500);
    }

    return fullRecord;
  }

  /**
   * 4. Update competency details and levels atomically.
   */
  static async updateCompetency(
    organizationId: string,
    competencyId: string,
    data: UpdateCompetencyInput
  ): Promise<CompetencyDetailResponse> {
    const existing = await prisma.competency.findFirst({
      where: {
        id: competencyId,
        organizationId,
      },
    });

    if (!existing) {
      throw new CompetencyServiceError("Competency not found.", 404, "NOT_FOUND");
    }

    // If code is changing, check uniqueness
    if (data.code) {
      const normalizedCode = data.code.trim().toUpperCase();
      if (normalizedCode !== existing.code.toUpperCase()) {
        const duplicate = await prisma.competency.findFirst({
          where: {
            organizationId,
            code: { equals: normalizedCode, mode: "insensitive" },
            id: { not: competencyId },
          },
        });

        if (duplicate) {
          throw new CompetencyServiceError(
            `Competency code "${normalizedCode}" is already in use in this organization.`,
            409,
            "DUPLICATE_CODE"
          );
        }
      }
    }

    // Atomic update
    await prisma.$transaction(async (tx) => {
      await tx.competency.update({
        where: { id: competencyId },
        data: {
          name: data.name?.trim() || undefined,
          code: data.code?.trim().toUpperCase() || undefined,
          category: data.category?.trim() || undefined,
          description: data.description?.trim() || undefined,
        },
      });

      if (data.levels && data.levels.length > 0) {
        for (const lvl of data.levels) {
          await tx.competencyLevel.upsert({
            where: {
              competencyId_level: {
                competencyId,
                level: lvl.level,
              },
            },
            update: {
              label: lvl.label.trim(),
              description: lvl.description.trim(),
              behavioralIndicators: lvl.behavioralIndicators || [],
            },
            create: {
              competencyId,
              level: lvl.level,
              label: lvl.label.trim(),
              description: lvl.description.trim(),
              behavioralIndicators: lvl.behavioralIndicators || [],
            },
          });
        }
      }
    });

    const fullRecord = await this.getCompetencyById(organizationId, competencyId);
    if (!fullRecord) {
      throw new CompetencyServiceError("Failed to retrieve updated competency record", 500);
    }

    return fullRecord;
  }

  /**
   * 5. Delete competency with dependency protection.
   * Checks references across designations, employee assessments, and courses.
   */
  static async deleteCompetency(
    organizationId: string,
    competencyId: string
  ): Promise<{ id: string; name: string; message: string }> {
    const existing = await prisma.competency.findFirst({
      where: {
        id: competencyId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            designationRequirements: true,
            employeeAssessments: true,
            courses: true,
            reassessments: true,
          },
        },
      },
    });

    if (!existing) {
      throw new CompetencyServiceError("Competency not found.", 404, "NOT_FOUND");
    }

    const { designationRequirements, employeeAssessments, courses, reassessments } =
      existing._count;

    // If any dependencies exist, reject deletion with 409 Conflict
    if (
      designationRequirements > 0 ||
      employeeAssessments > 0 ||
      courses > 0 ||
      reassessments > 0
    ) {
      const reasons: string[] = [];
      if (designationRequirements > 0) {
        reasons.push(`${designationRequirements} designation requirement(s)`);
      }
      if (employeeAssessments > 0) {
        reasons.push(`${employeeAssessments} employee assessment(s)`);
      }
      if (courses > 0) {
        reasons.push(`${courses} course(s)`);
      }
      if (reassessments > 0) {
        reasons.push(`${reassessments} reassessment request(s)`);
      }

      throw new CompetencyServiceError(
        `This competency cannot be deleted because it is actively referenced by: ${reasons.join(
          ", "
        )}.`,
        409,
        "COMPETENCY_IN_USE",
        {
          designationRequirements,
          employeeAssessments,
          courses,
          reassessments,
        }
      );
    }

    // Safe deletion: cascade deletes levels
    await prisma.competency.delete({
      where: { id: competencyId },
    });

    return {
      id: existing.id,
      name: existing.name,
      message: `Competency "${existing.name}" was successfully deleted.`,
    };
  }
}
