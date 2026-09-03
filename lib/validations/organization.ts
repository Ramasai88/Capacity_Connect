import { z } from "zod";

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Organization name must be at least 2 characters").optional(),
  code: z.string().trim().regex(/^[A-Za-z0-9-_]+$/).optional(),
  description: z.string().trim().optional().nullable(),
  industry: z.string().trim().optional().nullable(),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
