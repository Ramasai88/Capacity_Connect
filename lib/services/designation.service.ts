import { prisma } from "@/lib/db/prisma";
import {
  CreateDesignationInput,
  UpdateDesignationInput,
  DesignationQueryInput,
} from "@/lib/validations/designation";

export class DesignationServiceError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 400,
    code = "DESIGNATION_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "DesignationServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface DesignationRequirementDetail {
  id: string;
  competencyId: string;
  competencyName: string;
  competencyCode: string;
  category: string;
  requiredLevel: number;
}

export interface DesignationListItem {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  department: string | null;
  description: string | null;
  assignedEmployeesCount: number;
  requirementsCount: number;
  requirements: DesignationRequirementDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface DesignationDetailResponse {
  id: string;
  organizationId: string;
  title: string;
  code: string;
  department: string | null;
  description: string | null;
  assignedEmployeesCount: number;
  requirements: DesignationRequirementDetail[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Service providing database operations and business logic for Designations.
 */
export class DesignationService {
  /**
   * 1. List designations with search, department filtering, requirements, and tenant isolation.
   */
  static async getDesignations(
    organizationId: string,
    query: Partial<DesignationQueryInput> = {}
  ): Promise<{
    designations: DesignationListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, department, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (department) {
      where.department = {
        equals: department,
        mode: "insensitive",
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.designation.count({ where }),
      prisma.designation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: "asc" },
        include: {
          requirements: {
            include: {
              competency: true,
            },
            orderBy: {
              competency: {
                name: "asc",
              },
            },
          },
          _count: {
            select: {
              employees: true,
            },
          },
        },
      }),
    ]);

    const designations: DesignationListItem[] = records.map((des) => ({
      id: des.id,
      organizationId: des.organizationId,
      title: des.title,
      code: des.code,
      department: des.department,
      description: des.description,
      assignedEmployeesCount: des._count.employees,
      requirementsCount: des.requirements.length,
      requirements: des.requirements.map((r) => ({
        id: r.id,
        competencyId: r.competencyId,
        competencyName: r.competency.name,
        competencyCode: r.competency.code,
        category: r.competency.category,
        requiredLevel: r.requiredLevel,
      })),
      createdAt: des.createdAt.toISOString(),
      updatedAt: des.updatedAt.toISOString(),
    }));

    return {
      designations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. Get detailed single designation by ID.
   */
  static async getDesignationById(
    organizationId: string,
    designationId: string
  ): Promise<DesignationDetailResponse | null> {
    const des = await prisma.designation.findFirst({
      where: {
        id: designationId,
        organizationId,
      },
      include: {
        requirements: {
          include: {
            competency: true,
          },
          orderBy: {
            competency: {
              name: "asc",
            },
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!des) {
      return null;
    }

    return {
      id: des.id,
      organizationId: des.organizationId,
      title: des.title,
      code: des.code,
      department: des.department,
      description: des.description,
      assignedEmployeesCount: des._count.employees,
      requirements: des.requirements.map((r) => ({
        id: r.id,
        competencyId: r.competencyId,
        competencyName: r.competency.name,
        competencyCode: r.competency.code,
        category: r.competency.category,
        requiredLevel: r.requiredLevel,
      })),
      createdAt: des.createdAt.toISOString(),
      updatedAt: des.updatedAt.toISOString(),
    };
  }

  /**
   * 3. Create designation with atomic transaction for competency requirements.
   */
  static async createDesignation(
    organizationId: string,
    data: CreateDesignationInput
  ): Promise<DesignationDetailResponse> {
    const code = data.code.trim().toUpperCase();
    const title = data.title.trim();

    // Check duplicate code in organization
    const existing = await prisma.designation.findFirst({
      where: {
        organizationId,
        code: { equals: code, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new DesignationServiceError(
        `A designation with code "${code}" already exists in this organization.`,
        409,
        "DUPLICATE_CODE"
      );
    }

    // Validate all competency requirements belong to the same organization
    if (data.competencyRequirements && data.competencyRequirements.length > 0) {
      const compIds = data.competencyRequirements.map((r) => r.competencyId);
      const validComps = await prisma.competency.findMany({
        where: {
          id: { in: compIds },
          organizationId,
        },
      });

      if (validComps.length !== compIds.length) {
        throw new DesignationServiceError(
          "One or more specified competencies do not exist or belong to another organization.",
          400,
          "INVALID_COMPETENCY"
        );
      }
    }

    // Atomic creation via transaction
    const createdDesignation = await prisma.$transaction(async (tx) => {
      const des = await tx.designation.create({
        data: {
          organizationId,
          title,
          code,
          department: data.department?.trim() || null,
          description: data.description?.trim() || null,
        },
      });

      if (data.competencyRequirements && data.competencyRequirements.length > 0) {
        for (const req of data.competencyRequirements) {
          await tx.designationCompetency.create({
            data: {
              organizationId,
              designationId: des.id,
              competencyId: req.competencyId,
              requiredLevel: req.requiredLevel,
            },
          });
        }
      }

      return des;
    });

    const fullRecord = await this.getDesignationById(organizationId, createdDesignation.id);
    if (!fullRecord) {
      throw new DesignationServiceError("Failed to retrieve created designation record", 500);
    }

    return fullRecord;
  }

  /**
   * 4. Update designation metadata and replace competency requirements atomically.
   */
  static async updateDesignation(
    organizationId: string,
    designationId: string,
    data: UpdateDesignationInput
  ): Promise<DesignationDetailResponse> {
    const existing = await prisma.designation.findFirst({
      where: {
        id: designationId,
        organizationId,
      },
    });

    if (!existing) {
      throw new DesignationServiceError("Designation not found.", 404, "NOT_FOUND");
    }

    // If code is changing, check uniqueness
    if (data.code) {
      const normalizedCode = data.code.trim().toUpperCase();
      if (normalizedCode !== existing.code.toUpperCase()) {
        const duplicate = await prisma.designation.findFirst({
          where: {
            organizationId,
            code: { equals: normalizedCode, mode: "insensitive" },
            id: { not: designationId },
          },
        });

        if (duplicate) {
          throw new DesignationServiceError(
            `Designation code "${normalizedCode}" is already in use in this organization.`,
            409,
            "DUPLICATE_CODE"
          );
        }
      }
    }

    // Validate competencies if requirement set is provided
    if (data.competencyRequirements && data.competencyRequirements.length > 0) {
      const compIds = data.competencyRequirements.map((r) => r.competencyId);
      const validComps = await prisma.competency.findMany({
        where: {
          id: { in: compIds },
          organizationId,
        },
      });

      if (validComps.length !== compIds.length) {
        throw new DesignationServiceError(
          "One or more specified competencies do not exist or belong to another organization.",
          400,
          "INVALID_COMPETENCY"
        );
      }
    }

    // Atomic update
    await prisma.$transaction(async (tx) => {
      await tx.designation.update({
        where: { id: designationId },
        data: {
          title: data.title?.trim() || undefined,
          code: data.code?.trim().toUpperCase() || undefined,
          department: data.department !== undefined ? (data.department?.trim() || null) : undefined,
          description: data.description !== undefined ? (data.description?.trim() || null) : undefined,
        },
      });

      if (data.competencyRequirements !== undefined) {
        // Clear existing requirements
        await tx.designationCompetency.deleteMany({
          where: { designationId },
        });

        // Insert new replacement requirement set
        if (data.competencyRequirements.length > 0) {
          for (const req of data.competencyRequirements) {
            await tx.designationCompetency.create({
              data: {
                organizationId,
                designationId,
                competencyId: req.competencyId,
                requiredLevel: req.requiredLevel,
              },
            });
          }
        }
      }
    });

    const fullRecord = await this.getDesignationById(organizationId, designationId);
    if (!fullRecord) {
      throw new DesignationServiceError("Failed to retrieve updated designation record", 500);
    }

    return fullRecord;
  }

  /**
   * 5. Delete designation with dependency protection (cannot delete if employees are assigned).
   */
  static async deleteDesignation(
    organizationId: string,
    designationId: string
  ): Promise<{ id: string; title: string; message: string }> {
    const existing = await prisma.designation.findFirst({
      where: {
        id: designationId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!existing) {
      throw new DesignationServiceError("Designation not found.", 404, "NOT_FOUND");
    }

    const assignedEmployeesCount = existing._count.employees;

    if (assignedEmployeesCount > 0) {
      throw new DesignationServiceError(
        `This designation cannot be deleted because ${assignedEmployeesCount} employee(s) are assigned to it.`,
        409,
        "DESIGNATION_IN_USE",
        { assignedEmployeesCount }
      );
    }

    // Safe delete (cascade deletes designation_competencies)
    await prisma.designation.delete({
      where: { id: designationId },
    });

    return {
      id: existing.id,
      title: existing.title,
      message: `Designation "${existing.title}" was successfully deleted.`,
    };
  }
}
