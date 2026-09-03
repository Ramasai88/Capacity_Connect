import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Public self-registration schema.
 * The `role` field is accepted from the form but IGNORED on the server —
 * public signup always creates EMPLOYEE accounts. Server enforces this.
 */
export const signupSchema = z
  .object({
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
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
    // Role is sent from the signup form but is ALWAYS overridden to EMPLOYEE
    // server-side. This field exists only so the field is included in the form
    // without a TypeScript error; the register endpoint ignores it.
    role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Admin-only user creation schema.
 * Only accessible via /api/users (requires authenticated ADMIN session).
 * Allows creating accounts with ADMIN, MANAGER, or EMPLOYEE roles.
 */
export const adminCreateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full Name must be at least 2 characters"),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
    role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"], {
      required_error: "Role is required",
      invalid_type_error: "Role must be ADMIN, MANAGER, or EMPLOYEE",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

