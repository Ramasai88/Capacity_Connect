import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  validateTrainerFile,
  validateFileMagicBytes,
  FILE_SIZE_LIMITS,
  DISALLOWED_EXTENSIONS,
} from "@/lib/validations/trainer-library-upload";
import { StorageService } from "@/lib/services/storage/storage.service";
import {
  TrainerLibraryService,
  TrainerLibraryServiceError,
} from "@/lib/services/trainer-library.service";
import { POST as uploadRoute } from "@/app/api/trainer/library/upload/route";
import { GET as fileRoute } from "@/app/api/trainer/library/files/[...key]/route";
import { getServerSession } from "next-auth";
import { vi } from "vitest";

// Mock next-auth for API route tests
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

const TEST_ORG_1 = "org-kl-university";
const TEST_ORG_2 = "org-state-power-corp";

let trainerEmpId: string;
let trainerUserId: string;
let traineeEmpId: string;
let traineeUserId: string;
let adminUserId: string;

const createdStorageKeys: string[] = [];

beforeAll(async () => {
  // Find or create Trainer User & Employee
  let trainerUser = await prisma.user.findFirst({
    where: { organizationId: TEST_ORG_1, role: "TRAINER" },
    include: { employee: true },
  });
  if (!trainerUser) {
    const createdEmp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `EMP-TRN-${Date.now()}`,
        name: "Upload Trainer",
        email: `trainer.upload.${Date.now()}@klu.edu`,
      },
    });
    trainerUser = await prisma.user.create({
      data: {
        email: createdEmp.email,
        name: createdEmp.name,
        role: "TRAINER",
        organizationId: TEST_ORG_1,
        approvalStatus: "APPROVED",
        isActivated: true,
        employeeId: createdEmp.id,
      },
      include: { employee: true },
    });
    trainerEmpId = createdEmp.id;
  } else {
    trainerEmpId = trainerUser.employeeId || (await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `EMP-TRN-${Date.now()}`,
        name: trainerUser.name,
        email: trainerUser.email,
      },
    })).id;
  }
  trainerUserId = trainerUser.id;

  // Find or create Trainee User & Employee
  let traineeUser = await prisma.user.findFirst({
    where: { organizationId: TEST_ORG_1, role: "TRAINEE" },
    include: { employee: true },
  });
  if (!traineeUser) {
    const createdTraineeEmp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `EMP-TNE-${Date.now()}`,
        name: "Upload Trainee",
        email: `trainee.upload.${Date.now()}@klu.edu`,
      },
    });
    traineeUser = await prisma.user.create({
      data: {
        email: createdTraineeEmp.email,
        name: createdTraineeEmp.name,
        role: "TRAINEE",
        organizationId: TEST_ORG_1,
        approvalStatus: "APPROVED",
        isActivated: true,
        employeeId: createdTraineeEmp.id,
      },
      include: { employee: true },
    });
    traineeEmpId = createdTraineeEmp.id;
  } else {
    traineeEmpId = traineeUser.employeeId || (await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `EMP-TNE-${Date.now()}`,
        name: traineeUser.name,
        email: traineeUser.email,
      },
    })).id;
  }
  traineeUserId = traineeUser.id;

  // Find or create Admin User
  let adminUser = await prisma.user.findFirst({
    where: { organizationId: TEST_ORG_1, role: "ADMIN" },
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: `admin.upload.${Date.now()}@klu.edu`,
        name: "Upload Admin",
        role: "ADMIN",
        organizationId: TEST_ORG_1,
        approvalStatus: "APPROVED",
        isActivated: true,
      },
    });
  }
  adminUserId = adminUser.id;
});

afterAll(async () => {
  // Clean up any remaining files created in tests
  for (const key of createdStorageKeys) {
    try {
      await StorageService.delete(key);
    } catch {
      // Ignore
    }
  }
});

describe("Phase 2 — Step 5B: Trainer Library File Upload & Storage", () => {
  describe("1. Validation & Magic Bytes Inspection", () => {
    it("accepts a valid PDF buffer with %PDF- header", () => {
      const pdfHeader = Buffer.from("%PDF-1.4\n%...\nstream\nendstream");
      const result = validateTrainerFile(
        pdfHeader,
        "syllabus.pdf",
        "application/pdf",
        "STUDY_MATERIAL"
      );

      expect(result.valid).toBe(true);
      expect(result.detectedFormat).toBe("PDF");
    });

    it("accepts a valid MP4 buffer with ftyp box", () => {
      const mp4Buffer = Buffer.concat([
        Buffer.from([0x00, 0x00, 0x00, 0x18]),
        Buffer.from("ftypmp42"),
        Buffer.alloc(50),
      ]);
      const result = validateTrainerFile(
        mp4Buffer,
        "intro-session.mp4",
        "video/mp4",
        "RECORDED_LECTURE"
      );

      expect(result.valid).toBe(true);
      expect(result.detectedFormat).toBe("MP4");
    });

    it("accepts a valid PPTX buffer with PK zip header", () => {
      const pptxBuffer = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.alloc(100),
      ]);
      const result = validateTrainerFile(
        pptxBuffer,
        "architecture.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "PRESENTATION"
      );

      expect(result.valid).toBe(true);
      expect(result.detectedFormat).toBe("PPTX");
    });

    it("rejects forbidden executable extensions (.exe, .php, .js, .html, .svg)", () => {
      const forbidden = ["malware.exe", "script.php", "payload.js", "page.html", "vector.svg"];
      for (const fn of forbidden) {
        const res = validateTrainerFile(
          Buffer.from("arbitrary content"),
          fn,
          "application/octet-stream",
          "STUDY_MATERIAL"
        );
        expect(res.valid).toBe(false);
        expect(res.error).toBeDefined();
      }
    });

    it("rejects mismatched file signatures (e.g. fake PDF containing HTML script)", () => {
      const fakePdf = Buffer.from("<script>alert('xss')</script>");
      const result = validateTrainerFile(
        fakePdf,
        "document.pdf",
        "application/pdf",
        "STUDY_MATERIAL"
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain("do not match the expected signature");
    });

    it("rejects files exceeding size limits", () => {
      const oversizedBuffer = Buffer.alloc(35 * 1024 * 1024);
      oversizedBuffer.write("%PDF-1.4");

      const oversizedStudy = validateTrainerFile(
        oversizedBuffer,
        "large-book.pdf",
        "application/pdf",
        "STUDY_MATERIAL"
      );
      expect(oversizedStudy.valid).toBe(false);
      expect(oversizedStudy.error).toContain("exceeds the maximum allowed limit of 30 MB");
    });
  });

  describe("2. Pluggable Storage Service (Local Adapter)", () => {
    it("uploads and verifies storage key organization isolation", async () => {
      const content = Buffer.from("%PDF-1.5 test document content for storage isolation");
      const storageKey = StorageService.generateStorageKey(TEST_ORG_1, "test-doc.pdf");
      createdStorageKeys.push(storageKey);

      expect(storageKey).toMatch(new RegExp(`^organizations/${TEST_ORG_1}/trainer-resources/`));

      const uploadResult = await StorageService.upload({
        organizationId: TEST_ORG_1,
        filename: "test-doc.pdf",
        buffer: content,
        mimeType: "application/pdf",
      });

      expect(uploadResult.storageKey).toBeDefined();
      expect(uploadResult.accessUrl).toContain("/api/trainer/library/files/");

      const exists = await StorageService.exists(uploadResult.storageKey);
      expect(exists).toBe(true);

      const streamResult = await StorageService.getStream(uploadResult.storageKey);
      expect(streamResult).toBeDefined();
      if (streamResult?.stream) {
        for await (const chunk of streamResult.stream) {
          expect(chunk.length).toBeGreaterThan(0);
        }
      }

      await StorageService.delete(uploadResult.storageKey);
      const afterDelete = await StorageService.exists(uploadResult.storageKey);
      expect(afterDelete).toBe(false);
    });
  });

  describe("3. TrainerLibraryService Upload & Compensation Rollback", () => {
    it("creates a TrainerResource record backed by real storage", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 Unit Test Real Storage Integration");
      const res = await TrainerLibraryService.createUploadedResource(
        TEST_ORG_1,
        trainerEmpId,
        {
          title: "Microservices Masterclass Notes",
          description: "Chapter 1 architecture overview",
          resourceType: "STUDY_MATERIAL",
          fileBuffer: pdfBuffer,
          originalFileName: "microservices-ch1.pdf",
          mimeType: "application/pdf",
          isPublished: true,
        },
        { actorId: trainerUserId, actorName: "Upload Trainer", actorRole: "TRAINER" }
      );

      expect(res.id).toBeDefined();
      expect(res.storageKey).toBeDefined();
      expect(res.mimeType).toBe("application/pdf");
      expect(res.originalFileName).toBe("microservices-ch1.pdf");
      expect(res.fileSizeBytes).toBe(pdfBuffer.length);

      createdStorageKeys.push(res.storageKey!);

      // Verify physical existence
      const exists = await StorageService.exists(res.storageKey!);
      expect(exists).toBe(true);
    });

    it("deleting an uploaded resource removes both DB record and storage object", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 File to be deleted");
      const res = await TrainerLibraryService.createUploadedResource(
        TEST_ORG_1,
        trainerEmpId,
        {
          title: "Temporary Study Material",
          description: "For deletion testing",
          resourceType: "STUDY_MATERIAL",
          fileBuffer: pdfBuffer,
          originalFileName: "temp.pdf",
          mimeType: "application/pdf",
          isPublished: false,
        },
        { actorId: trainerUserId, actorName: "Upload Trainer", actorRole: "TRAINER" }
      );

      const sKey = res.storageKey!;
      expect(await StorageService.exists(sKey)).toBe(true);

      // Delete
      await TrainerLibraryService.deleteResource(
        TEST_ORG_1,
        res.id,
        trainerEmpId,
        "TRAINER",
        { actorId: trainerUserId, actorName: "Upload Trainer", actorRole: "TRAINER" }
      );

      // Verify DB record is removed
      const dbCheck = await prisma.trainerResource.findUnique({ where: { id: res.id } });
      expect(dbCheck).toBeNull();

      // Verify storage file is removed
      expect(await StorageService.exists(sKey)).toBe(false);
    });

    it("deleting an external URL resource does NOT throw or attempt cloud deletion", async () => {
      const urlRes = await TrainerLibraryService.createResource(
        TEST_ORG_1,
        trainerEmpId,
        {
          title: "External Video Resource",
          description: "External cloud reference link",
          resourceType: "RECORDED_LECTURE",
          fileUrl: "https://example.com/videos/external-session.mp4",
          isPublished: true,
        },
        { actorId: trainerUserId, actorName: "Upload Trainer", actorRole: "TRAINER" }
      );

      expect(urlRes.storageKey).toBeNull();

      await expect(
        TrainerLibraryService.deleteResource(
          TEST_ORG_1,
          urlRes.id,
          trainerEmpId,
          "TRAINER",
          { actorId: trainerUserId, actorName: "Upload Trainer", actorRole: "TRAINER" }
        )
      ).resolves.not.toThrow();
    });
  });

  describe("4. API Routes & RBAC Authorization", () => {
    it("TRAINER can upload a file via POST /api/trainer/library/upload", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: {
          id: trainerUserId,
          name: "Upload Trainer",
          role: "TRAINER",
          organizationId: TEST_ORG_1,
          employeeId: trainerEmpId,
        },
      });

      const pdfBytes = Buffer.from("%PDF-1.4 Multipart Route Test Content");
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([pdfBytes], { type: "application/pdf" }),
        "route-test.pdf"
      );
      formData.append("title", "Multipart Upload Route Test");
      formData.append("resourceType", "STUDY_MATERIAL");
      formData.append("isPublished", "true");

      const req = new Request("http://localhost/api/trainer/library/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadRoute(req as any);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      expect(json.data.storageKey).toBeDefined();
      createdStorageKeys.push(json.data.storageKey);
    });

    it("ADMIN can also upload a file via POST /api/trainer/library/upload", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: {
          id: adminUserId,
          name: "Upload Admin",
          role: "ADMIN",
          organizationId: TEST_ORG_1,
        },
      });

      const pdfBytes = Buffer.from("%PDF-1.4 Admin Upload Test Content");
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([pdfBytes], { type: "application/pdf" }),
        "admin-guide.pdf"
      );
      formData.append("title", "Admin Training Guide");
      formData.append("resourceType", "PRESENTATION");
      formData.append("isPublished", "true");

      const req = new Request("http://localhost/api/trainer/library/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadRoute(req as any);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      createdStorageKeys.push(json.data.storageKey);
    });

    it("TRAINEE is forbidden from uploading via POST /api/trainer/library/upload (403)", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: {
          id: traineeUserId,
          name: "Upload Trainee",
          role: "TRAINEE",
          organizationId: TEST_ORG_1,
          employeeId: traineeEmpId,
        },
      });

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([Buffer.from("%PDF-1.4")], { type: "application/pdf" }),
        "trainee-test.pdf"
      );
      formData.append("title", "Trainee Attempt");

      const req = new Request("http://localhost/api/trainer/library/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadRoute(req as any);
      expect(res.status).toBe(403);
    });

    it("Unauthenticated request is rejected with 401", async () => {
      (getServerSession as any).mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.append(
        "file",
        new Blob([Buffer.from("%PDF-1.4")], { type: "application/pdf" }),
        "no-auth.pdf"
      );
      formData.append("title", "No Auth Attempt");

      const req = new Request("http://localhost/api/trainer/library/upload", {
        method: "POST",
        body: formData,
      });

      const res = await uploadRoute(req as any);
      expect(res.status).toBe(401);
    });
  });

  describe("5. Authorized File Access & Stream Protection", () => {
    let publishedStorageKey: string;
    let unpublishedStorageKey: string;

    beforeAll(async () => {
      // Create one published resource
      const pdfPub = Buffer.from("%PDF-1.4 Published File Access Content");
      const pubRes = await TrainerLibraryService.createUploadedResource(
        TEST_ORG_1,
        trainerEmpId,
        {
          title: "Authorized Published Syllabus",
          description: "Published syllabus document",
          resourceType: "STUDY_MATERIAL",
          fileBuffer: pdfPub,
          originalFileName: "published-syllabus.pdf",
          mimeType: "application/pdf",
          isPublished: true,
        },
        { actorId: trainerUserId, actorName: "Upload Trainer", actorRole: "TRAINER" }
      );
      publishedStorageKey = pubRes.storageKey!;
      createdStorageKeys.push(publishedStorageKey);

      // Create one unpublished draft resource
      const pdfDraft = Buffer.from("%PDF-1.4 Unpublished Draft Content");
      const draftRes = await TrainerLibraryService.createUploadedResource(
        TEST_ORG_1,
        trainerEmpId,
        {
          title: "Draft Unpublished Exam Notes",
          description: "Draft notes document",
          resourceType: "STUDY_MATERIAL",
          fileBuffer: pdfDraft,
          originalFileName: "draft-notes.pdf",
          mimeType: "application/pdf",
          isPublished: false,
        },
        { actorId: trainerUserId, actorName: "Upload Trainer", actorRole: "TRAINER" }
      );
      unpublishedStorageKey = draftRes.storageKey!;
      createdStorageKeys.push(unpublishedStorageKey);
    });

    it("Trainee in same org can stream a published resource file", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: {
          id: traineeUserId,
          role: "TRAINEE",
          organizationId: TEST_ORG_1,
        },
      });

      const keyParts = publishedStorageKey.split("/");
      const req = new Request(`http://localhost/api/trainer/library/files/${publishedStorageKey}`);
      const res = await fileRoute(req as any, { params: { key: keyParts } });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      expect(res.headers.get("cache-control")).toContain("private");
    });

    it("Trainee is forbidden (403) from streaming an unpublished resource", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: {
          id: traineeUserId,
          role: "TRAINEE",
          organizationId: TEST_ORG_1,
        },
      });

      const keyParts = unpublishedStorageKey.split("/");
      const req = new Request(`http://localhost/api/trainer/library/files/${unpublishedStorageKey}`);
      const res = await fileRoute(req as any, { params: { key: keyParts } });

      expect(res.status).toBe(403);
    });

    it("User from different tenant cannot access file (403)", async () => {
      (getServerSession as any).mockResolvedValueOnce({
        user: {
          id: "cross-tenant-user",
          role: "TRAINER",
          organizationId: TEST_ORG_2, // Different tenant
        },
      });

      const keyParts = publishedStorageKey.split("/");
      const req = new Request(`http://localhost/api/trainer/library/files/${publishedStorageKey}`);
      const res = await fileRoute(req as any, { params: { key: keyParts } });

      expect(res.status).toBe(403);
    });
  });
});
