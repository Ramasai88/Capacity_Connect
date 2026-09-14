import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { CompetencyService } from "@/lib/services/competency.service";
import { CourseService, CourseServiceError } from "@/lib/services/course.service";
import { RoleLearningService } from "@/lib/services/role-learning.service";
import { hasPermission } from "@/lib/auth/rbac";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_COURSE_CODES: string[] = [];

afterEach(async () => {
  if (CLEANUP_COURSE_CODES.length > 0) {
    const courses = await prisma.course.findMany({
      where: { code: { in: CLEANUP_COURSE_CODES }, organizationId: TEST_ORG_ID },
      select: { id: true },
    });
    const courseIds = courses.map((c) => c.id);
    if (courseIds.length > 0) {
      await prisma.courseModule.deleteMany({
        where: { courseId: { in: courseIds } },
      });
      await prisma.courseEnrollment.deleteMany({
        where: { courseId: { in: courseIds } },
      });
      await prisma.course.deleteMany({
        where: { id: { in: courseIds } },
      });
    }
    CLEANUP_COURSE_CODES.length = 0;
  }
});

describe("Extensible Competency Catalog & Course Authoring", () => {
  it("1. Existing competencies still load correctly", async () => {
    const result = await CompetencyService.getCompetencies(TEST_ORG_ID);
    expect(result.competencies.length).toBeGreaterThanOrEqual(7);

    const codes = result.competencies.map((c) => c.code);
    expect(codes).toContain("TECH-PY-01");
    expect(codes).toContain("TECH-JV-02");
    expect(codes).toContain("AI-ML-03");
    expect(codes).toContain("SOFT-COM-04");
    expect(codes).toContain("MGMT-LDR-05");
    expect(codes).toContain("DATA-SQL-06");
  });

  it("2. New Cloud Computing competency loads with full 5-level rubrics", async () => {
    const result = await CompetencyService.getCompetencies(TEST_ORG_ID);
    const cloudComp = result.competencies.find((c) => c.code === "TECH-CLD-08" || c.name === "Cloud Computing");
    expect(cloudComp).toBeDefined();
    expect(cloudComp?.name).toBe("Cloud Computing");
    expect(cloudComp?.category).toBe("Technical / Programming");
    expect(cloudComp?.levels.length).toBe(5);

    const l1 = cloudComp?.levels.find((l) => l.level === 1);
    const l5 = cloudComp?.levels.find((l) => l.level === 5);
    expect(l1).toBeDefined();
    expect(l5).toBeDefined();
  });

  it("3. Admin can select Cloud Computing and create course 'Cloud Basics' (CRS-CLOUD-301)", async () => {
    const cloudComp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID, code: "TECH-CLD-08" },
    });
    expect(cloudComp).toBeDefined();

    CLEANUP_COURSE_CODES.push("CRS-CLOUD-301");

    const createdCourse = await CourseService.createCourse(TEST_ORG_ID, {
      title: "Cloud Basics",
      code: "CRS-CLOUD-301",
      category: "Technical / Programming",
      competencyId: cloudComp!.id,
      targetLevel: 2,
      durationHours: 20,
      description: "Foundational cloud computing, virtualization, and infrastructure essentials.",
      status: "PUBLISHED",
      modules: [
        {
          order: 1,
          title: "Introduction to Cloud Computing & Virtualization",
          summary: "Core cloud service models (IaaS, PaaS, SaaS) and multi-tenant architectures.",
          durationMinutes: 120,
          learningObjectives: ["Understand cloud delivery models", "Differentiate private and public clouds"],
          overview: "Cloud computing fundamentals and elasticity.",
          keyConcepts: [
            {
              title: "Cloud Service Models",
              description: "Comparison of IaaS, PaaS, and SaaS responsibilities.",
            },
          ],
          practicalExercise: "Provision a virtual server instance with custom security group firewall rules.",
          competencyVerification: "Demonstrates working knowledge of cloud compute instances.",
        },
      ],
    });

    expect(createdCourse).toBeDefined();
    expect(createdCourse.id).toBeDefined();
    expect(createdCourse.title).toBe("Cloud Basics");
    expect(createdCourse.code).toBe("CRS-CLOUD-301");
    expect(createdCourse.competencyId).toBe(cloudComp!.id);
    expect(createdCourse.competency.name).toBe("Cloud Computing");
    expect(createdCourse.targetLevel).toBe(2);
    expect(createdCourse.durationHours).toBe(20);
    expect(createdCourse.modules.length).toBe(1);
  });

  it("4. Course creation fails if an invalid or non-existent competency ID is supplied", async () => {
    CLEANUP_COURSE_CODES.push("CRS-INVALID-999");

    await expect(
      CourseService.createCourse(TEST_ORG_ID, {
        title: "Invalid Course",
        code: "CRS-INVALID-999",
        category: "Technical",
        competencyId: "non-existent-comp-id-12345",
        targetLevel: 3,
        durationHours: 15,
        description: "Test description",
        status: "PUBLISHED",
        modules: [
          {
            order: 1,
            title: "Module 1",
            summary: "Summary",
            durationMinutes: 60,
            learningObjectives: ["Objective"],
            overview: "Overview",
            keyConcepts: [],
            practicalExercise: "Exercise",
            competencyVerification: "Verification",
          },
        ],
      })
    ).rejects.toThrow(CourseServiceError);
  });

  it("5. Verifies RBAC: only ADMIN can create/modify competencies in the catalog", () => {
    expect(hasPermission("ADMIN", "canCreateCompetency")).toBe(true);
    expect(hasPermission("MANAGER", "canCreateCompetency")).toBe(false);
    expect(hasPermission("EMPLOYEE", "canCreateCompetency")).toBe(false);
  });

  it("6. Existing course authoring continues to work seamlessly for Python", async () => {
    const pyComp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID, code: "TECH-PY-01" },
    });
    expect(pyComp).toBeDefined();

    CLEANUP_COURSE_CODES.push("CRS-TEST-PY-01");

    const course = await CourseService.createCourse(TEST_ORG_ID, {
      title: "Python Concurrency Essentials",
      code: "CRS-TEST-PY-01",
      category: "Technical / Programming",
      competencyId: pyComp!.id,
      targetLevel: 3,
      durationHours: 10,
      description: "Advanced async and multi-threaded programming in Python.",
      status: "PUBLISHED",
      modules: [
        {
          order: 1,
          title: "AsyncIO Event Loop",
          summary: "Cooperative multitasking and non-blocking I/O.",
          durationMinutes: 60,
          learningObjectives: ["Understand asyncio.gather"],
          overview: "Python AsyncIO architecture.",
          keyConcepts: [],
          practicalExercise: "Build an async crawler.",
          competencyVerification: "Verifies async Python competence.",
        },
      ],
    });

    expect(course.title).toBe("Python Concurrency Essentials");
    expect(course.competency.name).toBe("Python");
  });

  it("7. Existing course authoring continues to work seamlessly for Java", async () => {
    const jvComp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID, code: "TECH-JV-02" },
    });
    expect(jvComp).toBeDefined();

    CLEANUP_COURSE_CODES.push("CRS-TEST-JV-01");

    const course = await CourseService.createCourse(TEST_ORG_ID, {
      title: "Spring Boot Microservices Patterns",
      code: "CRS-TEST-JV-01",
      category: "Technical / Programming",
      competencyId: jvComp!.id,
      targetLevel: 4,
      durationHours: 25,
      description: "Building resilient distributed microservices with Spring Cloud.",
      status: "PUBLISHED",
      modules: [
        {
          order: 1,
          title: "Service Discovery & Gateway",
          summary: "Spring Cloud Gateway and Eureka routing.",
          durationMinutes: 90,
          learningObjectives: ["Configure API Gateway"],
          overview: "Spring Cloud architecture.",
          keyConcepts: [],
          practicalExercise: "Implement gateway filters.",
          competencyVerification: "Verifies Spring Boot competence.",
        },
      ],
    });

    expect(course.title).toBe("Spring Boot Microservices Patterns");
    expect(course.competency.name).toBe("Java");
  });

  it("8. Existing course authoring continues to work seamlessly for Machine Learning", async () => {
    const mlComp = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID, code: "AI-ML-03" },
    });
    expect(mlComp).toBeDefined();

    CLEANUP_COURSE_CODES.push("CRS-TEST-ML-01");

    const course = await CourseService.createCourse(TEST_ORG_ID, {
      title: "Feature Engineering at Scale",
      code: "CRS-TEST-ML-01",
      category: "Data & AI",
      competencyId: mlComp!.id,
      targetLevel: 4,
      durationHours: 18,
      description: "High-scale feature store and automated feature pipelines.",
      status: "PUBLISHED",
      modules: [
        {
          order: 1,
          title: "Feast Feature Store Integration",
          summary: "Point-in-time correct feature joins.",
          durationMinutes: 80,
          learningObjectives: ["Deploy Feast on Kubernetes"],
          overview: "Production feature pipelines.",
          keyConcepts: [],
          practicalExercise: "Create online feature service.",
          competencyVerification: "Verifies ML pipeline competence.",
        },
      ],
    });

    expect(course.title).toBe("Feature Engineering at Scale");
    expect(course.competency.name).toBe("Machine Learning");
  });

  it("9. Role learning service resolves Cloud Engineer designation to Cloud Computing requirement", async () => {
    const cloudScope = await RoleLearningService.resolveRoleScope(TEST_ORG_ID, "desig-cld");
    expect(cloudScope).not.toBeNull();
    expect(cloudScope?.designationTitle).toBe("Cloud Engineer");

    const reqComps = cloudScope?.requiredCompetencies.map((c) => c.competencyCode) || [];
    expect(reqComps).toContain("TECH-CLD-08"); // Cloud Computing
    expect(reqComps).toContain("TECH-OPS-10"); // DevOps
  });

  it("10. Enforces organization isolation when creating courses", async () => {
    const OTHER_ORG_ID = "org-other-tenant-test";
    CLEANUP_COURSE_CODES.push("CRS-CROSS-TENANT");

    // Attempt to create course in OTHER_ORG_ID with TEST_ORG_ID's competency ID
    const compInMainOrg = await prisma.competency.findFirst({
      where: { organizationId: TEST_ORG_ID, code: "TECH-CLD-08" },
    });

    await expect(
      CourseService.createCourse(OTHER_ORG_ID, {
        title: "Cross Tenant Course",
        code: "CRS-CROSS-TENANT",
        category: "Technical",
        competencyId: compInMainOrg!.id,
        targetLevel: 2,
        durationHours: 10,
        description: "Cross tenant test",
        status: "PUBLISHED",
        modules: [
          {
            order: 1,
            title: "Mod 1",
            summary: "Sum",
            durationMinutes: 30,
            learningObjectives: ["Obj"],
            overview: "Over",
            keyConcepts: [],
            practicalExercise: "Ex",
            competencyVerification: "Ver",
          },
        ],
      })
    ).rejects.toThrow("The specified competency does not exist in this organization.");
  });
});
