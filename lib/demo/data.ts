import {
  calculateSkillGap,
  summarizeOrganizationSkillGaps,
  type CompetencyGapResult,
  type EmployeeSkillGapSummary,
  type OrganizationSkillGapSummary,
} from "@/lib/skill-gap/calculateSkillGap";

export interface DemoOrganization {
  id: string;
  name: string;
  code: string;
  description: string;
  logo?: string;
  industry: string;
  totalEmployeesCount: number;
}

export interface DemoCompetencyLevel {
  level: number;
  label: string;
  description: string;
  behavioralIndicators: string[];
}

export interface DemoCompetency {
  id: string;
  name: string;
  code: string;
  category: "Technical / Programming" | "Data & AI" | "Soft Skills" | "Management";
  description: string;
  levels: DemoCompetencyLevel[];
}

export interface DemoDesignationRequirement {
  competencyId: string;
  requiredLevel: number;
}

export interface DemoDesignation {
  id: string;
  title: string;
  code: string;
  department: string;
  description: string;
  requirements: DemoDesignationRequirement[];
}

export interface DemoEmployeeCompetency {
  competencyId: string;
  currentLevel: number | null;
  assessedAt: string;
  assessedBy: string;
}

export interface DemoEmployee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  designationId: string;
  designationTitle: string;
  joiningDate: string;
  status: "ACTIVE" | "INACTIVE";
  competencies: DemoEmployeeCompetency[];
}

export interface DemoCourse {
  id: string;
  title: string;
  code: string;
  description: string;
  category: string;
  competencyId: string;
  competencyName: string;
  targetLevel: number;
  durationHours: number;
  modulesCount: number;
  status: "PUBLISHED" | "DRAFT";
  rating: number;
  enrolledCount: number;
}

export interface DemoEnrollment {
  id: string;
  employeeId: string;
  courseId: string;
  courseTitle: string;
  competencyName: string;
  enrolledAt: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  status: "IN_PROGRESS" | "COMPLETED";
}

// --------------------------------------------------------------------------
// 1. Organization
// --------------------------------------------------------------------------
export const DEMO_ORGANIZATION: DemoOrganization = {
  id: "org-kl-university",
  name: "Capacity Connect",
  code: "CC",
  description: "Digital Capacity Building and Skill Gap Analytics Portal",
  industry: "Higher Education & Research",
  totalEmployeesCount: 5,
};

// --------------------------------------------------------------------------
// 2. Universal 1-5 Competency Level Scale Definition
// --------------------------------------------------------------------------
export const DEFAULT_COMPETENCY_LEVELS: DemoCompetencyLevel[] = [
  {
    level: 1,
    label: "Beginner / Foundational",
    description: "Basic conceptual understanding, requires guidance and supervision for execution.",
    behavioralIndicators: [
      "Understands core terminology and elementary syntax",
      "Executes tasks under continuous mentor supervision",
      "Can follow standard step-by-step documentation",
    ],
  },
  {
    level: 2,
    label: "Intermediate / Working",
    description: "Practical working knowledge, executes routine tasks independently.",
    behavioralIndicators: [
      "Applies principles to routine operational workflows",
      "Identifies common syntax and logic errors",
      "Works with limited direct supervision on standard tasks",
    ],
  },
  {
    level: 3,
    label: "Proficient / Practitioner",
    description: "Competent independent contributor, solves problems and implements standard architectures.",
    behavioralIndicators: [
      "Builds and debugs full-scale modules independently",
      "Applies design patterns, optimizations, and security baselines",
      "Participates effectively in peer reviews and technical evaluations",
    ],
  },
  {
    level: 4,
    label: "Advanced / Specialist",
    description: "Deep technical expertise, handles complex challenges, mentors others.",
    behavioralIndicators: [
      "Architects complex subsystems and diagnoses edge-case anomalies",
      "Mentors team members and sets engineering standards",
      "Leads multi-faceted technical projects to completion",
    ],
  },
  {
    level: 5,
    label: "Expert / Master",
    description: "Subject matter authority, drives strategy, sets organizational standards.",
    behavioralIndicators: [
      "Drives organization-wide strategy, frameworks, and technological roadmaps",
      "Recognized industry thought leader with deep domain insights",
      "Innovates novel methodologies and high-impact solutions",
    ],
  },
];

// --------------------------------------------------------------------------
// 3. Competencies
// --------------------------------------------------------------------------
export const DEMO_COMPETENCIES: DemoCompetency[] = [
  {
    id: "comp-python",
    name: "Python",
    code: "TECH-PY-01",
    category: "Technical / Programming",
    description: "Core Python programming, data structures, object-oriented design, async patterns, and ecosystem libraries.",
    levels: DEFAULT_COMPETENCY_LEVELS,
  },
  {
    id: "comp-java",
    name: "Java",
    code: "TECH-JV-02",
    category: "Technical / Programming",
    description: "Enterprise Java development, Spring Boot, microservices architecture, memory management, and JVM tuning.",
    levels: DEFAULT_COMPETENCY_LEVELS,
  },
  {
    id: "comp-ml",
    name: "Machine Learning",
    code: "AI-ML-03",
    category: "Data & AI",
    description: "Supervised and unsupervised algorithms, scikit-learn, PyTorch, model evaluation, and MLOps deployment pipelines.",
    levels: DEFAULT_COMPETENCY_LEVELS,
  },
  {
    id: "comp-communication",
    name: "Communication",
    code: "SOFT-COM-04",
    category: "Soft Skills",
    description: "Clear technical and cross-functional communication, active listening, executive presentations, and documentation.",
    levels: DEFAULT_COMPETENCY_LEVELS,
  },
  {
    id: "comp-leadership",
    name: "Leadership",
    code: "MGMT-LDR-05",
    category: "Management",
    description: "People leadership, strategic delegation, empathetic coaching, team conflict resolution, and vision alignment.",
    levels: DEFAULT_COMPETENCY_LEVELS,
  },
  {
    id: "comp-sql",
    name: "SQL",
    code: "DATA-SQL-06",
    category: "Data & AI",
    description: "Relational database querying, indexing, query plan optimization, schema design, and analytical window functions.",
    levels: DEFAULT_COMPETENCY_LEVELS,
  },
  {
    id: "comp-data-analysis",
    name: "Data Analysis",
    code: "DATA-ANA-07",
    category: "Data & AI",
    description: "Exploratory data analysis, statistical methods, metric modeling, Pandas, data visualization, and reporting.",
    levels: DEFAULT_COMPETENCY_LEVELS,
  },
];

// --------------------------------------------------------------------------
// 4. Designations & Required Competency Matrix
// --------------------------------------------------------------------------
export const DEMO_DESIGNATIONS: DemoDesignation[] = [
  {
    id: "desig-swe",
    title: "Software Engineer",
    code: "SWE",
    department: "Engineering",
    description: "Designs, develops, tests, and maintains backend services and high-scale software applications.",
    requirements: [
      { competencyId: "comp-python", requiredLevel: 4 },
      { competencyId: "comp-java", requiredLevel: 4 },
      { competencyId: "comp-sql", requiredLevel: 3 },
      { competencyId: "comp-communication", requiredLevel: 3 },
    ],
  },
  {
    id: "desig-ds",
    title: "Data Scientist",
    code: "DS",
    department: "Data & AI",
    description: "Analyzes high-dimensional data, trains predictive machine learning models, and drives AI solutions.",
    requirements: [
      { competencyId: "comp-python", requiredLevel: 4 },
      { competencyId: "comp-ml", requiredLevel: 4 },
      { competencyId: "comp-sql", requiredLevel: 4 },
      { competencyId: "comp-data-analysis", requiredLevel: 4 },
      { competencyId: "comp-communication", requiredLevel: 3 },
    ],
  },
  {
    id: "desig-pm",
    title: "Project Manager",
    code: "PM",
    department: "Program Management",
    description: "Oversees cross-functional delivery timelines, stakeholder engagement, and project execution cadence.",
    requirements: [
      { competencyId: "comp-leadership", requiredLevel: 4 },
      { competencyId: "comp-communication", requiredLevel: 5 },
      { competencyId: "comp-sql", requiredLevel: 2 },
      { competencyId: "comp-python", requiredLevel: 1 },
    ],
  },
  {
    id: "desig-hrm",
    title: "HR Manager",
    code: "HRM",
    department: "Human Resources",
    description: "Manages talent acquisition, organizational capacity development, employee relations, and HR policies.",
    requirements: [
      { competencyId: "comp-communication", requiredLevel: 5 },
      { competencyId: "comp-leadership", requiredLevel: 4 },
      { competencyId: "comp-data-analysis", requiredLevel: 3 },
    ],
  },
];

// --------------------------------------------------------------------------
// 5. Employees & Current Competency Levels
// Demonstrates realistic skill gaps matching:
// gap = max(0, requiredLevel - currentLevel)
// --------------------------------------------------------------------------
export const DEMO_EMPLOYEES: DemoEmployee[] = [
  {
    id: "emp-1",
    employeeCode: "EMP001",
    name: "Ravi Kumar",
    email: "ravi.kumar@capacityconnect.demo",
    department: "Engineering",
    designationId: "desig-swe",
    designationTitle: "Software Engineer",
    joiningDate: "2024-01-15",
    status: "ACTIVE",
    competencies: [
      // SWE requires: Python (4), Java (4), SQL (3), Communication (3)
      { competencyId: "comp-python", currentLevel: 2, assessedAt: "2024-05-10", assessedBy: "Sarah Jenkins" }, // Gap: 2
      { competencyId: "comp-java", currentLevel: 3, assessedAt: "2024-05-10", assessedBy: "Sarah Jenkins" },   // Gap: 1
      { competencyId: "comp-sql", currentLevel: 3, assessedAt: "2024-05-10", assessedBy: "Sarah Jenkins" },    // Gap: 0 (Meets)
      { competencyId: "comp-communication", currentLevel: 2, assessedAt: "2024-05-10", assessedBy: "Sarah Jenkins" }, // Gap: 1
    ],
  },
  {
    id: "emp-2",
    employeeCode: "EMP002",
    name: "Priya Sharma",
    email: "priya.sharma@capacityconnect.demo",
    department: "Data & AI",
    designationId: "desig-ds",
    designationTitle: "Data Scientist",
    joiningDate: "2023-06-10",
    status: "ACTIVE",
    competencies: [
      // DS requires: Python (4), ML (4), SQL (4), Data Analysis (4), Communication (3)
      { competencyId: "comp-python", currentLevel: 4, assessedAt: "2024-06-15", assessedBy: "Dr. K. Srinivas" }, // Gap: 0 (Meets)
      { competencyId: "comp-ml", currentLevel: 3, assessedAt: "2024-06-15", assessedBy: "Dr. K. Srinivas" },     // Gap: 1 (Needs)
      { competencyId: "comp-sql", currentLevel: 4, assessedAt: "2024-06-15", assessedBy: "Dr. K. Srinivas" },    // Gap: 0 (Meets)
      { competencyId: "comp-data-analysis", currentLevel: 4, assessedAt: "2024-06-15", assessedBy: "Dr. K. Srinivas" }, // Gap: 0 (Meets)
      { competencyId: "comp-communication", currentLevel: 4, assessedAt: "2024-06-15", assessedBy: "Dr. K. Srinivas" }, // Gap: 0 (Meets)
    ],
  },
  {
    id: "emp-3",
    employeeCode: "EMP003",
    name: "Ananya Patel",
    email: "ananya.patel@capacityconnect.demo",
    department: "Program Management",
    designationId: "desig-pm",
    designationTitle: "Project Manager",
    joiningDate: "2022-11-01",
    status: "ACTIVE",
    competencies: [
      // PM requires: Leadership (4), Communication (5), SQL (2), Python (1)
      { competencyId: "comp-leadership", currentLevel: 4, assessedAt: "2024-04-20", assessedBy: "Sarah Jenkins" }, // Gap: 0 (Meets)
      { competencyId: "comp-communication", currentLevel: 4, assessedAt: "2024-04-20", assessedBy: "Sarah Jenkins" }, // Gap: 1 (Needs)
      { competencyId: "comp-sql", currentLevel: 1, assessedAt: "2024-04-20", assessedBy: "Sarah Jenkins" }, // Gap: 1 (Needs)
      // Python not yet assessed -> Gap = 1 (NOT_ASSESSED)
    ],
  },
  {
    id: "emp-4",
    employeeCode: "EMP004",
    name: "Vikram Singh",
    email: "vikram.singh@capacityconnect.demo",
    department: "Human Resources",
    designationId: "desig-hrm",
    designationTitle: "HR Manager",
    joiningDate: "2021-08-20",
    status: "ACTIVE",
    competencies: [
      // HRM requires: Communication (5), Leadership (4), Data Analysis (3)
      { competencyId: "comp-communication", currentLevel: 5, assessedAt: "2024-03-12", assessedBy: "Dr. K. Srinivas" }, // Gap: 0 (Meets)
      { competencyId: "comp-leadership", currentLevel: 3, assessedAt: "2024-03-12", assessedBy: "Dr. K. Srinivas" }, // Gap: 1 (Needs)
      { competencyId: "comp-data-analysis", currentLevel: 2, assessedAt: "2024-03-12", assessedBy: "Dr. K. Srinivas" }, // Gap: 1 (Needs)
    ],
  },
  {
    id: "emp-5",
    employeeCode: "EMP005",
    name: "Sneha Reddy",
    email: "sneha.reddy@capacityconnect.demo",
    department: "Engineering",
    designationId: "desig-swe",
    designationTitle: "Software Engineer",
    joiningDate: "2024-03-01",
    status: "ACTIVE",
    competencies: [
      // SWE requires: Python (4), Java (4), SQL (3), Communication (3)
      { competencyId: "comp-python", currentLevel: 4, assessedAt: "2024-06-01", assessedBy: "Sarah Jenkins" }, // Gap: 0
      { competencyId: "comp-java", currentLevel: 4, assessedAt: "2024-06-01", assessedBy: "Sarah Jenkins" },   // Gap: 0
      { competencyId: "comp-sql", currentLevel: 2, assessedAt: "2024-06-01", assessedBy: "Sarah Jenkins" },    // Gap: 1
      { competencyId: "comp-communication", currentLevel: 3, assessedAt: "2024-06-01", assessedBy: "Sarah Jenkins" }, // Gap: 0
    ],
  },
];

// --------------------------------------------------------------------------
// 6. Courses / Learning Content
// --------------------------------------------------------------------------
export const DEMO_COURSES: DemoCourse[] = [
  {
    id: "course-fsw-401",
    title: "Full Stack Web Development",
    code: "CRS-FSW-401",
    description: "End-to-end full stack web engineering covering internet architecture, modern JavaScript, TypeScript, React, backend APIs, relational databases, and cloud deployment.",
    category: "Technical / Programming",
    competencyId: "comp-python",
    competencyName: "Python",
    targetLevel: 4,
    durationHours: 30,
    modulesCount: 8,
    status: "PUBLISHED",
    rating: 4.9,
    enrolledCount: 24,
  },
  {
    id: "course-jv-401",
    title: "Advanced Java & Spring Boot",
    code: "CRS-JV-401",
    description: "Enterprise Java architecture, JVM memory tuning, SOLID clean architecture, Spring Core, Spring Boot microservices, JPA persistence, and Spring Security 6.",
    category: "Technical / Programming",
    competencyId: "comp-java",
    competencyName: "Java",
    targetLevel: 4,
    durationHours: 28,
    modulesCount: 8,
    status: "PUBLISHED",
    rating: 4.8,
    enrolledCount: 18,
  },
  {
    id: "course-ts-301",
    title: "Modern JavaScript & TypeScript",
    code: "CRS-TS-301",
    description: "Master modern ECMAScript standards, asynchronous Promise pipelines, closures, prototype mechanics, static TypeScript typing, generics, and type-safe architecture.",
    category: "Technical / Programming",
    competencyId: "comp-python",
    competencyName: "Python",
    targetLevel: 3,
    durationHours: 24,
    modulesCount: 9,
    status: "PUBLISHED",
    rating: 4.8,
    enrolledCount: 22,
  },
  {
    id: "course-rct-401",
    title: "React & Next.js Application Development",
    code: "CRS-RCT-401",
    description: "Build high-performance web applications with React component composition, custom hooks, Next.js App Router, Server Components, Server Actions, and NextAuth RBAC.",
    category: "Technical / Programming",
    competencyId: "comp-python",
    competencyName: "Python",
    targetLevel: 4,
    durationHours: 28,
    modulesCount: 10,
    status: "PUBLISHED",
    rating: 4.9,
    enrolledCount: 31,
  },
  {
    id: "course-api-401",
    title: "Backend API & Microservices Development",
    code: "CRS-API-401",
    description: "Architecting scalable backend systems: REST API standards, stateless JWT identity, connection pooling, Redis caching, microservices decomposition, and message brokers.",
    category: "Technical / Programming",
    competencyId: "comp-java",
    competencyName: "Java",
    targetLevel: 4,
    durationHours: 30,
    modulesCount: 10,
    status: "PUBLISHED",
    rating: 4.7,
    enrolledCount: 15,
  },
  {
    id: "course-py-401",
    title: "Python for AI & Machine Learning",
    code: "CRS-PY-401",
    description: "Deep dive into async IO, memory profiling, metaprogramming, NumPy vectorization, Pandas wrangling, exploratory data analysis, and ML data preparation pipelines in Python.",
    category: "Technical / Programming",
    competencyId: "comp-python",
    competencyName: "Python",
    targetLevel: 4,
    durationHours: 24,
    modulesCount: 6,
    status: "PUBLISHED",
    rating: 4.8,
    enrolledCount: 28,
  },
  {
    id: "course-ml-402",
    title: "Machine Learning Fundamentals",
    code: "CRS-ML-402",
    description: "Master regression, classification, regularized loss functions, ensemble modeling (Random Forest, XGBoost), clustering, feature engineering, and model serving.",
    category: "Data & AI",
    competencyId: "comp-ml",
    competencyName: "Machine Learning",
    targetLevel: 4,
    durationHours: 32,
    modulesCount: 8,
    status: "PUBLISHED",
    rating: 4.9,
    enrolledCount: 35,
  },
  {
    id: "course-dl-501",
    title: "Deep Learning & Neural Networks",
    code: "CRS-DL-501",
    description: "Neural network architectures, PyTorch autograd, forward/backpropagation calculus, optimization algorithms (AdamW), CNNs, RNNs/LSTMs, and transfer learning.",
    category: "Data & AI",
    competencyId: "comp-ml",
    competencyName: "Machine Learning",
    targetLevel: 5,
    durationHours: 36,
    modulesCount: 10,
    status: "PUBLISHED",
    rating: 4.9,
    enrolledCount: 20,
  },
  {
    id: "course-nlp-501",
    title: "Natural Language Processing & Generative AI",
    code: "CRS-NLP-501",
    description: "Modern NLP pipelines, subword tokenization, Word2Vec, Transformer self-attention architecture, Large Language Models (LLMs), prompt engineering, and RAG systems.",
    category: "Data & AI",
    competencyId: "comp-ml",
    competencyName: "Machine Learning",
    targetLevel: 5,
    durationHours: 40,
    modulesCount: 11,
    status: "PUBLISHED",
    rating: 5.0,
    enrolledCount: 42,
  },
  {
    id: "course-mlops-501",
    title: "MLOps & Production AI Systems",
    code: "CRS-MLOPS-501",
    description: "Operationalizing machine learning: DVC data versioning, MLflow experiment tracking, BentoML/ONNX packaging, continuous training (CI/CD/CT), and data drift monitoring.",
    category: "Data & AI",
    competencyId: "comp-ml",
    competencyName: "Machine Learning",
    targetLevel: 5,
    durationHours: 36,
    modulesCount: 11,
    status: "PUBLISHED",
    rating: 4.8,
    enrolledCount: 19,
  },
  {
    id: "course-sql-301",
    title: "Relational Query Optimization & Analytical SQL",
    code: "CRS-SQL-301",
    description: "Comprehensive guide to indexing strategies, window functions, query execution plan analysis, and database schema normalization.",
    category: "Data & AI",
    competencyId: "comp-sql",
    competencyName: "SQL",
    targetLevel: 3,
    durationHours: 16,
    modulesCount: 5,
    status: "PUBLISHED",
    rating: 4.6,
    enrolledCount: 22,
  },
  {
    id: "course-com-501",
    title: "Executive & Strategic Workplace Communication",
    code: "CRS-COM-501",
    description: "High-impact stakeholder messaging, negotiation tactics, technical storytelling, and cross-functional leadership alignment.",
    category: "Soft Skills",
    competencyId: "comp-communication",
    competencyName: "Communication",
    targetLevel: 5,
    durationHours: 14,
    modulesCount: 4,
    status: "PUBLISHED",
    rating: 4.9,
    enrolledCount: 27,
  },
  {
    id: "course-ldr-401",
    title: "Strategic Team Leadership & Performance Coaching",
    code: "CRS-LDR-401",
    description: "Practical framework for high-performing engineering teams, 1-on-1 mentoring, psychological safety, and accountability.",
    category: "Management",
    competencyId: "comp-leadership",
    competencyName: "Leadership",
    targetLevel: 4,
    durationHours: 20,
    modulesCount: 6,
    status: "PUBLISHED",
    rating: 4.8,
    enrolledCount: 16,
  },
];

// --------------------------------------------------------------------------
// 7. Demo Enrollments (Ravi Kumar's active learning path)
// --------------------------------------------------------------------------
export const DEMO_ENROLLMENTS: DemoEnrollment[] = [
  {
    id: "enroll-1",
    employeeId: "emp-1",
    courseId: "course-py-401",
    courseTitle: "Advanced Python Architecture & Concurrency",
    competencyName: "Python",
    enrolledAt: "2024-05-15",
    progressPercent: 65,
    completedLessons: 4,
    totalLessons: 6,
    status: "IN_PROGRESS",
  },
  {
    id: "enroll-2",
    employeeId: "emp-1",
    courseId: "course-jv-401",
    courseTitle: "Enterprise Java Architecture with Spring Boot",
    competencyName: "Java",
    enrolledAt: "2024-05-20",
    progressPercent: 30,
    completedLessons: 2,
    totalLessons: 7,
    status: "IN_PROGRESS",
  },
];

// --------------------------------------------------------------------------
// 8. Demo User Logins
// --------------------------------------------------------------------------
export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  organizationId: string;
  employeeId: string | null;
  department?: string;
  avatarLabel: string;
}

export const DEMO_USERS: {
  admin: DemoUser;
  manager: DemoUser;
  employee: DemoUser;
} = {
  admin: {
    id: "usr-admin-1",
    email: "admin@capacityconnect.demo",
    name: "Dr. K. Srinivas",
    role: "ADMIN",
    organizationId: "org-kl-university",
    employeeId: null,
    department: "Executive Leadership",
    avatarLabel: "KS (Admin)",
  },
  manager: {
    id: "usr-manager-1",
    email: "manager@capacityconnect.demo",
    name: "Sarah Jenkins",
    role: "MANAGER",
    organizationId: "org-kl-university",
    employeeId: null,
    department: "Engineering Leadership",
    avatarLabel: "SJ (Manager)",
  },
  employee: {
    id: "usr-emp-1",
    email: "ravi.kumar@capacityconnect.demo",
    name: "Ravi Kumar",
    role: "EMPLOYEE",
    organizationId: "org-kl-university",
    employeeId: "emp-1",
    department: "Engineering",
    avatarLabel: "RK (Employee)",
  },
};


// --------------------------------------------------------------------------
// 9. Helper computation functions
// --------------------------------------------------------------------------

/**
 * Returns the computed skill gaps for a single employee using the pure calculation engine.
 */
export function getEmployeeSkillGaps(employeeId: string): EmployeeSkillGapSummary | null {
  const employee = DEMO_EMPLOYEES.find((e) => e.id === employeeId);
  if (!employee) return null;

  const designation = DEMO_DESIGNATIONS.find((d) => d.id === employee.designationId);
  if (!designation) return null;

  const requiredInputs = designation.requirements.map((req) => {
    const comp = DEMO_COMPETENCIES.find((c) => c.id === req.competencyId);
    return {
      competencyId: req.competencyId,
      competencyName: comp?.name ?? req.competencyId,
      category: comp?.category,
      requiredLevel: req.requiredLevel,
    };
  });

  const currentInputs = employee.competencies.map((curr) => ({
    competencyId: curr.competencyId,
    currentLevel: curr.currentLevel,
    assessedAt: curr.assessedAt,
  }));

  const gaps = calculateSkillGap(requiredInputs, currentInputs);

  const meetsRequirementCount = gaps.filter((g) => g.status === "MEETS_REQUIREMENT").length;
  const needsImprovementCount = gaps.filter((g) => g.status === "NEEDS_IMPROVEMENT").length;
  const notAssessedCount = gaps.filter((g) => g.status === "NOT_ASSESSED").length;
  const totalGapSum = gaps.reduce((acc, g) => acc + g.gap, 0);

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    designationTitle: designation.title,
    totalRequired: designation.requirements.length,
    meetsRequirementCount,
    needsImprovementCount,
    notAssessedCount,
    averageGap: gaps.length > 0 ? Number((totalGapSum / gaps.length).toFixed(1)) : 0,
    gaps,
  };
}

/**
 * Returns all employee summaries and the organization-wide aggregated skill gap metrics.
 */
export function getOrganizationSkillGapData(): {
  employeeSummaries: EmployeeSkillGapSummary[];
  organizationSummary: OrganizationSkillGapSummary;
} {
  const employeeSummaries: EmployeeSkillGapSummary[] = [];

  for (const emp of DEMO_EMPLOYEES) {
    const summary = getEmployeeSkillGaps(emp.id);
    if (summary) {
      employeeSummaries.push(summary);
    }
  }

  const organizationSummary = summarizeOrganizationSkillGaps(employeeSummaries);

  return {
    employeeSummaries,
    organizationSummary,
  };
}

/**
 * Returns recommended courses for an employee based on identified skill gaps.
 */
export function getRecommendedCoursesForEmployee(employeeId: string): {
  gap: CompetencyGapResult;
  course: DemoCourse | null;
}[] {
  const summary = getEmployeeSkillGaps(employeeId);
  if (!summary) return [];

  const weakGaps = summary.gaps.filter((g) => g.status !== "MEETS_REQUIREMENT");

  return weakGaps.map((gap) => {
    const matchingCourse = DEMO_COURSES.find(
      (c) => c.competencyId === gap.competencyId && c.status === "PUBLISHED"
    );
    return {
      gap,
      course: matchingCourse ?? null,
    };
  });
}
