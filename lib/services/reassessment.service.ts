import { prisma } from "@/lib/db/prisma";
import {
  ReviewReassessmentInput,
  ReassessmentQueryInput,
} from "@/lib/validations/reassessment";
import { ReassessmentStatus } from "@prisma/client";

export class ReassessmentServiceError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 400,
    code = "REASSESSMENT_ERROR",
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "ReassessmentServiceError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export interface ReassessmentListItem {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string | null;
  courseId: string;
  courseTitle: string;
  competencyId: string;
  competencyName: string;
  previousLevel: number;
  requestedLevel: number;
  status: ReassessmentStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewerComments: string | null;
}

export class ReassessmentService {
  /**
   * 1. List reassessments with filtering and tenant isolation.
   */
  static async getReassessments(
    organizationId: string,
    query: Partial<ReassessmentQueryInput> = {}
  ): Promise<{
    reassessments: ReassessmentListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, employeeId, courseId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (courseId) where.courseId = courseId;

    const [total, records] = await Promise.all([
      prisma.reassessment.count({ where }),
      prisma.reassessment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeCode: true,
              department: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          competency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const reassessments: ReassessmentListItem[] = records.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      employeeCode: r.employee.employeeCode,
      department: r.employee.department,
      courseId: r.courseId,
      courseTitle: r.course.title,
      competencyId: r.competencyId,
      competencyName: r.competency.name,
      previousLevel: r.previousLevel,
      requestedLevel: r.requestedLevel,
      status: r.status,
      submittedAt: r.submittedAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      reviewedBy: r.reviewedBy,
      reviewerComments: r.reviewerComments,
    }));

    return {
      reassessments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * 2. Get single reassessment by ID.
   */
  static async getReassessmentById(
    organizationId: string,
    reassessmentId: string
  ): Promise<ReassessmentListItem | null> {
    const r = await prisma.reassessment.findFirst({
      where: {
        id: reassessmentId,
        organizationId,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            department: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        competency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      organizationId: r.organizationId,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      employeeCode: r.employee.employeeCode,
      department: r.employee.department,
      courseId: r.courseId,
      courseTitle: r.course.title,
      competencyId: r.competencyId,
      competencyName: r.competency.name,
      previousLevel: r.previousLevel,
      requestedLevel: r.requestedLevel,
      status: r.status,
      submittedAt: r.submittedAt.toISOString(),
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      reviewedBy: r.reviewedBy,
      reviewerComments: r.reviewerComments,
    };
  }

  /**
   * 3. Review reassessment (Approve or Reject).
   * Approving atomically updates the employee's competency level and logs an assessment history record.
   */
  static async reviewReassessment(
    organizationId: string,
    reassessmentId: string,
    reviewerName: string,
    data: ReviewReassessmentInput
  ): Promise<ReassessmentListItem> {
    const reassessment = await prisma.reassessment.findFirst({
      where: {
        id: reassessmentId,
        organizationId,
      },
    });

    if (!reassessment) {
      throw new ReassessmentServiceError("Reassessment not found.", 404, "NOT_FOUND");
    }

    const newStatus = data.status as ReassessmentStatus;

    await prisma.$transaction(async (tx) => {
      // If approved, elevate employee competency level and create history log
      if (newStatus === ReassessmentStatus.APPROVED) {
        await tx.employeeCompetency.upsert({
          where: {
            employeeId_competencyId: {
              employeeId: reassessment.employeeId,
              competencyId: reassessment.competencyId,
            },
          },
          update: {
            currentLevel: reassessment.requestedLevel,
            assessedAt: new Date(),
            assessedBy: reviewerName,
            organizationId,
          },
          create: {
            organizationId,
            employeeId: reassessment.employeeId,
            competencyId: reassessment.competencyId,
            currentLevel: reassessment.requestedLevel,
            assessedAt: new Date(),
            assessedBy: reviewerName,
          },
        });

        await tx.competencyAssessmentHistory.create({
          data: {
            employeeId: reassessment.employeeId,
            competencyId: reassessment.competencyId,
            previousLevel: reassessment.previousLevel,
            newLevel: reassessment.requestedLevel,
            assessedAt: new Date(),
            assessedBy: reviewerName,
            reason: `Reassessment approved following curriculum completion. Comments: ${data.reviewerComments || "Verified competency mastery."}`,
          },
        });
      }

      await tx.reassessment.update({
        where: { id: reassessmentId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedBy: reviewerName,
          reviewerComments: data.reviewerComments?.trim() || null,
        },
      });
    });

    const fullRecord = await this.getReassessmentById(organizationId, reassessmentId);
    if (!fullRecord) {
      throw new ReassessmentServiceError("Failed to retrieve updated reassessment.", 500);
    }

    return fullRecord;
  }
}
