import { z } from "zod";

export const submitFeedbackSchema = z.object({
  courseId: z.string().trim().min(1, "Course ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  contentQuality: z
    .number()
    .int()
    .min(1, "Content quality rating must be between 1 and 5")
    .max(5, "Content quality rating must be between 1 and 5")
    .optional()
    .nullable(),
  trainerClarity: z
    .number()
    .int()
    .min(1, "Trainer clarity rating must be between 1 and 5")
    .max(5, "Trainer clarity rating must be between 1 and 5")
    .optional()
    .nullable(),
  applicability: z
    .number()
    .int()
    .min(1, "Applicability rating must be between 1 and 5")
    .max(5, "Applicability rating must be between 1 and 5")
    .optional()
    .nullable(),
  feedbackText: z
    .string()
    .trim()
    .max(2000, "Feedback text cannot exceed 2000 characters")
    .optional()
    .nullable(),
  isAnonymous: z.boolean().optional().default(false),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
