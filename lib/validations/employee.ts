import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full Name is required")
    .min(2, "Full Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  employeeCode: z
    .string()
    .trim()
    .min(1, "Employee Code is required")
    .regex(/^[A-Za-z0-9-_]+$/, "Employee Code can only contain letters, numbers, hyphens, and underscores"),
  department: z.string().trim().optional(),
  designationId: z.string().trim().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  competencies: z
    .array(
      z.object({
        competencyId: z.string().min(1, "Competency ID is required"),
        currentLevel: z
          .number()
          .int()
          .min(1, "Level must be at least 1")
          .max(5, "Level cannot exceed 5"),
      })
    )
    .optional()
    .default([]),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Full Name must be at least 2 characters").optional(),
  email: z.string().trim().email("Enter a valid email address").optional(),
  department: z.string().trim().optional().nullable(),
  designationId: z.string().trim().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  competencies: z
    .array(
      z.object({
        competencyId: z.string().min(1, "Competency ID is required"),
        currentLevel: z
          .number()
          .int()
          .min(1, "Level must be at least 1")
          .max(5, "Level cannot exceed 5"),
      })
    )
    .optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const employeeQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  designationId: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;