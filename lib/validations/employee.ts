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
  qualifications: z.any().optional().nullable(),
  workExperience: z.any().optional().nullable(),
  interests: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  certificates: z.any().optional().nullable(),
  specializations: z.array(z.string()).optional().default([]),
  teachingDomains: z.array(z.string()).optional().default([]),
  bio: z.string().optional().nullable(),
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
  qualifications: z.any().optional().nullable(),
  workExperience: z.any().optional().nullable(),
  interests: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  certificates: z.any().optional().nullable(),
  specializations: z.array(z.string()).optional(),
  teachingDomains: z.array(z.string()).optional(),
  bio: z.string().optional().nullable(),
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

export const qualificationItemSchema = z.object({
  degree: z.string().trim().min(1, "Degree / Title is required").max(100),
  institution: z.string().trim().min(1, "Institution is required").max(150),
  year: z.string().trim().max(20).optional(),
  field: z.string().trim().max(100).optional(),
});

export const workExperienceItemSchema = z.object({
  role: z.string().trim().min(1, "Role / Title is required").max(100),
  company: z.string().trim().min(1, "Company / Organization is required").max(150),
  duration: z.string().trim().max(50).optional(),
  description: z.string().trim().max(500).optional(),
});

export const certificateItemSchema = z.object({
  title: z.string().trim().min(1, "Certificate Title is required").max(150),
  issuer: z.string().trim().min(1, "Issuing Organization is required").max(150),
  year: z.string().trim().max(20).optional(),
  credentialUrl: z.string().trim().max(300).optional(),
});

export const traineeProfileUpdateSchema = z.object({
  qualifications: z.array(qualificationItemSchema).optional().nullable(),
  workExperience: z.array(workExperienceItemSchema).optional().nullable(),
  interests: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  skills: z.array(z.string().trim().min(1).max(50)).max(50).optional(),
  certificates: z.array(certificateItemSchema).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
});

export type TraineeProfileUpdateInput = z.infer<typeof traineeProfileUpdateSchema>;

export const employeeQuerySchema = z.object({
  search: z.string().trim().optional(),
  department: z.string().trim().optional(),
  designationId: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;