import { prisma } from "@/lib/db/prisma";
import { UpdateOrganizationInput } from "@/lib/validations/organization";

export class OrganizationServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "ORGANIZATION_ERROR") {
    super(message);
    this.name = "OrganizationServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface OrganizationDetailResponse {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  industry: string | null;
  statistics: {
    employeesCount: number;
    competenciesCount: number;
    designationsCount: number;
    coursesCount: number;
    activeUsersCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export class OrganizationService {
  /**
   * 1. Get organization profile and entity count statistics.
   */
  static async getOrganization(organizationId: string): Promise<OrganizationDetailResponse | null> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            employees: true,
            competencies: true,
            designations: true,
            courses: true,
            users: true,
          },
        },
      },
    });

    if (!org) return null;

    return {
      id: org.id,
      name: org.name,
      code: org.code,
      description: org.description,
      industry: org.industry,
      statistics: {
        employeesCount: org._count.employees,
        competenciesCount: org._count.competencies,
        designationsCount: org._count.designations,
        coursesCount: org._count.courses,
        activeUsersCount: org._count.users,
      },
      createdAt: org.createdAt.toISOString(),
      updatedAt: org.updatedAt.toISOString(),
    };
  }

  /**
   * 2. Update organization details.
   */
  static async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationInput
  ): Promise<OrganizationDetailResponse> {
    const existing = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!existing) {
      throw new OrganizationServiceError("Organization not found.", 404, "NOT_FOUND");
    }

    if (
      data.code &&
      existing.code &&
      data.code.trim().toUpperCase() !== existing.code.toUpperCase()
    ) {
      const duplicate = await prisma.organization.findFirst({
        where: {
          code: { equals: data.code.trim().toUpperCase(), mode: "insensitive" },
          id: { not: organizationId },
        },
      });

      if (duplicate) {
        throw new OrganizationServiceError(
          `Organization code "${data.code}" is already in use.`,
          409,
          "DUPLICATE_CODE"
        );
      }
    }

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name?.trim() || undefined,
        code: data.code?.trim().toUpperCase() || undefined,
        description: data.description !== undefined ? (data.description?.trim() || null) : undefined,
        industry: data.industry !== undefined ? (data.industry?.trim() || null) : undefined,
      },
    });

    const fullRecord = await this.getOrganization(organizationId);
    if (!fullRecord) {
      throw new OrganizationServiceError("Failed to retrieve updated organization.", 500);
    }

    return fullRecord;
  }
}
