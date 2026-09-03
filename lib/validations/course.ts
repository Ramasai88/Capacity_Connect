import { z } from "zod";

export const courseModuleInputSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(1, "Module order must be positive"),
  title: z.string().trim().min(1, "Module title is required"),
  summary: z.string().trim().min(1, "Summary is required"),
  durationMinutes: z.number().int().min(1, "Duration must be positive"),
  learningObjectives: z.array(z.string().trim()).optional().default([]),
  overview: z.string().trim().min(1, "Overview is required"),
  keyConcepts: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
        codeSnippet: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  practicalExercise: z.string().trim().min(1, "Practical exercise is required"),
  competencyVerification: z.string().trim().min(1, "Competency verification is required"),
});

export type CourseModuleInput = z.infer<typeof courseModuleInputSchema>;

export const createCourseSchema = z.object({
  title: z.string().trim().min(2, "Course title must be at least 2 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Course code is required")
    .regex(/^[A-Za-z0-9-_]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
  description: z.string().trim().min(1, "Description is required"),
  category: z.string().trim().min(1, "Category is required"),
  competencyId: z.string().trim().min(1, "Competency ID is required"),
  targetLevel: z
    .number()
    .int()
    .min(1, "Target level must be between 1 and 5")
    .max(5, "Target level must be between 1 and 5"),
  durationHours: z.number().int().min(1, "Duration hours must be positive"),
  rating: z.number().min(0).max(5).optional().default(4.8),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional().default("PUBLISHED"),
  modules: z.array(courseModuleInputSchema).optional().default([]),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  title: z.string().trim().min(2).optional(),
  code: z.string().trim().regex(/^[A-Za-z0-9-_]+$/).optional(),
  description: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  competencyId: z.string().trim().min(1).optional(),
  targetLevel: z.number().int().min(1).max(5).optional(),
  durationHours: z.number().int().min(1).optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
  modules: z.array(courseModuleInputSchema).optional(),
});

export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const courseQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  competencyId: z.string().trim().optional(),
  targetLevel: z.coerce.number().int().min(1).max(5).optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
