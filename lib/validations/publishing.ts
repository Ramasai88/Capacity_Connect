import { z } from "zod";

export const postCategoryEnum = z.enum([
  "ANNOUNCEMENT",
  "NOTIFICATION",
  "ACHIEVEMENT",
  "FEATURED_CONTENT",
]);

export type PostCategoryEnum = z.infer<typeof postCategoryEnum>;

export const postPriorityEnum = z.enum(["NORMAL", "HIGH", "URGENT"]);
export type PostPriorityEnum = z.infer<typeof postPriorityEnum>;

export const targetRoleEnum = z.enum(["ADMIN", "TRAINER", "TRAINEE"]);
export type TargetRoleEnum = z.infer<typeof targetRoleEnum>;

export const createPublishedPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters"),
  summary: z
    .string()
    .trim()
    .min(1, "Summary is required")
    .max(500, "Summary cannot exceed 500 characters"),
  content: z
    .string()
    .trim()
    .min(1, "Content is required"),
  category: postCategoryEnum,
  priority: postPriorityEnum.optional().default("NORMAL"),
  bannerUrl: z.string().trim().optional().nullable(),
  targetRole: targetRoleEnum.optional().nullable(),
  pinned: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
  featuredCourseId: z.string().trim().optional().nullable(),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid expiration date format",
    }),
});

export type CreatePublishedPostInput = z.infer<typeof createPublishedPostSchema>;

export const updatePublishedPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255).optional(),
  summary: z.string().trim().min(1, "Summary is required").max(500).optional(),
  content: z.string().trim().min(1, "Content is required").optional(),
  category: postCategoryEnum.optional(),
  priority: postPriorityEnum.optional(),
  bannerUrl: z.string().trim().optional().nullable(),
  targetRole: targetRoleEnum.optional().nullable(),
  pinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  featuredCourseId: z.string().trim().optional().nullable(),
  expiresAt: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid expiration date format",
    }),
});

export type UpdatePublishedPostInput = z.infer<typeof updatePublishedPostSchema>;
