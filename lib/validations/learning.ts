import { z } from "zod";

export const enrollCourseSchema = z.object({
  employeeId: z.string().trim().optional(),
  courseId: z.string().trim().optional(),
});

export type EnrollCourseInput = z.infer<typeof enrollCourseSchema>;

export const completeModuleSchema = z.object({
  employeeId: z.string().trim().optional(),
  courseId: z.string().trim().optional(),
  moduleId: z.string().trim().min(1, "Module ID is required"),
});

export type CompleteModuleInput = z.infer<typeof completeModuleSchema>;

export const enrollmentQuerySchema = z.object({
  employeeId: z.string().trim().optional(),
  courseId: z.string().trim().optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "DROPPED"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type EnrollmentQueryInput = z.infer<typeof enrollmentQuerySchema>;
