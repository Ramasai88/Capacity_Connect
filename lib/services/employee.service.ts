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
import crypto from "crypto";
import { RoleLearningService } from "./role-learning.service";
import { AuditService } from "./audit.service";
import { ActivationService } from "./activation.service";
import { EmailService } from "./email.service";

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

    let rawActivationToken: string | null = null;

    // Atomic creation via transaction
    const createdEmployee = await prisma.$transaction(
      async (tx) => {
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

        if (emp.designationId) {
          await RoleLearningService.syncEmployeeRoleCourseEnrollments(
            organizationId,
            emp.id,
            emp.designationId,
            tx
          );
        }

        // Provision unactivated User account linked to this Employee
        let user = await tx.user.findFirst({
          where: {
            email: { equals: email, mode: "insensitive" },
            organizationId,
          },
        });

        if (!user) {
          const lockedPlaceholder = `$2a$10$LOCKED_UNACTIVATED_${crypto.randomBytes(16).toString("hex")}`;
          user = await tx.user.create({
            data: {
              organizationId,
              name: data.name.trim(),
              email,
              passwordHash: lockedPlaceholder,
              role: "EMPLOYEE",
              employeeId: emp.id,
              isActivated: false,
            },
          });
        } else if (!user.employeeId) {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              employeeId: emp.id,
              isActivated: false,
            },
          });
        }

        // Create secure one-time activation token
        const tokenResult = await ActivationService.createToken(
          {
            userId: user.id,
            employeeId: emp.id,
            organizationId,
          },
          tx
        );

        rawActivationToken = tokenResult.rawToken;

        return emp;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Send activation email after successful transaction commit
    if (rawActivationToken) {
      try {
        const org = await prisma.organization.findUnique({
          where: { id: organizationId },
          select: { name: true },
        });

        await EmailService.sendActivationEmail({
          recipientEmail: email,
          recipientName: data.name.trim(),
          employeeCode,
          rawToken: rawActivationToken,
          organizationName: org?.name,
        });
      } catch (emailErr) {
        console.error("Failed to send activation email:", emailErr);
      }
    }

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
    updatedBy = "Administrator",
    actorUserId?: string | null,
    actorRole?: any | null
  ): Promise<EmployeeDetailResponse> {
    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
      include: {
        user: true,
      },
    });

    if (!existing) {
      throw new EmployeeServiceError("Employee not found.", 404, "NOT_FOUND");
    }

    const newName = data.name !== undefined ? data.name.trim() : undefined;
    if (newName !== undefined && newName.length < 2) {
      throw new EmployeeServiceError("Full Name must be at least 2 characters.", 400, "INVALID_NAME");
    }

    let normalizedEmail: string | undefined = undefined;
    if (data.email) {
      normalizedEmail = data.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new EmployeeServiceError("Enter a valid email address.", 400, "INVALID_EMAIL");
      }

      if (normalizedEmail !== existing.email.toLowerCase()) {
        // Check duplicate email in Employee records
        const duplicateEmployee = await prisma.employee.findFirst({
          where: {
            organizationId,
            email: { equals: normalizedEmail, mode: "insensitive" },
            id: { not: employeeId },
          },
        });

        if (duplicateEmployee) {
          throw new EmployeeServiceError(
            `Email "${normalizedEmail}" is already in use by another employee in this organization.`,
            409,
            "DUPLICATE_EMAIL"
          );
        }

        // Check duplicate email in User records (excluding the user linked to this employee)
        const duplicateUser = await prisma.user.findFirst({
          where: {
            organizationId,
            email: { equals: normalizedEmail, mode: "insensitive" },
            id: existing.user ? { not: existing.user.id } : undefined,
            employeeId: { not: employeeId },
          },
        });

        if (duplicateUser) {
          throw new EmployeeServiceError(
            `An account with email "${normalizedEmail}" already exists in this organization.`,
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
    await prisma.$transaction(
      async (tx) => {
        await tx.employee.update({
          where: { id: employeeId },
          data: {
            name: newName,
            email: normalizedEmail,
            department: data.department !== undefined ? (data.department?.trim() || null) : undefined,
            designationId: data.designationId !== undefined ? data.designationId : undefined,
            joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
            status: (data.status as EmployeeStatus) || undefined,
          },
        });

        // Synchronize linked User account if present
        if (existing.user || newName || normalizedEmail) {
          await tx.user.updateMany({
            where: {
              organizationId,
              OR: [
                { employeeId: employeeId },
                { email: existing.email },
              ],
            },
            data: {
              name: newName || undefined,
              email: normalizedEmail || undefined,
            },
          });
        }

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

        // If designation changed, auto-assign newly required role courses
        const targetDesignationId = data.designationId !== undefined ? data.designationId : existing.designationId;
        if (targetDesignationId) {
          await RoleLearningService.syncEmployeeRoleCourseEnrollments(
            organizationId,
            employeeId,
            targetDesignationId,
            tx
          );
        }
      },
      { maxWait: 15000, timeout: 30000 }
    );

    await AuditService.log({
      organizationId,
      actorId: actorUserId ?? null,
      actorName: updatedBy,
      actorRole: actorRole ?? "ADMIN",
      action: "USER_PROFILE_UPDATED",
      category: "USER_MANAGEMENT",
      targetId: existing.id,
      targetName: newName || existing.name,
      description: `Administrator ${updatedBy} updated profile information for ${existing.name} (${existing.employeeCode}).`,
      metadata: {
        employeeId: existing.id,
        employeeCode: existing.employeeCode,
        previousName: existing.name,
        newName: newName || existing.name,
        previousEmail: existing.email,
        newEmail: normalizedEmail || existing.email,
      },
    });

    const fullRecord = await this.getEmployeeById(organizationId, employeeId);
    if (!fullRecord) {
      throw new EmployeeServiceError("Failed to retrieve updated employee record", 500);
    }

    return fullRecord;
  }

  /**
   * 5. Soft-delete / Deactivate employee (Step 1).
   * Moves employee to Removed Employees while preserving all historical records.
   */
  static async deactivateEmployee(
    organizationId: string,
    employeeId: string,
    actorUserId?: string | null,
    actorName?: string | null,
    actorRole?: any | null
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

    await AuditService.log({
      organizationId,
      actorId: actorUserId ?? null,
      actorName: actorName ?? "Administrator",
      actorRole: actorRole ?? "ADMIN",
      action: "EMPLOYEE_REMOVED",
      category: "USER_MANAGEMENT",
      targetId: existing.id,
      targetName: existing.name,
      description: `Employee ${existing.name} (${existing.employeeCode}) was deactivated and moved to Removed Employees.`,
      metadata: {
        employeeCode: existing.employeeCode,
        email: existing.email,
        department: existing.department,
        name: existing.name,
      },
    });

    const fullRecord = await this.getEmployeeById(organizationId, employeeId);
    if (!fullRecord) {
      throw new EmployeeServiceError("Failed to retrieve employee record", 500);
    }

    return fullRecord;
  }

  /**
   * 6. Reactivate / Restore employee.
   * Restores employee back to ACTIVE without creating duplicate records.
   */
  static async reactivateEmployee(
    organizationId: string,
    employeeId: string,
    actorUserId?: string | null,
    actorName?: string | null,
    actorRole?: any | null
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

    await AuditService.log({
      organizationId,
      actorId: actorUserId ?? null,
      actorName: actorName ?? "Administrator",
      actorRole: actorRole ?? "ADMIN",
      action: "EMPLOYEE_RESTORED",
      category: "USER_MANAGEMENT",
      targetId: existing.id,
      targetName: existing.name,
      description: `Employee ${existing.name} (${existing.employeeCode}) was restored to active status.`,
      metadata: {
        employeeCode: existing.employeeCode,
        email: existing.email,
        department: existing.department,
        name: existing.name,
      },
    });

    const fullRecord = await this.getEmployeeById(organizationId, employeeId);
    if (!fullRecord) {
      throw new EmployeeServiceError("Failed to retrieve employee record", 500);
    }

    return fullRecord;
  }

  /**
   * 7. Permanently delete employee and employee-owned records (Step 2).
   * Irreversible atomic transaction. Preserves all shared courses, modules, competencies, designations.
   */
  static async permanentlyDeleteEmployee(
    organizationId: string,
    employeeId: string,
    actorUserId?: string | null,
    actorName?: string | null,
    actorRole?: any | null
  ): Promise<{ success: boolean; deletedEmployee: { id: string; name: string; employeeCode: string; email: string } }> {
    const existing = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        organizationId,
      },
    });

    if (!existing) {
      throw new EmployeeServiceError("Employee not found.", 404, "NOT_FOUND");
    }

    const employeeSnapshot = {
      id: existing.id,
      name: existing.name,
      employeeCode: existing.employeeCode,
      email: existing.email,
      department: existing.department,
    };

    await prisma.$transaction(
      async (tx) => {
        // 1. Delete associated user login account(s) using the verified Prisma relation
        await tx.user.deleteMany({
          where: {
            organizationId,
            employeeId: existing.id,
          },
        });

        // 2. Delete employee-owned learning recommendations
        await tx.skillRecommendation.deleteMany({
          where: { employeeId: existing.id },
        });

        // 3. Delete employee-owned skill assessments
        await tx.skillAssessment.deleteMany({
          where: { employeeId: existing.id },
        });

        // 4. Delete employee-owned reassessments
        await tx.reassessment.deleteMany({
          where: { employeeId: existing.id },
        });

        // 5. Delete employee-owned competency history
        await tx.competencyAssessmentHistory.deleteMany({
          where: { employeeId: existing.id },
        });

        // 6. Delete employee-owned competencies
        await tx.employeeCompetency.deleteMany({
          where: { employeeId: existing.id },
        });

        // 7. Delete employee course enrollments (cascades to moduleProgress)
        const enrollments = await tx.courseEnrollment.findMany({
          where: { employeeId: existing.id },
          select: { id: true },
        });
        const enrollmentIds = enrollments.map((e) => e.id);
        if (enrollmentIds.length > 0) {
          await tx.moduleProgress.deleteMany({
            where: { enrollmentId: { in: enrollmentIds } },
          });
        }
        await tx.courseEnrollment.deleteMany({
          where: { employeeId: existing.id },
        });

        // 8. Delete the employee record itself
        await tx.employee.delete({
          where: { id: existing.id },
        });
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // 9. Log audit event (metadata safely preserved without passwords/secrets)
    await AuditService.log({
      organizationId,
      actorId: actorUserId ?? null,
      actorName: actorName ?? "Administrator",
      actorRole: actorRole ?? "ADMIN",
      action: "EMPLOYEE_PERMANENTLY_DELETED",
      category: "USER_MANAGEMENT",
      targetId: employeeSnapshot.id,
      targetName: employeeSnapshot.name,
      description: `Employee ${employeeSnapshot.name} (${employeeSnapshot.employeeCode}) and employee-owned records were permanently deleted.`,
      metadata: {
        employeeCode: employeeSnapshot.employeeCode,
        email: employeeSnapshot.email,
        department: employeeSnapshot.department,
        name: employeeSnapshot.name,
      },
    });

    return {
      success: true,
      deletedEmployee: employeeSnapshot,
    };
  }
}
