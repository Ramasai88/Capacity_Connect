import { z } from "zod";

export const questionnaireStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export type QuestionnaireStatusEnum = z.infer<typeof questionnaireStatusEnum>;

export const questionnaireQuestionSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
  questionText: z.string().trim().min(1, "Question text is required"),
  options: z
    .array(z.string().trim().min(1, "Option text cannot be empty"))
    .min(2, "At least 2 options are required")
    .max(10, "Maximum 10 options per question"),
  correctOption: z
    .number()
    .int()
    .nonnegative("Correct option index must be non-negative"),
  explanation: z.string().trim().optional().nullable(),
  points: z.number().int().positive("Points must be at least 1").optional().default(1),
}).refine(
  (data) => data.correctOption < data.options.length,
  {
    message: "Correct option index must be less than the total number of options",
    path: ["correctOption"],
  }
);

export type QuestionnaireQuestionInput = z.infer<typeof questionnaireQuestionSchema>;

export const createQuestionnaireSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required"),
  courseId: z.string().trim().optional().nullable(),
  competencyId: z.string().trim().optional().nullable(),
  deadline: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid deadline date format",
    }),
  durationMinutes: z
    .number()
    .int()
    .positive("Duration must be at least 1 minute")
    .optional()
    .default(30),
  passingScore: z
    .number()
    .min(0, "Passing score cannot be negative")
    .max(100, "Passing score cannot exceed 100")
    .optional()
    .default(70.0),
  status: questionnaireStatusEnum.optional().default("DRAFT"),
  questions: z
    .array(questionnaireQuestionSchema)
    .min(1, "At least 1 question is required in the questionnaire"),
});

export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireSchema>;

export const updateQuestionnaireSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255).optional(),
  description: z.string().trim().min(1, "Description is required").optional(),
  courseId: z.string().trim().optional().nullable(),
  competencyId: z.string().trim().optional().nullable(),
  deadline: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid deadline date format",
    }),
  durationMinutes: z.number().int().positive().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  status: questionnaireStatusEnum.optional(),
  questions: z.array(questionnaireQuestionSchema).optional(),
});

export type UpdateQuestionnaireInput = z.infer<typeof updateQuestionnaireSchema>;

export const submitQuestionnaireAnswerItemSchema = z.object({
  questionId: z.string().min(1, "Question ID is required"),
  selectedOption: z
    .number()
    .int()
    .nonnegative("Selected option must be a non-negative integer"),
});

export const submitQuestionnaireSchema = z.object({
  answers: z
    .array(submitQuestionnaireAnswerItemSchema)
    .min(1, "At least one answer must be submitted"),
  timeSpentMinutes: z.number().int().nonnegative().optional().nullable(),
});

export type SubmitQuestionnaireInput = z.infer<typeof submitQuestionnaireSchema>;
export type SubmitQuestionnaireAnswerItem = z.infer<typeof submitQuestionnaireAnswerItemSchema>;
