import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  TrainerLibraryService,
  TrainerLibraryServiceError,
} from "@/lib/services/trainer-library.service";

const TEST_ORG_1 = "org-kl-university";
const TEST_ORG_2 = "org-state-power-corp";

let trainer1Id: string;
let trainer2Id: string;
let trainee1Id: string;
let course1Id: string;

beforeAll(async () => {
  // Find or use seed fixtures in TEST_ORG_1
  const trainerEmp1 = await prisma.employee.findFirst({
    where: { organizationId: TEST_ORG_1, user: { role: "TRAINER" } },
  });
  if (trainerEmp1) {
    trainer1Id = trainerEmp1.id;
  } else {
    const created = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `TRN-LIB-${Date.now()}`,
        name: "Library Trainer One",
        email: `lib.trainer1.${Date.now()}@klu.edu`,
      },
    });
    trainer1Id = created.id;
  }

  // Create second trainer for ownership tests
  const created2 = await prisma.employee.create({
    data: {
      organizationId: TEST_ORG_1,
      employeeCode: `TRN-LIB2-${Date.now()}`,
      name: "Library Trainer Two",
      email: `lib.trainer2.${Date.now()}@klu.edu`,
    },
  });
  trainer2Id = created2.id;

  // Trainee in TEST_ORG_1
  const traineeEmp = await prisma.employee.findFirst({
    where: { organizationId: TEST_ORG_1, user: { role: "TRAINEE" } },
  });
  if (traineeEmp) {
    trainee1Id = traineeEmp.id;
  } else {
    const createdTrainee = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_1,
        employeeCode: `TRN-EE-${Date.now()}`,
        name: "Library Trainee One",
        email: `lib.trainee1.${Date.now()}@klu.edu`,
      },
    });
    trainee1Id = createdTrainee.id;
  }

  // Course in TEST_ORG_1
  const course = await prisma.course.findFirst({
    where: { organizationId: TEST_ORG_1 },
  });
  if (course) {
    course1Id = course.id;
  }
});

describe("Phase 2: TrainerLibraryService Business Logic", () => {
  let createdResourceId: string;
  let unpublishedResourceId: string;

  it("1. Allows TRAINER to create recorded lecture and study material resources", async () => {
    const lecture = await TrainerLibraryService.createResource(
      TEST_ORG_1,
      trainer1Id,
      {
        title: "Deep Learning Neural Networks Lecture",
        description: "Comprehensive lecture recording on CNN architectures",
        resourceType: "RECORDED_LECTURE",
        fileUrl: "https://storage.capacityconnect.internal/videos/cnn-lecture.mp4",
        fileSize: "450 MB",
        fileFormat: "MP4",
        courseId: course1Id || undefined,
        isPublished: true,
      },
      { actorId: "trainer-user-1", actorName: "Library Trainer One", actorRole: "TRAINER" }
    );

    expect(lecture).toBeDefined();
    expect(lecture.id).toBeDefined();
    expect(lecture.title).toBe("Deep Learning Neural Networks Lecture");
    expect(lecture.resourceType).toBe("RECORDED_LECTURE");
    expect(lecture.trainerId).toBe(trainer1Id);
    expect(lecture.isPublished).toBe(true);
    createdResourceId = lecture.id;

    // Create an unpublished draft resource
    const draft = await TrainerLibraryService.createResource(
      TEST_ORG_1,
      trainer1Id,
      {
        title: "Draft Research Slide Deck",
        description: "Unpublished slides under preparation",
        resourceType: "PRESENTATION",
        fileUrl: "https://storage.capacityconnect.internal/slides/draft.pptx",
        fileSize: "15 MB",
        fileFormat: "PPTX",
        isPublished: false,
      }
    );
    unpublishedResourceId = draft.id;
    expect(draft.isPublished).toBe(false);
  });

  it("2. TRAINEE can only list published resources (unpublished hidden)", async () => {
    const traineeList = await TrainerLibraryService.listResources(
      TEST_ORG_1,
      {},
      "TRAINEE",
      trainee1Id
    );

    expect(traineeList.resources.length).toBeGreaterThan(0);
    const hasUnpublished = traineeList.resources.some((r) => !r.isPublished);
    expect(hasUnpublished).toBe(false);

    const foundCreated = traineeList.resources.find((r) => r.id === createdResourceId);
    expect(foundCreated).toBeDefined();

    const foundDraft = traineeList.resources.find((r) => r.id === unpublishedResourceId);
    expect(foundDraft).toBeUndefined();
  });

  it("3. TRAINER & ADMIN can view both published and unpublished resources", async () => {
    const trainerList = await TrainerLibraryService.listResources(
      TEST_ORG_1,
      {},
      "TRAINER",
      trainer1Id
    );

    const foundDraft = trainerList.resources.find((r) => r.id === unpublishedResourceId);
    expect(foundDraft).toBeDefined();
    expect(foundDraft?.isPublished).toBe(false);
  });

  it("4. Enforces ownership: TRAINER cannot update resources created by another trainer", async () => {
    await expect(
      TrainerLibraryService.updateResource(
        TEST_ORG_1,
        createdResourceId,
        trainer2Id, // different trainer
        "TRAINER",
        {
          title: "Hijacked Title Update Attempt",
        }
      )
    ).rejects.toThrow(TrainerLibraryServiceError);

    // Verify title remained unchanged
    const unchanged = await TrainerLibraryService.getResourceById(
      TEST_ORG_1,
      createdResourceId,
      "ADMIN"
    );
    expect(unchanged.title).toBe("Deep Learning Neural Networks Lecture");
  });

  it("5. Owner TRAINER and organization ADMIN can update the resource", async () => {
    // Owner trainer updates
    const updatedByOwner = await TrainerLibraryService.updateResource(
      TEST_ORG_1,
      createdResourceId,
      trainer1Id,
      "TRAINER",
      {
        description: "Updated description by author",
      }
    );
    expect(updatedByOwner.description).toBe("Updated description by author");

    // Admin updates
    const updatedByAdmin = await TrainerLibraryService.updateResource(
      TEST_ORG_1,
      createdResourceId,
      null,
      "ADMIN",
      {
        fileSize: "480 MB",
      }
    );
    expect(updatedByAdmin.fileSize).toBe("480 MB");
  });

  it("6. TRAINEE cannot update or delete resources (403 Forbidden)", async () => {
    await expect(
      TrainerLibraryService.updateResource(
        TEST_ORG_1,
        createdResourceId,
        trainee1Id,
        "TRAINEE",
        { title: "Trainee Modification" }
      )
    ).rejects.toThrow(TrainerLibraryServiceError);

    await expect(
      TrainerLibraryService.deleteResource(
        TEST_ORG_1,
        createdResourceId,
        trainee1Id,
        "TRAINEE"
      )
    ).rejects.toThrow(TrainerLibraryServiceError);
  });

  it("7. Strictly enforces multi-tenant organization isolation (Cross-tenant blocked)", async () => {
    // Querying resource from TEST_ORG_2 should fail with NOT_FOUND
    await expect(
      TrainerLibraryService.getResourceById(TEST_ORG_2, createdResourceId, "ADMIN")
    ).rejects.toThrow(TrainerLibraryServiceError);

    // Updating resource from wrong organization fails
    await expect(
      TrainerLibraryService.updateResource(
        TEST_ORG_2,
        createdResourceId,
        trainer1Id,
        "ADMIN",
        { title: "Cross Tenant Update" }
      )
    ).rejects.toThrow(TrainerLibraryServiceError);
  });

  it("8. Owner TRAINER or ADMIN can safely delete resource", async () => {
    const result = await TrainerLibraryService.deleteResource(
      TEST_ORG_1,
      unpublishedResourceId,
      trainer1Id,
      "TRAINER"
    );
    expect(result.success).toBe(true);

    // Verify deletion
    await expect(
      TrainerLibraryService.getResourceById(TEST_ORG_1, unpublishedResourceId, "ADMIN")
    ).rejects.toThrow(TrainerLibraryServiceError);
  });
});
