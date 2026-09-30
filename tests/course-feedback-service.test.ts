import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  FeedbackService,
  FeedbackServiceError,
} from "@/lib/services/feedback.service";

const TEST_ORG_1 = "org-kl-university";
const TEST_ORG_2 = "org-state-power-corp";

let trainee1Id: string;
let trainee2Id: string;
let course1Id: string;

beforeAll(async () => {
  const trainee1 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `FDB-EE1-${Date.now()}`,
      name: "Feedback Trainee 1",
      email: `fdb.trainee1.${Date.now()}@klu.edu`,
    },
  });
  trainee1Id = trainee1.id;

  const trainee2 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `FDB-EE2-${Date.now()}`,
      name: "Feedback Trainee 2",
      email: `fdb.trainee2.${Date.now()}@klu.edu`,
    },
  });
  trainee2Id = trainee2.id;

  const comp = await prisma.competency.findFirst({
    where: { organizationId: TEST_ORG_1 },
  });
  const createdCourse = await prisma.course.create({
    data: {
      organizationId: TEST_ORG_1,
      title: `Advanced Data Engineering ${Date.now()}`,
      code: `CRS-FDB-${Date.now()}`,
      description: "Course for feedback testing",
      category: "Data & AI",
      competencyId: comp!.id,
      targetLevel: 3,
      durationHours: 10,
    },
  });
  course1Id = createdCourse.id;
});

describe("Phase 2: FeedbackService Business Logic & Privacy", () => {
  it("1. TRAINEE submits course feedback with ratings and optional dimensions", async () => {
    const feedback = await FeedbackService.submitFeedback(
      TEST_ORG_1,
      trainee1Id,
      {
        courseId: course1Id,
        rating: 5,
        contentQuality: 5,
        trainerClarity: 4,
        applicability: 5,
        feedbackText: "Exceptional curriculum structure and practical hands-on exercises.",
        isAnonymous: false,
      },
      { actorId: "trainee-user-1", actorName: "Feedback Trainee 1", actorRole: "TRAINEE" }
    );

    expect(feedback).toBeDefined();
    expect(feedback.id).toBeDefined();
    expect(feedback.rating).toBe(5);
    expect(feedback.isAnonymous).toBe(false);
  });

  it("2. Rejects duplicate feedback for the same course from the same trainee", async () => {
    await expect(
      FeedbackService.submitFeedback(TEST_ORG_1, trainee1Id, {
        courseId: course1Id,
        rating: 4,
        feedbackText: "Duplicate attempt",
      })
    ).rejects.toThrow(FeedbackServiceError);
  });

  it("3. Validates rating boundaries (1 to 5 only)", async () => {
    // Rating 0 is invalid
    await expect(
      FeedbackService.submitFeedback(TEST_ORG_1, trainee2Id, {
        courseId: course1Id,
        rating: 0 as any,
      })
    ).rejects.toThrow();

    // Rating 6 is invalid
    await expect(
      FeedbackService.submitFeedback(TEST_ORG_1, trainee2Id, {
        courseId: course1Id,
        rating: 6 as any,
      })
    ).rejects.toThrow();
  });

  it("4. Supports anonymous feedback submission and masks trainee identity in reviews", async () => {
    const anonFeedback = await FeedbackService.submitFeedback(
      TEST_ORG_1,
      trainee2Id,
      {
        courseId: course1Id,
        rating: 4,
        contentQuality: 4,
        trainerClarity: 4,
        applicability: 4,
        feedbackText: "Very insightful, but could use more time on advanced topics.",
        isAnonymous: true,
      }
    );

    expect(anonFeedback.isAnonymous).toBe(true);

    // Fetch course feedback summary as Admin / Trainer
    const courseFeedback = await FeedbackService.getCourseFeedback(
      TEST_ORG_1,
      course1Id,
      "ADMIN"
    );

    expect(courseFeedback.summary.totalReviews).toBe(2);
    expect(courseFeedback.summary.averageRating).toBe(4.5);

    // Verify anonymous masking in reviews
    const anonReview = courseFeedback.reviews.find((r) => r.isAnonymous);
    expect(anonReview).toBeDefined();
    expect(anonReview?.trainee.name).toBe("Anonymous Trainee");
    expect(anonReview?.trainee.email).toBeNull();
    expect(anonReview?.trainee.employeeCode).toBeNull();

    // Verify non-anonymous review preserves trainee details
    const nonAnonReview = courseFeedback.reviews.find((r) => !r.isAnonymous);
    expect(nonAnonReview).toBeDefined();
    expect(nonAnonReview?.trainee.name).toBe("Feedback Trainee 1");
  });

  it("5. Blocks TRAINEE from viewing aggregated course feedback summaries", async () => {
    await expect(
      FeedbackService.getCourseFeedback(TEST_ORG_1, course1Id, "TRAINEE")
    ).rejects.toThrow(FeedbackServiceError);
  });

  it("6. ADMIN can retrieve organization-wide feedback analytics", async () => {
    const orgSummary = await FeedbackService.getOrganizationFeedbackSummary(
      TEST_ORG_1,
      "ADMIN"
    );

    expect(orgSummary.totalFeedbackCount).toBeGreaterThanOrEqual(2);
    expect(orgSummary.overallAverageRating).toBeGreaterThanOrEqual(1);
    expect(orgSummary.courseFeedbackBreakdown.length).toBeGreaterThan(0);

    // Non-admin blocked
    await expect(
      FeedbackService.getOrganizationFeedbackSummary(TEST_ORG_1, "TRAINER")
    ).rejects.toThrow(FeedbackServiceError);
  });

  it("7. Multi-tenant isolation: Cross-organization feedback requests are strictly blocked", async () => {
    await expect(
      FeedbackService.getCourseFeedback(TEST_ORG_2, course1Id, "ADMIN")
    ).rejects.toThrow(FeedbackServiceError);
  });
});
