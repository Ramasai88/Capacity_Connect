import { z } from "zod";

export const resourceTypeEnum = z.enum([
  "RECORDED_LECTURE",
  "PRESENTATION",
  "STUDY_MATERIAL",
]);

export type ResourceTypeEnum = z.infer<typeof resourceTypeEnum>;

export const createTrainerResourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required"),
  resourceType: resourceTypeEnum,
  fileUrl: z
    .string()
    .trim()
    .min(1, "File URL or content link is required"),
  fileSize: z.string().trim().optional().nullable(),
  fileFormat: z.string().trim().optional().nullable(),
  courseId: z.string().trim().optional().nullable(),
  competencyId: z.string().trim().optional().nullable(),
  isPublished: z.boolean().optional().default(true),
});

export type CreateTrainerResourceInput = z.infer<typeof createTrainerResourceSchema>;

export const updateTrainerResourceSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255).optional(),
  description: z.string().trim().min(1, "Description is required").optional(),
  resourceType: resourceTypeEnum.optional(),
  fileUrl: z.string().trim().min(1, "File URL is required").optional(),
  fileSize: z.string().trim().optional().nullable(),
  fileFormat: z.string().trim().optional().nullable(),
  courseId: z.string().trim().optional().nullable(),
  competencyId: z.string().trim().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export type UpdateTrainerResourceInput = z.infer<typeof updateTrainerResourceSchema>;

export const trainerResourceQuerySchema = z.object({
  search: z.string().trim().optional(),
  resourceType: resourceTypeEnum.optional(),
  courseId: z.string().trim().optional(),
  competencyId: z.string().trim().optional(),
  trainerId: z.string().trim().optional(),
  isPublished: z
    .preprocess((val) => {
      if (val === "true" || val === true) return true;
      if (val === "false" || val === false) return false;
      return undefined;
    }, z.boolean().optional()),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type TrainerResourceQueryInput = z.infer<typeof trainerResourceQuerySchema>;
