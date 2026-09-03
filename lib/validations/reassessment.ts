import { z } from "zod";

export const reviewReassessmentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "Status must be either APPROVED or REJECTED" }),
  }),
  reviewerComments: z.string().trim().optional().nullable(),
});

export type ReviewReassessmentInput = z.infer<typeof reviewReassessmentSchema>;

export const reassessmentQuerySchema = z.object({
  status: z.enum(["PENDING_REASSESSMENT", "APPROVED", "REJECTED"]).optional(),
  employeeId: z.string().trim().optional(),
  courseId: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type ReassessmentQueryInput = z.infer<typeof reassessmentQuerySchema>;
