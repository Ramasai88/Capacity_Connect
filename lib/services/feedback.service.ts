import { prisma } from "@/lib/db/prisma";
import {
  SubmitFeedbackInput,
  submitFeedbackSchema,
} from "@/lib/validations/feedback";
import { AuditService } from "./audit.service";
import { UserRole } from "@prisma/client";

export class FeedbackServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "FEEDBACK_ERROR") {
    super(message);
    this.name = "FeedbackServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface ActorContext {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: UserRole | string | null;
}

export class FeedbackService {
  /**
   * Submit course feedback by an authorized trainee.
   */
  static async submitFeedback(
    organizationId: string,
    traineeEmployeeId: string,
    input: SubmitFeedbackInput,
    actorContext?: ActorContext
  ) {
    if (!organizationId) {
      throw new FeedbackServiceError("Organization ID is required", 400, "MISSING_ORG");
    }

    const validated = submitFeedbackSchema.parse(input);

    // Verify course exists in organization
    const course = await prisma.course.findFirst({
      where: { id: validated.courseId, organizationId },
    });

    if (!course) {
      throw new FeedbackServiceError("Course not found in organization", 404, "COURSE_NOT_FOUND");
    }

    // Verify trainee exists in organization
    const trainee = await prisma.employee.findFirst({
      where: { id: traineeEmployeeId, organizationId },
    });

    if (!trainee) {
      throw new FeedbackServiceError("Trainee not found in organization", 404, "TRAINEE_NOT_FOUND");
    }

    // Check duplicate feedback
    const existing = await prisma.courseFeedback.findUnique({
      where: {
        courseId_traineeId: {
          courseId: validated.courseId,
          traineeId: traineeEmployeeId,
        },
      },
    });

    if (existing) {
      throw new FeedbackServiceError(
        "You have already submitted feedback for this course",
        400,
        "DUPLICATE_FEEDBACK"
      );
    }

    const feedback = await prisma.courseFeedback.create({
      data: {
        organizationId,
        traineeId: traineeEmployeeId,
        courseId: validated.courseId,
        rating: validated.rating,
        contentQuality: validated.contentQuality ?? null,
        trainerClarity: validated.trainerClarity ?? null,
        applicability: validated.applicability ?? null,
        feedbackText: validated.feedbackText ?? null,
        isAnonymous: validated.isAnonymous ?? false,
      },
    });

    // Update aggregated course rating dynamically
    const allCourseFeedbacks = await prisma.courseFeedback.findMany({
      where: { courseId: validated.courseId },
      select: { rating: true },
    });

    if (allCourseFeedbacks.length > 0) {
      const avgRating =
        allCourseFeedbacks.reduce((acc, curr) => acc + curr.rating, 0) /
        allCourseFeedbacks.length;
      await prisma.course.update({
        where: { id: validated.courseId },
        data: { rating: Math.round(avgRating * 10) / 10 },
      });
    }

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: validated.isAnonymous ? "Anonymous Trainee" : trainee.name,
      actorRole: "TRAINEE",
      action: "COURSE_FEEDBACK_SUBMITTED",
      category: "LEARNING",
      targetId: course.id,
      targetName: course.title,
      description: `Submitted ${validated.rating}-star feedback for course '${course.title}'${validated.isAnonymous ? " (Anonymous)" : ""}`,
      metadata: {
        rating: validated.rating,
        isAnonymous: validated.isAnonymous,
        courseId: course.id,
      },
    });

    return feedback;
  }

  /**
   * Get feedback for a specific course with aggregation and anonymous privacy protection.
   */
  static async getCourseFeedback(
    organizationId: string,
    courseId: string,
    userRole?: UserRole | string | null
  ) {
    if (userRole === "TRAINEE") {
      throw new FeedbackServiceError(
        "Trainees cannot view aggregated course feedback summaries",
        403,
        "FORBIDDEN"
      );
    }

    const course = await prisma.course.findFirst({
      where: { id: courseId, organizationId },
    });

    if (!course) {
      throw new FeedbackServiceError("Course not found in organization", 404, "COURSE_NOT_FOUND");
    }

    const feedbacks = await prisma.courseFeedback.findMany({
      where: { courseId, organizationId },
      include: {
        trainee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReviews = feedbacks.length;
    let sumRating = 0;
    let sumContent = 0;
    let countContent = 0;
    let sumClarity = 0;
    let countClarity = 0;
    let sumApp = 0;
    let countApp = 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const f of feedbacks) {
      sumRating += f.rating;
      ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;

      if (f.contentQuality) {
        sumContent += f.contentQuality;
        countContent++;
      }
      if (f.trainerClarity) {
        sumClarity += f.trainerClarity;
        countClarity++;
      }
      if (f.applicability) {
        sumApp += f.applicability;
        countApp++;
      }
    }

    const averageRating =
      totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;
    const averageContentQuality =
      countContent > 0 ? Math.round((sumContent / countContent) * 10) / 10 : null;
    const averageTrainerClarity =
      countClarity > 0 ? Math.round((sumClarity / countClarity) * 10) / 10 : null;
    const averageApplicability =
      countApp > 0 ? Math.round((sumApp / countApp) * 10) / 10 : null;

    // Mask trainee identities when anonymous is set
    const sanitizedReviews = feedbacks.map((f) => {
      if (f.isAnonymous) {
        return {
          id: f.id,
          rating: f.rating,
          contentQuality: f.contentQuality,
          trainerClarity: f.trainerClarity,
          applicability: f.applicability,
          feedbackText: f.feedbackText,
          isAnonymous: true,
          trainee: {
            id: "ANONYMOUS",
            name: "Anonymous Trainee",
            email: null,
            employeeCode: null,
            department: null,
          },
          createdAt: f.createdAt.toISOString(),
        };
      }

      return {
        id: f.id,
        rating: f.rating,
        contentQuality: f.contentQuality,
        trainerClarity: f.trainerClarity,
        applicability: f.applicability,
        feedbackText: f.feedbackText,
        isAnonymous: false,
        trainee: f.trainee,
        createdAt: f.createdAt.toISOString(),
      };
    });

    return {
      courseId: course.id,
      courseTitle: course.title,
      courseCode: course.code,
      summary: {
        totalReviews,
        averageRating,
        averageContentQuality,
        averageTrainerClarity,
        averageApplicability,
        ratingDistribution,
      },
      reviews: sanitizedReviews,
    };
  }

  /**
   * Organization-wide feedback summary for Admins.
   */
  static async getOrganizationFeedbackSummary(
    organizationId: string,
    userRole: UserRole | string
  ) {
    if (userRole !== "ADMIN") {
      throw new FeedbackServiceError(
        "Only administrators can view organization-wide feedback analytics",
        403,
        "FORBIDDEN"
      );
    }

    const feedbacks = await prisma.courseFeedback.findMany({
      where: { organizationId },
      include: {
        course: { select: { id: true, title: true, code: true, category: true } },
      },
    });

    const totalFeedbackCount = feedbacks.length;
    const totalRatingSum = feedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const overallAverageRating =
      totalFeedbackCount > 0 ? Math.round((totalRatingSum / totalFeedbackCount) * 10) / 10 : 0;

    // Group by course
    const courseMap = new Map<
      string,
      { course: any; ratings: number[]; reviewsCount: number }
    >();

    for (const f of feedbacks) {
      if (!courseMap.has(f.courseId)) {
        courseMap.set(f.courseId, {
          course: f.course,
          ratings: [],
          reviewsCount: 0,
        });
      }
      const entry = courseMap.get(f.courseId)!;
      entry.ratings.push(f.rating);
      entry.reviewsCount++;
    }

    const topRatedCourses = Array.from(courseMap.values())
      .map((item) => ({
        courseId: item.course.id,
        courseTitle: item.course.title,
        courseCode: item.course.code,
        category: item.course.category,
        reviewsCount: item.reviewsCount,
        averageRating:
          Math.round(
            (item.ratings.reduce((a, b) => a + b, 0) / item.reviewsCount) * 10
          ) / 10,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    return {
      totalFeedbackCount,
      overallAverageRating,
      courseFeedbackBreakdown: topRatedCourses,
    };
  }
}
