import { prisma } from "@/lib/db/prisma";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeQueryInput,
} from "@/lib/validations/employee";
import {
  calculateSkillGap,
  RequiredCompetencyInput,
  CurrentCompetencyInput,
  CompetencyGapResult,
} from "@/lib/skill-gap/calculateSkillGap";
import { EmployeeStatus } from "@prisma/client";

export class EmployeeServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "EMPLOYEE_ERROR") {
    super(message);
    this.name = "EmployeeServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface EmployeeListItem {
  id: string;
  organizationId: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string | null;
  designationId: string | null;
  designationTitle: string;
  status: EmployeeStatus;
  joiningDate: string | null;
  competenciesCount: number;
  createdAt: string;
}

export interface EmployeeDetailResponse {
  id: string;
  organizationId: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string | null;
  status: EmployeeStatus;
  joiningDate: string | null;
  designation: {
    id: string;
    title: string;
    code: string;
    department: string | null;
    description: string | null;
  } | null;
  competencies: Array<{
    competencyId: string;
    competencyName: string;
    category: string;
    currentLevel: number;
    assessedAt: string;
    assessedBy: string | null;
  }>;
  skillGaps: CompetencyGapResult[];
  summary: {
    totalRequired: number;
    meetsRequirementCount: number;
    needsImprovementCount: number;
    notAssessedCount: number;
    averageGap: number;
  };
  enrollments: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
    status: string;
    enrolledAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service providing database operations and business logic for Employees.
 */
export class EmployeeService {
  /**
   * 1. Get employees list with search, filtering, and organization isolation.
   */
  static async getEmployees(
    organizationId: string,
    query: Partial<EmployeeQueryInput> = {}
  ): Promise<{
    employees: EmployeeListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, department, designationId, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = {
        equals: department,
        mode: "insensitive",
      };
    }

    if (designationId) {
      where.designationId = designationId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          designation: {
            select: {
              id: true,
              title: true,
              code: true,
              department: true,
            },
          },
          _count: {
            select: {
              competencies: true,
            },
          },
        },
      }),
    ]);

    const employees: EmployeeListItem[] = records.map((emp) => ({
      id: emp.id,
      organizationId: emp.organizationId,
      employeeCode: emp.employeeCode,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      designationId: emp.designationId,
      designationTitle: emp.designation?.title ?? "Unassigned",
      status: emp.status,
      joiningDate: emp.joiningDate ? (emp.joiningDate.toISOString().split("T")[0] ?? null) : null,
      competenciesCount: emp._count.competencies,
      createdAt: emp.createdAt.toISOString(),
    }));

    return {
      employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. Get detailed employee profile including dynamic skill gaps.
   */
  static async getEmployeeById(
    organizationId: string,
    employeeId: string
  ): Promise<EmployeeDetailResponse | null> {
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
      include: {
        designation: {
          include: {
            requirements: {
              include: {
                competency: true,
              },
            },
          },
        },
        competencies: {
          include: {
            competency: true,
          },
          orderBy: {
            competency: {
              name: "asc",
            },
          },
        },
        enrollments: {
          include: {
            course: true,
          },
          orderBy: {
            enrolledAt: "desc",
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    // Build skill gaps dynamically
    const requiredInputs: RequiredCompetencyInput[] = (
      employee.designation?.requirements || []
    ).map((req) => ({
      competencyId: req.competencyId,
      competencyName: req.competency.name,
      category: req.competency.category,
      requiredLevel: req.requiredLevel,
    }));

    const currentInputs: CurrentCompetencyInput[] = employee.competencies.map((comp) => ({
      competencyId: comp.competencyId,
      currentLevel: comp.currentLevel,
      assessedAt: comp.assessedAt ? (comp.assessedAt.toISOString().split("T")[0] ?? undefined) : undefined,
    }));

    const skillGaps = calculateSkillGap(requiredInputs, currentInputs);

    let meetsCount = 0;
    let needsImprovementCount = 0;
    let notAssessedCount = 0;
    let totalGapValue = 0;

    for (const g of skillGaps) {
      if (g.status === "MEETS_REQUIREMENT") meetsCount++;
      else if (g.status === "NEEDS_IMPROVEMENT") needsImprovementCount++;
      else if (g.status === "NOT_ASSESSED") notAssessedCount++;

      if (g.gap > 0) totalGapValue += g.gap;
    }

    const averageGap =
      skillGaps.length > 0 ? Number((totalGapValue / skillGaps.length).toFixed(1)) : 0;

    return {
      id: employee.id,
      organizationId: employee.organizationId,
      employeeCode: employee.employeeCode,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      status: employee.status,
      joiningDate: employee.joiningDate ? (employee.joiningDate.toISOString().split("T")[0] ?? null) : null,
      designation: employee.designation
        ? {
            id: employee.designation.id,
            title: employee.designation.title,
            code: employee.designation.code,
            department: employee.designation.department,
            description: employee.designation.description,
          }
        : null,
      competencies: employee.competencies.map((c) => ({
        competencyId: c.competencyId,
        competencyName: c.competency.name,
        category: c.competency.category,
        currentLevel: c.currentLevel,
        assessedAt: c.assessedAt ? (c.assessedAt.toISOString().split("T")[0] ?? "2024-01-01") : "2024-01-01",
        assessedBy: c.assessedBy,
      })),
      skillGaps,
      summary: {
        totalRequired: requiredInputs.length,
        meetsRequirementCount: meetsCount,
        needsImprovementCount,
        notAssessedCount,
        averageGap,
      },
      enrollments: employee.enrollments.map((enr) => ({
        id: enr.id,
        courseId: enr.courseId,
        courseTitle: enr.course.title,
        progressPercent: enr.progressPercent,
        completedLessons: enr.completedLessons,
        totalLessons: enr.totalLessons,
        status: enr.status,
        enrolledAt: enr.enrolledAt ? (enr.enrolledAt.toISOString().split("T")[0] ?? "2024-01-01") : "2024-01-01",
      })),
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }

  /**
   * 3. Create a new employee with atomic transaction for initial assessments.
   */
  static async createEmployee(
    organizationId: string,
    data: CreateEmployeeInput,
    assessedBy = "Administrator"
  ): Promise<EmployeeDetailResponse> {
    const email = data.email.trim().toLowerCase();
    const employeeCode = data.employeeCode.trim().toUpperCase();

    // Check duplicate email in organization
    const existingEmail = await prisma.employee.findFirst({
      where: {
        organizationId,
        email: { equals: email, mode: "insensitive" },
      },
    });

    if (existingEmail) {
      throw new EmployeeServiceError(
        `An employee with email "${email}" already exists in this organization.`,
        409,
        "DUPLICATE_EMAIL"
      );
    }

    // Check duplicate employeeCode in organization
    const existingCode = await prisma.employee.findFirst({
      where: {
        organizationId,
        employeeCode: { equals: employeeCode, mode: "insensitive" },
      },
    });

    if (existingCode) {
      throw new EmployeeServiceError(
        `An employee with code "${employeeCode}" already exists in this organization.`,
        409,
        "DUPLICATE_CODE"
      );
    }

    // Validate designation if supplied
    if (data.designationId) {
      const designation = await prisma.designation.findFirst({
        where: {
          id: data.designationId,
          organizationId,
        },
      });

      if (!designation) {
        throw new EmployeeServiceError(
          "The specified designation does not exist in this organization.",
          400,
          "INVALID_DESIGNATION"
        );
      }
    }

    // Validate competencies if supplied
    if (data.competencies && data.competencies.length > 0) {
      const compIds = data.competencies.map((c) => c.competencyId);
      const validComps = await prisma.competency.findMany({
        where: {
          id: { in: compIds },
          organizationId,
        },
      });

      if (validComps.length !== compIds.length) {
        throw new EmployeeServiceError(
          "One or more specified competencies are invalid for this organization.",
          400,
          "INVALID_COMPETENCY"
        );
      }
    }

    // Atomic creation via transaction
    const createdEmployee = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          organizationId,
          name: data.name.trim(),
          email,
          employeeCode,
          department: data.department?.trim() || null,
          designationId: data.designationId || null,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
          status: (data.status as EmployeeStatus) || EmployeeStatus.ACTIVE,
        },
      });

      if (data.competencies && data.competencies.length > 0) {
        for (const comp of data.competencies) {
          await tx.employeeCompetency.create({
            data: {
              organizationId,
              employeeId: emp.id,
              competencyId: comp.competencyId,
              currentLevel: comp.currentLevel,
              assessedAt: new Date(),
              assessedBy,
            },
          });

          await tx.competencyAssessmentHistory.create({
            data: {
              employeeId: emp.id,
              competencyId: comp.competencyId,
              previousLevel: null,
              newLevel: comp.currentLevel,
              assessedAt: new Date(),
              assessedBy,
              reason: "Initial onboarding baseline evaluation",
            },
          });
        }
      }

      return emp;
    });

    const fullRecord = await this.getEmployeeById(organizationId, createdEmployee.id);
    if (!fullRecord) {
      throw new EmployeeServiceError("Failed to retrieve created employee record", 500);
    }

    return fullRecord;
  }

  /**
   * 4. Update employee profile and competencies.
   */
  static async updateEmployee(
    organizationId: string,
    employeeId: string,
    data: UpdateEmployeeInput,
    updatedBy = "Administrator"
  ): Promise<EmployeeDetailResponse> {
    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
    });

    if (!existing) {
      throw new EmployeeServiceError("Employee not found.", 404, "NOT_FOUND");
    }

    // If email is changing, check uniqueness
    if (data.email) {
      const normalizedEmail = data.email.trim().toLowerCase();
      if (normalizedEmail !== existing.email.toLowerCase()) {
        const duplicate = await prisma.employee.findFirst({
          where: {
            organizationId,
            email: { equals: normalizedEmail, mode: "insensitive" },
            id: { not: employeeId },
          },
        });

        if (duplicate) {
          throw new EmployeeServiceError(
            `Email "${normalizedEmail}" is already in use by another employee.`,
            409,
            "DUPLICATE_EMAIL"
          );
        }
      }
    }

    // Validate designation if changing
    if (data.designationId) {
      const designation = await prisma.designation.findFirst({
        where: {
          id: data.designationId,
          organizationId,
        },
      });

      if (!designation) {
        throw new EmployeeServiceError(
          "The specified designation does not exist in this organization.",
          400,
          "INVALID_DESIGNATION"
        );
      }
    }

    // Atomic update
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employeeId },
        data: {
          name: data.name?.trim() || undefined,
          email: data.email?.trim().toLowerCase() || undefined,
          department: data.department !== undefined ? (data.department?.trim() || null) : undefined,
          designationId: data.designationId !== undefined ? data.designationId : undefined,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
          status: (data.status as EmployeeStatus) || undefined,
        },
      });

      if (data.competencies && data.competencies.length > 0) {
        for (const comp of data.competencies) {
          const currentComp = await tx.employeeCompetency.findUnique({
            where: {
              employeeId_competencyId: {
                employeeId,
                competencyId: comp.competencyId,
              },
            },
          });

          const previousLevel = currentComp?.currentLevel ?? null;

          await tx.employeeCompetency.upsert({
            where: {
              employeeId_competencyId: {
                employeeId,
                competencyId: comp.competencyId,
              },
            },
            update: {
              currentLevel: comp.currentLevel,
              assessedAt: new Date(),
              assessedBy: updatedBy,
              organizationId,
            },
            create: {
              employeeId,
              competencyId: comp.competencyId,
              currentLevel: comp.currentLevel,
              assessedAt: new Date(),
              assessedBy: updatedBy,
              organizationId,
            },
          });

          if (previousLevel !== comp.currentLevel) {
            await tx.competencyAssessmentHistory.create({
              data: {
                employeeId,
                competencyId: comp.competencyId,
                previousLevel,
                newLevel: comp.currentLevel,
                assessedAt: new Date(),
                assessedBy: updatedBy,
                reason: "Direct competency level adjustment",
              },
            });
          }
        }
      }
    });

    const fullRecord = await this.getEmployeeById(organizationId, employeeId);
    if (!fullRecord) {
      throw new EmployeeServiceError("Failed to retrieve updated employee record", 500);
    }

    return fullRecord;
  }

  /**
   * 5. Soft-delete / Deactivate employee.
   */
  static async deactivateEmployee(
    organizationId: string,
    employeeId: string
  ): Promise<EmployeeDetailResponse> {
    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
    });

    if (!existing) {
      throw new EmployeeServiceError("Employee not found.", 404, "NOT_FOUND");
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.INACTIVE,
      },
    });

    const fullRecord = await this.getEmployeeById(organizationId, employeeId);
    if (!fullRecord) {
      throw new EmployeeServiceError("Failed to retrieve employee record", 500);
    }

    return fullRecord;
  }

  /**
   * 6. Reactivate employee.
   */
  static async reactivateEmployee(
    organizationId: string,
    employeeId: string
  ): Promise<EmployeeDetailResponse> {
    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
    });

    if (!existing) {
      throw new EmployeeServiceError("Employee not found.", 404, "NOT_FOUND");
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        status: EmployeeStatus.ACTIVE,
      },
    });

    const fullRecord = await this.getEmployeeById(organizationId, employeeId);
    if (!fullRecord) {
      throw new EmployeeServiceError("Failed to retrieve employee record", 500);
    }

    return fullRecord;
  }
}
