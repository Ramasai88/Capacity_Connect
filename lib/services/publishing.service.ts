import { prisma } from "@/lib/db/prisma";
import {
  CreatePublishedPostInput,
  UpdatePublishedPostInput,
  createPublishedPostSchema,
  updatePublishedPostSchema,
} from "@/lib/validations/publishing";
import { AuditService } from "./audit.service";
import { PostCategory, UserRole } from "@prisma/client";

export class PublishingServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "PUBLISHING_ERROR") {
    super(message);
    this.name = "PublishingServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface ActorContext {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: UserRole | string | null;
}

export class PublishingService {
  /**
   * Create an announcement, notification, achievement, or featured content post.
   * Only ADMIN users can create posts.
   */
  static async createPost(
    organizationId: string,
    adminUserId: string,
    input: CreatePublishedPostInput,
    actorContext?: ActorContext
  ) {
    if (!organizationId) {
      throw new PublishingServiceError("Organization ID is required", 400, "MISSING_ORG");
    }

    const validated = createPublishedPostSchema.parse(input);

    // Verify admin user belongs to organization
    const admin = await prisma.user.findFirst({
      where: { id: adminUserId, organizationId },
    });

    if (!admin) {
      throw new PublishingServiceError("Admin user not found in organization", 404, "ADMIN_NOT_FOUND");
    }

    if (admin.role !== "ADMIN") {
      throw new PublishingServiceError(
        "Only administrators are authorized to publish posts",
        403,
        "FORBIDDEN"
      );
    }

    if (validated.featuredCourseId) {
      const course = await prisma.course.findFirst({
        where: { id: validated.featuredCourseId, organizationId },
      });
      if (!course) {
        throw new PublishingServiceError("Featured course not found", 404, "COURSE_NOT_FOUND");
      }
    }

    const expiresAtDate = validated.expiresAt ? new Date(validated.expiresAt) : null;

    const post = await prisma.publishedPost.create({
      data: {
        organizationId,
        authorId: adminUserId,
        title: validated.title,
        summary: validated.summary,
        content: validated.content,
        category: validated.category as PostCategory,
        priority: validated.priority ?? "NORMAL",
        bannerUrl: validated.bannerUrl ?? null,
        targetRole: (validated.targetRole as UserRole) ?? null,
        pinned: validated.pinned ?? false,
        isPublished: validated.isPublished ?? true,
        featuredCourseId: validated.featuredCourseId ?? null,
        expiresAt: expiresAtDate,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        featuredCourse: { select: { id: true, title: true, code: true, category: true } },
      },
    });

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? admin.id,
      actorName: actorContext?.actorName ?? admin.name,
      actorRole: "ADMIN",
      action: "ADMIN_POST_CREATED",
      category: "USER_MANAGEMENT",
      targetId: post.id,
      targetName: post.title,
      description: `Published ${post.category.toLowerCase()} '${post.title}' (Priority: ${post.priority}, Target: ${post.targetRole || "ALL"})`,
      metadata: {
        category: post.category,
        priority: post.priority,
        targetRole: post.targetRole,
        isPublished: post.isPublished,
      },
    });

    return post;
  }

  /**
   * List posts with role-aware targeting, expiration filtering, and pinned prioritization.
   */
  static async listPosts(
    organizationId: string,
    userRole?: UserRole | string | null,
    isPublic = false,
    filters: {
      category?: PostCategory;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { category, search, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (category) {
      where.category = category;
    }

    if (search && search.trim().length > 0) {
      const s = search.trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { summary: { contains: s, mode: "insensitive" } },
        { content: { contains: s, mode: "insensitive" } },
      ];
    }

    // Public or Non-Admin viewers: filter isPublished = true, non-expired, and matching targetRole
    const isNonAdmin = isPublic || userRole !== "ADMIN";
    if (isNonAdmin) {
      where.isPublished = true;
      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      ];

      if (userRole) {
        where.AND.push({
          OR: [{ targetRole: null }, { targetRole: userRole }],
        });
      } else {
        // Public (unauthenticated): only general posts with targetRole = null
        where.AND.push({ targetRole: null });
      }
    }

    const [total, posts] = await Promise.all([
      prisma.publishedPost.count({ where }),
      prisma.publishedPost.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
          featuredCourse: { select: { id: true, title: true, code: true, category: true } },
        },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get single published post by ID.
   */
  static async getPostById(
    organizationId: string,
    postId: string,
    userRole?: UserRole | string | null
  ) {
    const post = await prisma.publishedPost.findFirst({
      where: { id: postId, organizationId },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        featuredCourse: { select: { id: true, title: true, code: true, category: true } },
      },
    });

    if (!post) {
      throw new PublishingServiceError("Post not found", 404, "NOT_FOUND");
    }

    const isNonAdmin = userRole !== "ADMIN";
    if (isNonAdmin) {
      if (!post.isPublished) {
        throw new PublishingServiceError("Post is not published", 403, "FORBIDDEN");
      }
      if (post.expiresAt && new Date() > new Date(post.expiresAt)) {
        throw new PublishingServiceError("Post has expired", 403, "EXPIRED");
      }
      if (post.targetRole && userRole && post.targetRole !== userRole) {
        throw new PublishingServiceError("Post is not accessible to your role", 403, "FORBIDDEN");
      }
    }

    return post;
  }

  /**
   * Update an existing post (Admin only).
   */
  static async updatePost(
    organizationId: string,
    postId: string,
    adminUserId: string,
    input: UpdatePublishedPostInput,
    actorContext?: ActorContext
  ) {
    const validated = updatePublishedPostSchema.parse(input);

    const existing = await prisma.publishedPost.findFirst({
      where: { id: postId, organizationId },
    });

    if (!existing) {
      throw new PublishingServiceError("Post not found", 404, "NOT_FOUND");
    }

    const admin = await prisma.user.findFirst({
      where: { id: adminUserId, organizationId },
    });

    if (!admin || admin.role !== "ADMIN") {
      throw new PublishingServiceError(
        "Only administrators can edit published posts",
        403,
        "FORBIDDEN"
      );
    }

    if (validated.featuredCourseId) {
      const course = await prisma.course.findFirst({
        where: { id: validated.featuredCourseId, organizationId },
      });
      if (!course) {
        throw new PublishingServiceError("Featured course not found", 404, "COURSE_NOT_FOUND");
      }
    }

    const expiresAtDate =
      validated.expiresAt !== undefined
        ? validated.expiresAt
          ? new Date(validated.expiresAt)
          : null
        : undefined;

    const updated = await prisma.publishedPost.update({
      where: { id: postId },
      data: {
        ...(validated.title !== undefined ? { title: validated.title } : {}),
        ...(validated.summary !== undefined ? { summary: validated.summary } : {}),
        ...(validated.content !== undefined ? { content: validated.content } : {}),
        ...(validated.category !== undefined ? { category: validated.category as PostCategory } : {}),
        ...(validated.priority !== undefined ? { priority: validated.priority } : {}),
        ...(validated.bannerUrl !== undefined ? { bannerUrl: validated.bannerUrl } : {}),
        ...(validated.targetRole !== undefined ? { targetRole: validated.targetRole as UserRole } : {}),
        ...(validated.pinned !== undefined ? { pinned: validated.pinned } : {}),
        ...(validated.isPublished !== undefined ? { isPublished: validated.isPublished } : {}),
        ...(validated.featuredCourseId !== undefined ? { featuredCourseId: validated.featuredCourseId } : {}),
        ...(expiresAtDate !== undefined ? { expiresAt: expiresAtDate } : {}),
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
        featuredCourse: { select: { id: true, title: true, code: true, category: true } },
      },
    });

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? admin.id,
      actorName: actorContext?.actorName ?? admin.name,
      actorRole: "ADMIN",
      action: "ADMIN_POST_UPDATED",
      category: "USER_MANAGEMENT",
      targetId: updated.id,
      targetName: updated.title,
      description: `Updated published post '${updated.title}'`,
    });

    return updated;
  }

  /**
   * Delete a published post (Admin only).
   */
  static async deletePost(
    organizationId: string,
    postId: string,
    adminUserId: string,
    actorContext?: ActorContext
  ) {
    const existing = await prisma.publishedPost.findFirst({
      where: { id: postId, organizationId },
    });

    if (!existing) {
      throw new PublishingServiceError("Post not found", 404, "NOT_FOUND");
    }

    const admin = await prisma.user.findFirst({
      where: { id: adminUserId, organizationId },
    });

    if (!admin || admin.role !== "ADMIN") {
      throw new PublishingServiceError(
        "Only administrators can delete published posts",
        403,
        "FORBIDDEN"
      );
    }

    await prisma.publishedPost.delete({
      where: { id: postId },
    });

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? admin.id,
      actorName: actorContext?.actorName ?? admin.name,
      actorRole: "ADMIN",
      action: "ADMIN_POST_DELETED",
      category: "USER_MANAGEMENT",
      targetId: existing.id,
      targetName: existing.title,
      description: `Deleted published post '${existing.title}'`,
    });

    return { success: true, deletedId: postId };
  }

  /**
   * Get dynamic homepage/dashboard highlights:
   * Pinned announcements, active achievements, latest notifications, and featured courses.
   */
  static async getHomepageHighlights(organizationId: string) {
    const now = new Date();

    const activeWhere = {
      organizationId,
      isPublished: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };

    const [pinnedAnnouncements, achievements, featuredContent, recentNotifications] =
      await Promise.all([
        prisma.publishedPost.findMany({
          where: {
            ...activeWhere,
            category: "ANNOUNCEMENT",
            pinned: true,
          },
          take: 3,
          orderBy: { createdAt: "desc" },
          include: { featuredCourse: true },
        }),
        prisma.publishedPost.findMany({
          where: {
            ...activeWhere,
            category: "ACHIEVEMENT",
          },
          take: 4,
          orderBy: { createdAt: "desc" },
        }),
        prisma.publishedPost.findMany({
          where: {
            ...activeWhere,
            category: "FEATURED_CONTENT",
          },
          take: 4,
          orderBy: { createdAt: "desc" },
          include: { featuredCourse: true },
        }),
        prisma.publishedPost.findMany({
          where: {
            ...activeWhere,
            category: "NOTIFICATION",
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    return {
      pinnedAnnouncements,
      achievements,
      featuredContent,
      recentNotifications,
    };
  }
}
