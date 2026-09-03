import { z } from "zod";

export const competencyLevelInputSchema = z
  .object({
    level: z
      .number()
      .int()
      .min(1, "Level must be between 1 and 5")
      .max(5, "Level must be between 1 and 5"),
    label: z.string().trim().optional(),
    name: z.string().trim().optional(),
    description: z.string().trim().min(1, "Level description is required"),
    behavioralIndicators: z.array(z.string().trim()).optional().default([]),
  })
  .transform((data) => {
    const defaultLabels: Record<number, string> = {
      1: "Beginner / Foundational",
      2: "Intermediate / Working",
      3: "Proficient / Practitioner",
      4: "Advanced / Specialist",
      5: "Expert / Master",
    };
    const label = (data.label || data.name || defaultLabels[data.level] || `Level ${data.level}`).trim();
    return {
      level: data.level,
      label,
      description: data.description.trim(),
      behavioralIndicators: data.behavioralIndicators || [],
    };
  });

export type CompetencyLevelInput = z.infer<typeof competencyLevelInputSchema>;

export const defaultCompetencyLevels: CompetencyLevelInput[] = [
  {
    level: 1,
    label: "Beginner / Foundational",
    description: "Basic conceptual understanding, requires guidance and supervision.",
    behavioralIndicators: [
      "Understands core terminology and elementary concepts",
      "Executes tasks under continuous mentor guidance",
    ],
  },
  {
    level: 2,
    label: "Intermediate / Working",
    description: "Practical working knowledge, executes routine tasks independently.",
    behavioralIndicators: [
      "Applies principles to routine operational workflows",
      "Identifies common syntax and logic errors independently",
    ],
  },
  {
    level: 3,
    label: "Proficient / Practitioner",
    description: "Competent independent contributor, implements standard architectures.",
    behavioralIndicators: [
      "Builds and debugs full-scale modules independently",
      "Applies best practices, security baselines, and performance optimizations",
    ],
  },
  {
    level: 4,
    label: "Advanced / Specialist",
    description: "Deep technical expertise, handles complex challenges, mentors others.",
    behavioralIndicators: [
      "Architects complex subsystems and diagnoses edge-case anomalies",
      "Mentors team members and sets engineering standards",
    ],
  },
  {
    level: 5,
    label: "Expert / Master",
    description: "Subject matter authority, drives strategy, sets organizational standards.",
    behavioralIndicators: [
      "Drives organization-wide strategy, frameworks, and technological roadmaps",
      "Recognized industry/domain authority and lead architect",
    ],
  },
];

export const createCompetencySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Competency name is required")
    .min(2, "Competency name must be at least 2 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Competency code is required")
    .regex(/^[A-Za-z0-9-_]+$/, "Code can only contain letters, numbers, hyphens, and underscores"),
  category: z.string().trim().min(1, "Category is required"),
  description: z.string().trim().min(1, "Description is required"),
  levels: z
    .array(competencyLevelInputSchema)
    .optional()
    .default(defaultCompetencyLevels)
    .refine(
      (levels) => {
        if (!levels || levels.length === 0) return true;
        const set = new Set(levels.map((l) => l.level));
        return set.size === levels.length && levels.every((l) => l.level >= 1 && l.level <= 5);
      },
      {
        message: "Competency levels must have unique levels between 1 and 5",
      }
    ),
});

export type CreateCompetencyInput = z.infer<typeof createCompetencySchema>;

export const updateCompetencySchema = z.object({
  name: z.string().trim().min(2, "Competency name must be at least 2 characters").optional(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-_]+$/, "Code can only contain letters, numbers, hyphens, and underscores")
    .optional(),
  category: z.string().trim().min(1, "Category cannot be empty").optional(),
  description: z.string().trim().min(1, "Description cannot be empty").optional(),
  levels: z
    .array(competencyLevelInputSchema)
    .optional()
    .refine(
      (levels) => {
        if (!levels) return true;
        const set = new Set(levels.map((l) => l.level));
        return set.size === levels.length && levels.every((l) => l.level >= 1 && l.level <= 5);
      },
      {
        message: "Competency levels must have unique levels between 1 and 5",
      }
    ),
});

export type UpdateCompetencyInput = z.infer<typeof updateCompetencySchema>;

export const competencyQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type CompetencyQueryInput = z.infer<typeof competencyQuerySchema>;
