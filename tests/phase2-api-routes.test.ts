import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// Import Route Handlers
import { GET as getLibraryList, POST as createLibraryItem } from "@/app/api/trainer/library/route";
import {
  GET as getLibraryItem,
  PUT as updateLibraryItem,
  DELETE as deleteLibraryItem,
} from "@/app/api/trainer/library/[id]/route";

import { GET as getQuestionnaires, POST as createQuestionnaire } from "@/app/api/questionnaires/route";
import { GET as getQuestionnaire, PUT as updateQuestionnaire } from "@/app/api/questionnaires/[id]/route";
import { POST as publishQuestionnaire } from "@/app/api/questionnaires/[id]/publish/route";
import { POST as archiveQuestionnaire } from "@/app/api/questionnaires/[id]/archive/route";
import { POST as submitQuestionnaire } from "@/app/api/questionnaires/[id]/submit/route";
import { GET as getQuestionnaireAnalytics } from "@/app/api/questionnaires/[id]/analytics/route";

import { GET as getFeedback, POST as submitFeedback } from "@/app/api/feedback/route";

import { GET as getPosts, POST as createPost } from "@/app/api/admin/publishing/route";
import {
  GET as getPost,
  PUT as updatePost,
  DELETE as deletePost,
} from "@/app/api/admin/publishing/[id]/route";

import { GET as getTrainerProfile, PUT as updateTrainerProfile } from "@/app/api/trainer/profile/route";

vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

const TEST_ORG_1 = "org-kl-university";
const TEST_ORG_2 = "org-state-power-corp";

let adminUserSession: any;
let trainer1Session: any;
let trainer2Session: any;
let traineeSession: any;

let trainer1EmpId: string;
let trainer2EmpId: string;
let traineeEmpId: string;
let courseId: string;

function createMockRequest(url: string, method: string, body?: any): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeAll(async () => {
  // 1. Setup Trainer 1
  const trainerEmp1 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `TRN-API1-${Date.now()}`,
      name: "API Trainer One",
      email: `api.trainer1.${Date.now()}@klu.edu`,
      status: "ACTIVE",
    },
  });
  trainer1EmpId = trainerEmp1.id;

  const trainerUser1 = await prisma.user.create({
    data: {
      organizationId: TEST_ORG_1,
      email: trainerEmp1.email,
      name: trainerEmp1.name,
      passwordHash: "$2a$10$fakepasswordhashfortesting123",
      role: "TRAINER",
      employeeId: trainer1EmpId,
    },
  });

  trainer1Session = {
    user: {
      id: trainerUser1.id,
      name: trainerUser1.name,
      email: trainerUser1.email,
      role: "TRAINER",
      organizationId: TEST_ORG_1,
      employeeId: trainer1EmpId,
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };

  // 2. Setup Trainer 2
  const trainerEmp2 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `TRN-API2-${Date.now()}`,
      name: "API Trainer Two",
      email: `api.trainer2.${Date.now()}@klu.edu`,
      status: "ACTIVE",
    },
  });
  trainer2EmpId = trainerEmp2.id;

  const trainerUser2 = await prisma.user.create({
    data: {
      organizationId: TEST_ORG_1,
      email: trainerEmp2.email,
      name: trainerEmp2.name,
      passwordHash: "$2a$10$fakepasswordhashfortesting123",
      role: "TRAINER",
      employeeId: trainer2EmpId,
    },
  });

  trainer2Session = {
    user: {
      id: trainerUser2.id,
      name: trainerUser2.name,
      email: trainerUser2.email,
      role: "TRAINER",
      organizationId: TEST_ORG_1,
      employeeId: trainer2EmpId,
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };

  // 3. Setup Trainee
  const traineeEmp = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `TRN-APIEE-${Date.now()}`,
      name: "API Trainee One",
      email: `api.trainee1.${Date.now()}@klu.edu`,
      status: "ACTIVE",
    },
  });
  traineeEmpId = traineeEmp.id;

  const traineeUser = await prisma.user.create({
    data: {
      organizationId: TEST_ORG_1,
      email: traineeEmp.email,
      name: traineeEmp.name,
      passwordHash: "$2a$10$fakepasswordhashfortesting123",
      role: "TRAINEE",
      employeeId: traineeEmpId,
    },
  });

  traineeSession = {
    user: {
      id: traineeUser.id,
      name: traineeUser.name,
      email: traineeUser.email,
      role: "TRAINEE",
      organizationId: TEST_ORG_1,
      employeeId: traineeEmpId,
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };

  // 4. Setup Admin Session — create a real persisted User so PublishingService
  //    can find the admin by ID in the database.
  const adminEmail = `admin.apitest.${Date.now()}@klu.edu`;
  const adminUser = await prisma.user.create({
    data: {
      organizationId: TEST_ORG_1,
      email: adminEmail,
      name: "System Administrator",
      passwordHash: "$2a$10$fakepasswordhashfortesting123",
      role: "ADMIN",
    },
  });

  adminUserSession = {
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: "ADMIN",
      organizationId: TEST_ORG_1,
      employeeId: null,
    },
    expires: new Date(Date.now() + 3600000).toISOString(),
  };

  // 5. Setup Course
  const comp = await prisma.competency.findFirst({
    where: { organizationId: TEST_ORG_1 },
  });
  const course = await prisma.course.create({
    data: {
      organizationId: TEST_ORG_1,
      title: `API Test Course ${Date.now()}`,
      code: `CRS-API-${Date.now()}`,
      description: "API testing course",
      category: "Data & AI",
      competencyId: comp!.id,
      targetLevel: 2,
      durationHours: 8,
    },
  });
  courseId = course.id;
});

afterEach(() => {
  vi.mocked(getServerSession).mockReset();
});

describe("Phase 2 API Routes — RBAC, Sessions & Tenant Isolation", () => {
  let createdResourceId: string;
  let createdQuestionnaireId: string;
  let q1Id: string;
  let q2Id: string;
  let createdPostId: string;

  // =========================================================================
  // 1. Trainer Library API Tests
  // =========================================================================
  describe("1. Trainer Library API", () => {
    it("rejects unauthenticated requests with 401 Unauthorized", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      const req = createMockRequest("http://localhost:3000/api/trainer/library", "GET");
      const res = await getLibraryList(req);
      expect(res.status).toBe(401);
    });

    it("rejects TRAINEE mutation requests with 403 Forbidden", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest("http://localhost:3000/api/trainer/library", "POST", {
        title: "Trainee Upload Attempt",
        description: "Should fail",
        resourceType: "STUDY_MATERIAL",
        fileUrl: "https://example.com/doc.pdf",
      });
      const res = await createLibraryItem(req);
      expect(res.status).toBe(403);
    });

    it("allows TRAINER to create resource and derives trainerId from session", async () => {
      vi.mocked(getServerSession).mockResolvedValue(trainer1Session);
      const req = createMockRequest("http://localhost:3000/api/trainer/library", "POST", {
        title: "Microservices Architecture Video",
        description: "Hands-on architectural patterns recording",
        resourceType: "RECORDED_LECTURE",
        fileUrl: "https://storage.capacityconnect.internal/videos/microservices.mp4",
        fileSize: "520 MB",
        fileFormat: "MP4",
        courseId,
        isPublished: true,
      });
      const res = await createLibraryItem(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.trainerId).toBe(trainer1EmpId);
      createdResourceId = data.data.id;
    });

    it("enforces ownership: TRAINER 2 cannot modify TRAINER 1's resource", async () => {
      vi.mocked(getServerSession).mockResolvedValue(trainer2Session);
      const req = createMockRequest(
        `http://localhost:3000/api/trainer/library/${createdResourceId}`,
        "PUT",
        { title: "Hijacked Title" }
      );
      const res = await updateLibraryItem(req, { params: { id: createdResourceId } });
      expect(res.status).toBe(403);
    });

    it("TRAINEE can list library resources and sees only published resources", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest("http://localhost:3000/api/trainer/library", "GET");
      const res = await getLibraryList(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.resources.length).toBeGreaterThan(0);
      expect(data.data.resources.every((r: any) => r.isPublished === true)).toBe(true);
    });
  });

  // =========================================================================
  // 2. Questionnaires API Tests
  // =========================================================================
  describe("2. Questionnaires API", () => {
    it("rejects TRAINEE from creating questionnaires (403 Forbidden)", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest("http://localhost:3000/api/questionnaires", "POST", {
        title: "Trainee Quiz",
        description: "Should fail",
        questions: [{ questionText: "Q1", options: ["A", "B"], correctOption: 0 }],
      });
      const res = await createQuestionnaire(req);
      expect(res.status).toBe(403);
    });

    it("allows TRAINER to create questionnaire with MCQ questions", async () => {
      vi.mocked(getServerSession).mockResolvedValue(trainer1Session);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const req = createMockRequest("http://localhost:3000/api/questionnaires", "POST", {
        title: "Database Indexing & Query Tuning Quiz",
        description: "Evaluating knowledge of B-Tree indexes and execution plans",
        courseId,
        deadline: futureDate.toISOString(),
        durationMinutes: 25,
        passingScore: 70.0,
        questions: [
          {
            order: 1,
            questionText: "What index type is standard in PostgreSQL for equality and range queries?",
            options: ["Hash", "B-Tree", "GIN", "BRIN"],
            correctOption: 1, // B-Tree
            explanation: "B-Tree is the default index type in PostgreSQL.",
            points: 2,
          },
          {
            order: 2,
            questionText: "What command inspects the PostgreSQL query planner's execution path?",
            options: ["EXPLAIN ANALYZE", "INSPECT QUERY", "SHOW PLAN", "DEBUG SELECT"],
            correctOption: 0, // EXPLAIN ANALYZE
            explanation: "EXPLAIN ANALYZE executes the statement and displays runtime statistics.",
            points: 2,
          },
        ],
      });
      const res = await createQuestionnaire(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.status).toBe("DRAFT");
      expect(data.data.questions.length).toBe(2);

      createdQuestionnaireId = data.data.id;
      q1Id = data.data.questions[0].id;
      q2Id = data.data.questions[1].id;
    });

    it("TRAINEE cannot view DRAFT questionnaire", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}`,
        "GET"
      );
      const res = await getQuestionnaire(req, { params: { id: createdQuestionnaireId } });
      expect(res.status).toBe(403);
    });

    it("allows owning TRAINER to publish questionnaire", async () => {
      vi.mocked(getServerSession).mockResolvedValue(trainer1Session);
      const req = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}/publish`,
        "POST"
      );
      const res = await publishQuestionnaire(req, { params: { id: createdQuestionnaireId } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.status).toBe("PUBLISHED");
    });

    it("TRAINEE can view PUBLISHED questionnaire and answer keys are concealed", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}`,
        "GET"
      );
      const res = await getQuestionnaire(req, { params: { id: createdQuestionnaireId } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.hasAttempted).toBe(false);

      // Verify answer keys are completely omitted
      for (const q of data.data.questions) {
        expect(q.correctOption).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
    });

    it("TRAINEE submits responses with identity strictly derived from session", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}/submit`,
        "POST",
        {
          answers: [
            { questionId: q1Id, selectedOption: 1 }, // Correct = 2 pts
            { questionId: q2Id, selectedOption: 0 }, // Correct = 2 pts
          ],
          timeSpentMinutes: 10,
        }
      );
      const res = await submitQuestionnaire(req, { params: { id: createdQuestionnaireId } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.score).toBe(100);
      expect(data.data.isPassed).toBe(true);
      expect(data.data.earnedPoints).toBe(4);
    });

    it("rejects duplicate submission from the same trainee with 400 Bad Request", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}/submit`,
        "POST",
        {
          answers: [
            { questionId: q1Id, selectedOption: 1 },
            { questionId: q2Id, selectedOption: 0 },
          ],
        }
      );
      const res = await submitQuestionnaire(req, { params: { id: createdQuestionnaireId } });
      expect(res.status).toBe(400);
    });

    it("allows owning TRAINER to view analytics and blocks non-author TRAINER", async () => {
      // Owning trainer ok
      vi.mocked(getServerSession).mockResolvedValue(trainer1Session);
      const req1 = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}/analytics`,
        "GET"
      );
      const res1 = await getQuestionnaireAnalytics(req1, { params: { id: createdQuestionnaireId } });
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.data.metrics.submittedCount).toBe(1);
      expect(data1.data.metrics.averageScore).toBe(100);

      // Non-author trainer blocked
      vi.mocked(getServerSession).mockResolvedValue(trainer2Session);
      const req2 = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}/analytics`,
        "GET"
      );
      const res2 = await getQuestionnaireAnalytics(req2, { params: { id: createdQuestionnaireId } });
      expect(res2.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. Feedback API Tests
  // =========================================================================
  describe("3. Course Feedback API", () => {
    it("allows TRAINEE to submit feedback and derives trainee identity from session", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest("http://localhost:3000/api/feedback", "POST", {
        courseId,
        rating: 5,
        contentQuality: 5,
        trainerClarity: 5,
        applicability: 4,
        feedbackText: "Great practical course with real-world database exercises.",
        isAnonymous: true,
      });
      const res = await submitFeedback(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.rating).toBe(5);
      expect(data.data.isAnonymous).toBe(true);
    });

    it("rejects duplicate feedback submission with 400 Bad Request", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest("http://localhost:3000/api/feedback", "POST", {
        courseId,
        rating: 4,
      });
      const res = await submitFeedback(req);
      expect(res.status).toBe(400);
    });

    it("blocks TRAINEE from viewing aggregated feedback summaries (403 Forbidden)", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest(`http://localhost:3000/api/feedback?courseId=${courseId}`, "GET");
      const res = await getFeedback(req);
      expect(res.status).toBe(403);
    });

    it("allows ADMIN and TRAINER to view course feedback with anonymous masking", async () => {
      vi.mocked(getServerSession).mockResolvedValue(trainer1Session);
      const req = createMockRequest(`http://localhost:3000/api/feedback?courseId=${courseId}`, "GET");
      const res = await getFeedback(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.summary.totalReviews).toBe(1);
      expect(data.data.reviews[0].isAnonymous).toBe(true);
      expect(data.data.reviews[0].trainee.name).toBe("Anonymous Trainee");
      expect(data.data.reviews[0].trainee.email).toBeNull();
    });
  });

  // =========================================================================
  // 4. Admin Publishing API Tests
  // =========================================================================
  describe("4. Admin Publishing API", () => {
    it("rejects non-admin users from creating posts (403 Forbidden)", async () => {
      vi.mocked(getServerSession).mockResolvedValue(trainer1Session);
      const req = createMockRequest("http://localhost:3000/api/admin/publishing", "POST", {
        title: "Unauthorized Post",
        summary: "Should fail",
        content: "Content",
        category: "ANNOUNCEMENT",
      });
      const res = await createPost(req);
      expect(res.status).toBe(403);
    });

    it("allows ADMIN to publish announcements and highlights", async () => {
      vi.mocked(getServerSession).mockResolvedValue(adminUserSession);
      const req = createMockRequest("http://localhost:3000/api/admin/publishing", "POST", {
        title: "National Digital Capacity Initiative Launch",
        summary: "New curriculum modules and expert webinars announced.",
        content: "Full markdown description of the upcoming capacity building drive.",
        category: "ANNOUNCEMENT",
        priority: "HIGH",
        pinned: true,
        isPublished: true,
        targetRole: null, // All
      });
      const res = await createPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.title).toBe("National Digital Capacity Initiative Launch");
      createdPostId = data.data.id;
    });

    it("TRAINEE and TRAINER can view published posts via GET /api/admin/publishing", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest("http://localhost:3000/api/admin/publishing", "GET");
      const res = await getPosts(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.posts.length).toBeGreaterThan(0);
      const found = data.data.posts.find((p: any) => p.id === createdPostId);
      expect(found).toBeDefined();
    });

    it("ADMIN can update and delete published posts", async () => {
      vi.mocked(getServerSession).mockResolvedValue(adminUserSession);

      // Update
      const updateReq = createMockRequest(
        `http://localhost:3000/api/admin/publishing/${createdPostId}`,
        "PUT",
        { priority: "URGENT" }
      );
      const updateRes = await updatePost(updateReq, { params: { id: createdPostId } });
      expect(updateRes.status).toBe(200);

      // Delete
      const delReq = createMockRequest(
        `http://localhost:3000/api/admin/publishing/${createdPostId}`,
        "DELETE"
      );
      const delRes = await deletePost(delReq, { params: { id: createdPostId } });
      expect(delRes.status).toBe(200);
    });
  });

  // =========================================================================
  // 5. Trainer Profile API Tests
  // =========================================================================
  describe("5. Trainer Profile API", () => {
    it("rejects non-trainer users from GET /api/trainer/profile (403 Forbidden)", async () => {
      vi.mocked(getServerSession).mockResolvedValue(traineeSession);
      const req = createMockRequest("http://localhost:3000/api/trainer/profile", "GET");
      const res = await getTrainerProfile(req);
      expect(res.status).toBe(403);
    });

    it("allows TRAINER to view and update own profile", async () => {
      vi.mocked(getServerSession).mockResolvedValue(trainer1Session);

      // GET
      const getReq = createMockRequest("http://localhost:3000/api/trainer/profile", "GET");
      const getRes = await getTrainerProfile(getReq);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.data.id).toBe(trainer1EmpId);

      // PUT
      const putReq = createMockRequest("http://localhost:3000/api/trainer/profile", "PUT", {
        specializations: ["Distributed Systems", "Cloud Computing"],
        teachingDomains: ["PostgreSQL", "Kafka", "Go"],
        bio: "Senior technical trainer with 10+ years enterprise experience.",
      });
      const putRes = await updateTrainerProfile(putReq);
      expect(putRes.status).toBe(200);
      const putData = await putRes.json();
      expect(putData.data.specializations).toContain("Distributed Systems");
      expect(putData.data.bio).toContain("Senior technical trainer");
    });
  });

  // =========================================================================
  // 6. Cross-Tenant Protection Tests
  // =========================================================================
  describe("6. Cross-Tenant Protection", () => {
    it("rejects requests targeting resources from another organization", async () => {
      const crossOrgAdminSession = {
        user: {
          id: "foreign-admin-id",
          name: "Foreign Admin",
          email: "admin@foreign.org",
          role: "ADMIN",
          organizationId: TEST_ORG_2,
          employeeId: null,
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      };

      vi.mocked(getServerSession).mockResolvedValue(crossOrgAdminSession);
      const req = createMockRequest(
        `http://localhost:3000/api/questionnaires/${createdQuestionnaireId}`,
        "GET"
      );
      const res = await getQuestionnaire(req, { params: { id: createdQuestionnaireId } });
      expect(res.status).toBe(404);
    });
  });
});
