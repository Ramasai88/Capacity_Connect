import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  PublishingService,
  PublishingServiceError,
} from "@/lib/services/publishing.service";

const TEST_ORG_1 = "org-kl-university";
const TEST_ORG_2 = "org-state-power-corp";

let adminUserId: string;
let nonAdminUserId: string;
let course1Id: string;

beforeAll(async () => {
  const adminUser = await prisma.user.findFirst({
    where: { organizationId: TEST_ORG_1, role: "ADMIN" },
  });
  if (adminUser) {
    adminUserId = adminUser.id;
  }

  const trainerUser = await prisma.user.findFirst({
    where: { organizationId: TEST_ORG_1, role: "TRAINER" },
  });
  if (trainerUser) {
    nonAdminUserId = trainerUser.id;
  }

  const course = await prisma.course.findFirst({
    where: { organizationId: TEST_ORG_1 },
  });
  if (course) {
    course1Id = course.id;
  }
});

describe("Phase 2: PublishingService Business Logic & Role Targeting", () => {
  let createdPostId: string;
  let expiredPostId: string;

  it("1. Allows ADMIN to publish announcements, notifications, achievements, and featured content", async () => {
    const post = await PublishingService.createPost(
      TEST_ORG_1,
      adminUserId,
      {
        title: "Annual Workforce Competency Showcase 2026",
        summary: "Join us for the enterprise-wide skill assessment awards.",
        content: "Detailed markdown content about the upcoming capacity building celebration.",
        category: "ANNOUNCEMENT",
        priority: "HIGH",
        pinned: true,
        isPublished: true,
        targetRole: null, // Broadcast to all
        featuredCourseId: course1Id || undefined,
      },
      { actorId: adminUserId, actorName: "Admin User", actorRole: "ADMIN" }
    );

    expect(post).toBeDefined();
    expect(post.id).toBeDefined();
    expect(post.title).toBe("Annual Workforce Competency Showcase 2026");
    expect(post.category).toBe("ANNOUNCEMENT");
    expect(post.priority).toBe("HIGH");
    expect(post.pinned).toBe(true);
    expect(post.isPublished).toBe(true);

    createdPostId = post.id;
  });

  it("2. Blocks non-admin users from creating or modifying published posts", async () => {
    if (nonAdminUserId) {
      await expect(
        PublishingService.createPost(TEST_ORG_1, nonAdminUserId, {
          title: "Unauthorized Trainer Announcement",
          summary: "Should fail",
          content: "Content",
          category: "ANNOUNCEMENT",
        })
      ).rejects.toThrow(PublishingServiceError);

      await expect(
        PublishingService.updatePost(TEST_ORG_1, createdPostId, nonAdminUserId, {
          title: "Unauthorized Update",
        })
      ).rejects.toThrow(PublishingServiceError);
    }
  });

  it("3. Target role filtering: Trainees see broadcast and trainee-targeted posts only", async () => {
    // Create trainer-only post
    const trainerOnly = await PublishingService.createPost(TEST_ORG_1, adminUserId, {
      title: "Trainer Faculty Curriculum Briefing",
      summary: "Restricted to instructors",
      content: "Pedagogical guidelines",
      category: "NOTIFICATION",
      targetRole: "TRAINER",
    });

    // Create trainee-only post
    const traineeOnly = await PublishingService.createPost(TEST_ORG_1, adminUserId, {
      title: "Trainee Diagnostic Exam Reminders",
      summary: "Mandatory module completion info",
      content: "Complete all quizzes by Friday",
      category: "NOTIFICATION",
      targetRole: "TRAINEE",
    });

    // Trainee views posts
    const traineeList = await PublishingService.listPosts(
      TEST_ORG_1,
      "TRAINEE",
      false
    );

    const seesTrainerOnly = traineeList.posts.some((p) => p.id === trainerOnly.id);
    const seesTraineeOnly = traineeList.posts.some((p) => p.id === traineeOnly.id);
    const seesBroadcast = traineeList.posts.some((p) => p.id === createdPostId);

    expect(seesTrainerOnly).toBe(false);
    expect(seesTraineeOnly).toBe(true);
    expect(seesBroadcast).toBe(true);
  });

  it("4. Expiration filtering: Expired posts are automatically excluded from public/trainee feeds", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const expired = await PublishingService.createPost(TEST_ORG_1, adminUserId, {
      title: "Yesterday's Flash Maintenance Notice",
      summary: "Expired maintenance announcement",
      content: "Completed",
      category: "NOTIFICATION",
      expiresAt: pastDate.toISOString(),
      isPublished: true,
    });
    expiredPostId = expired.id;

    // Trainee/Public listing should exclude expired post
    const publicList = await PublishingService.listPosts(TEST_ORG_1, "TRAINEE", true);
    const containsExpired = publicList.posts.some((p) => p.id === expiredPostId);
    expect(containsExpired).toBe(false);

    // Admin listing should still include it
    const adminList = await PublishingService.listPosts(TEST_ORG_1, "ADMIN", false);
    const adminSeesExpired = adminList.posts.some((p) => p.id === expiredPostId);
    expect(adminSeesExpired).toBe(true);
  });

  it("5. Retrieves dynamic homepage highlights (announcements, achievements, featured content)", async () => {
    // Add achievement
    await PublishingService.createPost(TEST_ORG_1, adminUserId, {
      title: "100+ Trainees Certified in Python & AI",
      summary: "Milestone achieved by Department of Computer Science",
      content: "Celebration post",
      category: "ACHIEVEMENT",
      isPublished: true,
    });

    const highlights = await PublishingService.getHomepageHighlights(TEST_ORG_1);
    expect(highlights).toBeDefined();
    expect(highlights.pinnedAnnouncements.length).toBeGreaterThanOrEqual(1);
    expect(highlights.achievements.length).toBeGreaterThanOrEqual(1);
  });

  it("6. Multi-tenant isolation: Cross-organization post queries are strictly blocked", async () => {
    await expect(
      PublishingService.getPostById(TEST_ORG_2, createdPostId, "ADMIN")
    ).rejects.toThrow(PublishingServiceError);
  });

  it("7. ADMIN can update and delete published posts", async () => {
    const updated = await PublishingService.updatePost(
      TEST_ORG_1,
      createdPostId,
      adminUserId,
      {
        priority: "URGENT",
      }
    );
    expect(updated.priority).toBe("URGENT");

    const deleteResult = await PublishingService.deletePost(
      TEST_ORG_1,
      expiredPostId,
      adminUserId
    );
    expect(deleteResult.success).toBe(true);
  });
});
