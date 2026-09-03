import { z } from "zod";

export const designationRequirementInputSchema = z.object({
  competencyId: z.string().trim().min(1, "Competency ID is required"),
  requiredLevel: z
    .number()
    .int("Required level must be an integer")
    .min(1, "Required level must be at least 1")
    .max(5, "Required level cannot exceed 5"),
});

export type DesignationRequirementInput = z.infer<typeof designationRequirementInputSchema>;

export const createDesignationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Designation title is required")
    .min(2, "Designation title must be at least 2 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Designation code is required")
    .regex(/^[A-Za-z0-9-_]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
  department: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  competencyRequirements: z
    .array(designationRequirementInputSchema)
    .optional()
    .default([])
    .refine(
      (reqs) => {
        if (!reqs || reqs.length === 0) return true;
        const idSet = new Set(reqs.map((r) => r.competencyId));
        return idSet.size === reqs.length;
      },
      {
        message: "Duplicate competency requirements are not allowed. Each competency can only appear once.",
      }
    ),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;

export const updateDesignationSchema = z.object({
  title: z.string().trim().min(2, "Designation title must be at least 2 characters").optional(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-_]+$/, "Code can only contain letters, numbers, hyphens, and underscores")
    .optional(),
  department: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  competencyRequirements: z
    .array(designationRequirementInputSchema)
    .optional()
    .refine(
      (reqs) => {
        if (!reqs || reqs.length === 0) return true;
        const idSet = new Set(reqs.map((r) => r.competencyId));
        return idSet.size === reqs.length;
      },
      {
        message: "Duplicate competency requirements are not allowed. Each competency can only appear once.",
      }
    ),
});

export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;

export const designationQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type DesignationQueryInput = z.infer<typeof designationQuerySchema>;
