export interface LearningResource {
  title: string;
  url: string;
  description: string;
  type: "documentation" | "guide" | "tutorial" | "reference" | "specification" | "article";
  provider?: string;
}

export interface CourseConcept {
  title: string;
  description: string;
  section?: string;
  topic?: string;
  prerequisites?: string;
  whyItMatters?: string;
  howItWorks?: string;
  stepByStep?: string[];
  workedExample?: string;
  realWorldUsage?: string;
  codeSnippet?: string;
  codeExplanation?: string;
  expectedOutput?: string;
  commonMistakes?: string;
  bestPractices?: string;
  practiceTask?: string;
  keyTakeaway?: string;
  concepts?: string[];
}

export interface CourseModule {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  summary: string;
  learningObjectives?: string[];
  resources?: LearningResource[];
  content?: {
    overview?: string;
    keyConcepts?: CourseConcept[];
    resources?: LearningResource[];
    practicalExercise?: string;
    competencyVerification?: string;
  };
  overview?: string;
  keyConcepts?: CourseConcept[];
  practicalExercise?: string;
  competencyVerification?: string;
}

export interface CourseCurriculum {
  courseId: string;
  totalDurationMinutes: number;
  modules: CourseModule[];
}
