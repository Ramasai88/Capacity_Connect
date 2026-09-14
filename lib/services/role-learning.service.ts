import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { getExamIdForRole } from "@/lib/assessment/exam-bank";

export class RoleLearningError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "ROLE_LEARNING_ERROR") {
    super(message);
    this.name = "RoleLearningError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface RoleCompetencyRequirement {
  competencyId: string;
  competencyName: string;
  competencyCode: string;
  category: string;
  requiredLevel: number;
}

export interface RoleCourseScope {
  id: string;
  title: string;
  code: string;
  category: string;
  competencyId: string;
  competencyName: string;
  targetLevel: number;
  durationHours: number;
  modulesCount: number;
}

export interface RoleLearningScope {
  designationId: string;
  designationTitle: string;
  designationCode: string;
  department: string | null;
  requiredCompetencies: RoleCompetencyRequirement[];
  eligibleCourses: RoleCourseScope[];
  examId: string;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

/**
 * Centralized service responsible for resolving role-based learning scope,
 * automatic course assignments, and role-aware learning governance.
 */
export class RoleLearningService {
  /**
   * 1. Resolve role learning scope for a designation (competencies, required levels, courses, exam).
   */
  static async resolveRoleScope(
    organizationId: string,
    designationId: string,
    db: DbClient = prisma
  ): Promise<RoleLearningScope | null> {
    const designation = await db.designation.findFirst({
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
            competency: { name: "asc" },
          },
        },
      },
    });

    if (!designation) {
      return null;
    }

    const requiredCompetencyIds = designation.requirements.map((r) => r.competencyId);

    // Fetch published courses matching the designation's required competencies
    const eligibleCoursesRaw = await db.course.findMany({
      where: {
        organizationId,
        status: "PUBLISHED",
        competencyId: { in: requiredCompetencyIds },
      },
      include: {
        competency: {
          select: { name: true },
        },
        _count: {
          select: { modules: true },
        },
      },
      orderBy: { title: "asc" },
    });

    const requiredCompetencies: RoleCompetencyRequirement[] = designation.requirements.map((r) => ({
      competencyId: r.competencyId,
      competencyName: r.competency.name,
      competencyCode: r.competency.code,
      category: r.competency.category,
      requiredLevel: r.requiredLevel,
    }));

    const eligibleCourses: RoleCourseScope[] = eligibleCoursesRaw.map((c) => ({
      id: c.id,
      title: c.title,
      code: c.code,
      category: c.category,
      competencyId: c.competencyId,
      competencyName: c.competency.name,
      targetLevel: c.targetLevel,
      durationHours: c.durationHours,
      modulesCount: c._count.modules,
    }));

    // Resolve diagnostic exam ID for this role / designation
    const examId = getExamIdForRole(designation.code, designation.title);

    return {
      designationId: designation.id,
      designationTitle: designation.title,
      designationCode: designation.code,
      department: designation.department,
      requiredCompetencies,
      eligibleCourses,
      examId,
    };
  }

  /**
   * 2. Automatically and idempotently establish role-based course enrollments for an employee.
   * - Never deletes or overwrites existing enrollments or learning progress.
   * - Preserves historical learning records.
   * - Creates new CourseEnrollment records for newly relevant role courses.
   */
  static async syncEmployeeRoleCourseEnrollments(
    organizationId: string,
    employeeId: string,
    designationId?: string | null,
    db: DbClient = prisma
  ): Promise<{ newlyEnrolledCount: number; totalRoleCourses: number }> {
    if (!designationId) {
      // Look up employee's current designation if not passed
      const emp = await db.employee.findFirst({
        where: { id: employeeId, organizationId },
        select: { designationId: true },
      });
      designationId = emp?.designationId ?? null;
    }

    if (!designationId) {
      return { newlyEnrolledCount: 0, totalRoleCourses: 0 };
    }

    const scope = await this.resolveRoleScope(organizationId, designationId, db);
    if (!scope || scope.eligibleCourses.length === 0) {
      return { newlyEnrolledCount: 0, totalRoleCourses: 0 };
    }

    // Fetch existing enrollments for this employee
    const existingEnrollments = await db.courseEnrollment.findMany({
      where: { employeeId },
      select: { courseId: true },
    });

    const enrolledCourseIds = new Set(existingEnrollments.map((e) => e.courseId));

    const coursesToEnroll = scope.eligibleCourses
      .filter((course) => !enrolledCourseIds.has(course.id))
      .map((course) => ({
        employeeId,
        courseId: course.id,
        progressPercent: 0,
        completedLessons: 0,
        totalLessons: course.modulesCount,
        status: "IN_PROGRESS" as const,
      }));

    if (coursesToEnroll.length > 0) {
      await db.courseEnrollment.createMany({
        data: coursesToEnroll,
        skipDuplicates: true,
      });
    }

    return {
      newlyEnrolledCount: coursesToEnroll.length,
      totalRoleCourses: scope.eligibleCourses.length,
    };
  }

  /**
   * 3. Get complete role learning scope for an employee including active enrollments.
   */
  static async getEmployeeRoleLearningScope(
    organizationId: string,
    employeeId: string
  ): Promise<{
    employeeId: string;
    designation: { id: string; title: string; code: string; department: string | null } | null;
    roleScope: RoleLearningScope | null;
    roleCourses: Array<RoleCourseScope & { isEnrolled: boolean; progressPercent: number; status: string }>;
  }> {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      include: {
        designation: true,
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!employee) {
      throw new RoleLearningError("Employee not found in organization.", 404, "NOT_FOUND");
    }

    if (!employee.designationId) {
      return {
        employeeId: employee.id,
        designation: null,
        roleScope: null,
        roleCourses: [],
      };
    }

    const roleScope = await this.resolveRoleScope(organizationId, employee.designationId);
    const enrollmentMap = new Map(
      employee.enrollments.map((e) => [e.courseId, e])
    );

    const roleCourses = (roleScope?.eligibleCourses || []).map((c) => {
      const enr = enrollmentMap.get(c.id);
      return {
        ...c,
        isEnrolled: !!enr,
        progressPercent: enr?.progressPercent ?? 0,
        status: enr?.status ?? "NOT_ENROLLED",
      };
    });

    return {
      employeeId: employee.id,
      designation: employee.designation
        ? {
            id: employee.designation.id,
            title: employee.designation.title,
            code: employee.designation.code,
            department: employee.designation.department,
          }
        : null,
      roleScope,
      roleCourses,
    };
  }

  /**
   * 4. Verify whether an employee is authorized to access a course.
   * Allowed if:
   * - User is Admin/Manager (organization scoped)
   * - Course belongs to employee's organization AND is in employee's role scope OR employee is actively enrolled.
   */
  static async validateCourseAccess(
    organizationId: string,
    employeeId: string,
    courseId: string,
    userRole: string = "EMPLOYEE"
  ): Promise<boolean> {
    if (userRole === "ADMIN" || userRole === "MANAGER") {
      const exists = await prisma.course.findFirst({
        where: { id: courseId, organizationId },
      });
      return !!exists;
    }

    // Check if enrolled
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        employeeId,
        courseId,
        employee: { organizationId },
      },
    });

    if (enrollment) return true;

    // Check if in employee's role scope
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      select: { designationId: true },
    });

    if (!employee?.designationId) return false;

    const scope = await this.resolveRoleScope(organizationId, employee.designationId);
    return (scope?.eligibleCourses || []).some((c) => c.id === courseId);
  }
}
