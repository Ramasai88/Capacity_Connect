import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { SkillGapService } from "@/lib/services/skill-gap.service";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { calculateSkillGap } from "@/lib/skill-gap/calculateSkillGap";
import { TOPIC_CONCEPTS } from "@/lib/assessment/exam-bank";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { PATCH as patchEmployee } from "@/app/api/employees/[id]/route";
import { PATCH as patchMyDevelopment } from "@/app/api/my-development/route";
import { traineeProfileUpdateSchema } from "@/lib/validations/employee";

vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

function createMockRequest(url: string, method: string, body?: any): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Individual Employee Skill Development Workflow", () => {
  let testOrgId: string;
  let otherOrgId: string;
  let testEmployeeId: string;
  let otherEmployeeId: string;
  let otherOrgEmployeeId: string;
  let competencyId: string;
  let designationId: string;

  let trainee1Session: any;
  let trainee2Session: any;
  let adminSession: any;

  beforeAll(async () => {
    // 1. Create Test Organization
    const org = await prisma.organization.create({
      data: {
        id: `org-dev-${Date.now()}`,
        name: "Skill Development Test Org",
        code: `DEV-ORG-${Date.now().toString(36).toUpperCase()}`,
        description: "Test Organization for Skill Development",
        industry: "Education",
      },
    });
    testOrgId = org.id;

    const org2 = await prisma.organization.create({
      data: {
        id: `org-dev-other-${Date.now()}`,
        name: "Other Tenant Org",
        code: `DEV-OTH-${Date.now().toString(36).toUpperCase()}`,
        description: "Other Test Organization",
        industry: "Finance",
      },
    });
    otherOrgId = org2.id;

    // 2. Create Competencies
    const comp1 = await prisma.competency.create({
      data: {
        organizationId: testOrgId,
        name: "Thread Synchronization",
        code: `COMP-TS-${Date.now().toString(36).toUpperCase()}`,
        category: "Technical / Programming",
        description: "Multithreading and sync primitives",
      },
    });
    competencyId = comp1.id;

    const comp2 = await prisma.competency.create({
      data: {
        organizationId: testOrgId,
        name: "AsyncIO Concurrency",
        code: `COMP-ASYNC-${Date.now().toString(36).toUpperCase()}`,
        category: "Technical / Programming",
        description: "Event loops and coroutines",
      },
    });

    // 3. Create Designation with requirements
    const desig = await prisma.designation.create({
      data: {
        organizationId: testOrgId,
        title: "Senior Backend Developer",
        code: `DESIG-SBD-${Date.now().toString(36).toUpperCase()}`,
        department: "Engineering",
        requirements: {
          create: [
            { competencyId: comp1.id, requiredLevel: 4, organizationId: testOrgId },
            { competencyId: comp2.id, requiredLevel: 4, organizationId: testOrgId },
          ],
        },
      },
    });
    designationId = desig.id;

    // 4. Create Main Test Employee (Trainee 1)
    const emp1 = await prisma.employee.create({
      data: {
        organizationId: testOrgId,
        employeeCode: `EMP-DEV-01-${Date.now().toString(36).toUpperCase()}`,
        name: "Dev Workflow Employee",
        email: `dev.emp1.${Date.now()}@example.com`,
        department: "Engineering",
        designationId: desig.id,
        status: "ACTIVE",
        competencies: {
          create: [
            { competencyId: comp1.id, currentLevel: 2, organizationId: testOrgId, assessedBy: "Manager Baseline" },
            { competencyId: comp2.id, currentLevel: 3, organizationId: testOrgId, assessedBy: "Manager Baseline" },
          ],
        },
      },
    });
    testEmployeeId = emp1.id;

    const user1 = await prisma.user.create({
      data: {
        organizationId: testOrgId,
        email: emp1.email,
        name: emp1.name,
        passwordHash: "$2a$10$fakepasswordhashfortesting123",
        role: "TRAINEE",
        employeeId: testEmployeeId,
      },
    });

    trainee1Session = {
      user: {
        id: user1.id,
        name: user1.name,
        email: user1.email,
        role: "TRAINEE",
        organizationId: testOrgId,
        employeeId: testEmployeeId,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    };

    // 5. Create Other Employee (Trainee 2) for isolation testing
    const emp2 = await prisma.employee.create({
      data: {
        organizationId: testOrgId,
        employeeCode: `EMP-DEV-02-${Date.now().toString(36).toUpperCase()}`,
        name: "Other Employee",
        email: `dev.emp2.${Date.now()}@example.com`,
        department: "Engineering",
        designationId: desig.id,
        status: "ACTIVE",
      },
    });
    otherEmployeeId = emp2.id;

    const user2 = await prisma.user.create({
      data: {
        organizationId: testOrgId,
        email: emp2.email,
        name: emp2.name,
        passwordHash: "$2a$10$fakepasswordhashfortesting123",
        role: "TRAINEE",
        employeeId: otherEmployeeId,
      },
    });

    trainee2Session = {
      user: {
        id: user2.id,
        name: user2.name,
        email: user2.email,
        role: "TRAINEE",
        organizationId: testOrgId,
        employeeId: otherEmployeeId,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    };

    // 6. Create Cross-Tenant Employee
    const empOtherOrg = await prisma.employee.create({
      data: {
        organizationId: otherOrgId,
        employeeCode: `EMP-DEV-OTH-${Date.now().toString(36).toUpperCase()}`,
        name: "Cross Tenant Employee",
        email: `dev.oth.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    otherOrgEmployeeId = empOtherOrg.id;

    // 7. Admin Session
    const adminUser = await prisma.user.create({
      data: {
        organizationId: testOrgId,
        email: `admin.dev.${Date.now()}@example.com`,
        name: "Dev Admin",
        passwordHash: "$2a$10$fakepasswordhashfortesting123",
        role: "ADMIN",
      },
    });

    adminSession = {
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: "ADMIN",
        organizationId: testOrgId,
      },
      expires: new Date(Date.now() + 3600000).toISOString(),
    };

    // 8. Record Diagnostic Assessment for Employee 1
    await RecommendationService.recordAssessment({
      organizationId: testOrgId,
      employeeId: testEmployeeId,
      competencyId: comp1.id,
      title: "Python Diagnostic Exam",
      score: 50,
      totalQuestions: 20,
      correctQuestions: 10,
      topicBreakdown: [
        { topic: "Thread Synchronization", score: 25, totalQuestions: 4, correctQuestions: 1 },
        { topic: "AsyncIO", score: 50, totalQuestions: 4, correctQuestions: 2 },
        { topic: "Variables", score: 100, totalQuestions: 4, correctQuestions: 4 },
      ],
      timeTakenMinutes: 15,
    });
  }, 30000);

  afterAll(async () => {
    // Cleanup created test records
    await prisma.organization.delete({
      where: { id: testOrgId },
    }).catch(() => {});
    await prisma.organization.delete({
      where: { id: otherOrgId },
    }).catch(() => {});
  }, 30000);

  it("calculates accurate canonical skill gaps for individual employee", async () => {
    const summary = await SkillGapService.getEmployeeSkillGaps(testOrgId, testEmployeeId);

    expect(summary).not.toBeNull();
    expect(summary!.employeeId).toBe(testEmployeeId);
    expect(summary!.totalRequired).toBe(2);
    expect(summary!.needsImprovementCount).toBe(2);
    expect(summary!.meetsRequirementCount).toBe(0);

    const tsGap = summary!.gaps.find((g) => g.competencyName === "Thread Synchronization");
    expect(tsGap).toBeDefined();
    expect(tsGap!.requiredLevel).toBe(4);
    expect(tsGap!.currentLevel).toBe(2);
    expect(tsGap!.gap).toBe(2);
    expect(tsGap!.status).toBe("NEEDS_IMPROVEMENT");

    const asyncGap = summary!.gaps.find((g) => g.competencyName === "AsyncIO Concurrency");
    expect(asyncGap).toBeDefined();
    expect(asyncGap!.requiredLevel).toBe(4);
    expect(asyncGap!.currentLevel).toBe(3);
    expect(asyncGap!.gap).toBe(1);
    expect(asyncGap!.status).toBe("NEEDS_IMPROVEMENT");
  });

  it("identifies focus areas and maps canonical study concepts from TOPIC_CONCEPTS", async () => {
    const assessment = await prisma.skillAssessment.findFirst({
      where: { organizationId: testOrgId, employeeId: testEmployeeId },
      orderBy: { completedAt: "desc" },
    });

    expect(assessment).not.toBeNull();
    const rawBreakdown = assessment!.topicBreakdown as any[];
    const weakTopics = rawBreakdown.filter((t) => t.score < 60);

    expect(weakTopics).toHaveLength(2);

    const threadSyncConcepts = TOPIC_CONCEPTS["Thread Synchronization"];
    expect(threadSyncConcepts).toBeDefined();
    expect(threadSyncConcepts).toContain("Python GIL (Global Interpreter Lock)");
    expect(threadSyncConcepts).toContain("Lock vs RLock (Reentrant Locks)");

    const asyncConcepts = TOPIC_CONCEPTS["AsyncIO"];
    expect(asyncConcepts).toBeDefined();
    expect(asyncConcepts).toContain("Event loop & cooperative multitasking");
  });

  it("recommends courses based on developmental gaps and diagnostic score", async () => {
    const recs = await RecommendationService.getEmployeeRecommendations(testOrgId, testEmployeeId);

    expect(recs.length).toBeGreaterThan(0);
    const topRec = recs[0];
    expect(topRec.priority).toBe("HIGH");
    expect(topRec.scorePercentage).toBe(50);
  });

  it("handles employee with no competencies or designation gracefully", async () => {
    const emptyEmp = await prisma.employee.create({
      data: {
        organizationId: testOrgId,
        employeeCode: `EMP-DEV-EMPTY-${Date.now().toString(36).toUpperCase()}`,
        name: "Empty Dev Employee",
        email: `dev.empty.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });

    const summary = await SkillGapService.getEmployeeSkillGaps(testOrgId, emptyEmp.id);
    expect(summary).not.toBeNull();
    expect(summary!.totalRequired).toBe(0);
    expect(summary!.gaps).toHaveLength(0);
    expect(summary!.designationTitle).toBe("Unassigned");

    const recs = await RecommendationService.getEmployeeRecommendations(testOrgId, emptyEmp.id);
    expect(recs).toEqual([]);
  });

  it("strictly enforces organization isolation for employee skill gap retrieval", async () => {
    const isolatedOrgId = `isolated-org-${Date.now()}`;
    await prisma.organization.create({
      data: {
        id: isolatedOrgId,
        name: "Isolated Org",
        code: `ISO-${Date.now().toString(36).toUpperCase()}`,
        industry: "Tech",
      },
    });

    try {
      const isolatedSummary = await SkillGapService.getEmployeeSkillGaps(isolatedOrgId, testEmployeeId);
      expect(isolatedSummary).toBeNull();
    } finally {
      await prisma.organization.delete({ where: { id: isolatedOrgId } }).catch(() => {});
    }
  });

  // ── Trainee Professional Profile Self-Service Tests (SIH Step 6A) ──────────

  describe("Trainee Professional Profile Self-Service RBAC & Security", () => {
    it("1. allows trainee to update own qualifications via PATCH /api/employees/[id]", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const qualificationsData = [
        { degree: "B.Tech in Computer Science", institution: "KL University", year: "2024", field: "AI" },
      ];

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        qualifications: qualificationsData,
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.qualifications).toEqual(qualificationsData);
    });

    it("2. allows trainee to update own workExperience via PATCH /api/employees/[id]", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const workExpData = [
        { role: "Junior Software Engineer", company: "Tech Solutions", duration: "1 year", description: "Built microservices" },
      ];

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        workExperience: workExpData,
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.workExperience).toEqual(workExpData);
    });

    it("3. allows trainee to update own interests via PATCH /api/employees/[id]", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const interestsData = ["Cloud Architecture", "Distributed Systems", "Machine Learning"];

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        interests: interestsData,
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.interests).toEqual(interestsData);
    });

    it("4. allows trainee to update own skills via PATCH /api/employees/[id]", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const skillsData = ["Python", "TypeScript", "PostgreSQL", "Docker"];

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        skills: skillsData,
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.skills).toEqual(skillsData);
    });

    it("5. allows trainee to update own certificates and bio via PATCH /api/my-development", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const certsData = [
        { title: "AWS Certified Developer", issuer: "Amazon Web Services", year: "2024", credentialUrl: "https://aws.cert/123" },
      ];
      const bioData = "Passionate backend engineer focusing on reliable distributed architectures.";

      const req = createMockRequest("/api/my-development", "PATCH", {
        certificates: certsData,
        bio: bioData,
      });

      const res = await patchMyDevelopment(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.certificates).toEqual(certsData);
      expect(json.data.bio).toBe(bioData);
    });

    it("6. rejects trainee attempt to update another trainee profile with 403 Forbidden", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const req = createMockRequest(`/api/employees/${otherEmployeeId}`, "PATCH", {
        skills: ["Hacked Skill"],
      });

      const res = await patchEmployee(req, { params: { id: otherEmployeeId } });
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("7. rejects trainee attempt to update cross-tenant employee profile with 403/404", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const req = createMockRequest(`/api/employees/${otherOrgEmployeeId}`, "PATCH", {
        skills: ["Cross Tenant Exploit"],
      });

      const res = await patchEmployee(req, { params: { id: otherOrgEmployeeId } });
      expect([403, 404]).toContain(res.status);
    });

    it("8. prevents trainee from escalating privileges (changing role, organizationId, email, or approvalStatus)", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        role: "ADMIN",
        organizationId: otherOrgId,
        email: "hacked.email@example.com",
        approvalStatus: "APPROVED",
        isActivated: true,
        skills: ["Legitimate Skill"],
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(200);

      // Verify the employee was updated ONLY for legitimate fields
      const updatedEmp = await prisma.employee.findUnique({
        where: { id: testEmployeeId },
      });
      expect(updatedEmp?.email).toBe(trainee1Session.user.email); // email unchanged
      expect(updatedEmp?.organizationId).toBe(testOrgId); // organizationId unchanged

      // Verify user record in User table was not escalated
      const updatedUser = await prisma.user.findUnique({
        where: { id: trainee1Session.user.id },
      });
      expect(updatedUser?.role).toBe("TRAINEE"); // role unchanged
    });

    it("9. validates profile payload and rejects invalid types with 400 Bad Request", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(trainee1Session);

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        skills: "not-an-array", // Invalid: skills must be array of strings
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("10. ensures existing ADMIN profile update flow still works", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(adminSession);

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        name: "Dev Workflow Employee (Admin Verified)",
        department: "Core Platform",
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.name).toBe("Dev Workflow Employee (Admin Verified)");
      expect(json.data.department).toBe("Core Platform");
    });

    it("11. rejects unauthenticated request with 401 Unauthorized", async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const req = createMockRequest(`/api/employees/${testEmployeeId}`, "PATCH", {
        skills: ["Skill"],
      });

      const res = await patchEmployee(req, { params: { id: testEmployeeId } });
      expect(res.status).toBe(401);
    });
  });
});

