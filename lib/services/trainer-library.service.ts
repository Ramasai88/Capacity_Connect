import { prisma } from "@/lib/db/prisma";
import {
  CreateTrainerResourceInput,
  UpdateTrainerResourceInput,
  TrainerResourceQueryInput,
  createTrainerResourceSchema,
  updateTrainerResourceSchema,
} from "@/lib/validations/trainer-library";
import { validateTrainerFile } from "@/lib/validations/trainer-library-upload";
import { StorageService } from "./storage/storage.service";
import { AuditService } from "./audit.service";
import { UserRole, ResourceType } from "@prisma/client";

export class TrainerLibraryServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = "TRAINER_LIBRARY_ERROR") {
    super(message);
    this.name = "TrainerLibraryServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface ActorContext {
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: UserRole | string | null;
}

export class TrainerLibraryService {
  /**
   * List resources with role-aware visibility and multi-tenant organization scoping.
   */
  static async listResources(
    organizationId: string,
    filters: Partial<TrainerResourceQueryInput> = {},
    userRole?: UserRole | string | null,
    _userId?: string | null
  ) {
    if (!organizationId) {
      throw new TrainerLibraryServiceError("Organization ID is required", 400, "MISSING_ORG");
    }

    const {
      search,
      resourceType,
      courseId,
      competencyId,
      trainerId,
      isPublished,
      page = 1,
      limit = 50,
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = { organizationId };

    // Trainees can ONLY see published resources
    if (userRole === "TRAINEE") {
      where.isPublished = true;
    } else if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (competencyId) {
      where.competencyId = competencyId;
    }

    if (trainerId) {
      where.trainerId = trainerId;
    }

    if (search && search.trim().length > 0) {
      const s = search.trim();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
        { fileFormat: { contains: s, mode: "insensitive" } },
      ];
    }

    const [total, resources] = await Promise.all([
      prisma.trainerResource.count({ where }),
      prisma.trainerResource.findMany({
        where,
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeCode: true,
              department: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              category: true,
            },
          },
          competency: {
            select: {
              id: true,
              name: true,
              code: true,
              category: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      resources: resources.map((r) => this.serializeResource(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private static serializeResource<T extends Record<string, any>>(resource: T): T {
    if (!resource) return resource;
    return {
      ...resource,
      fileSizeBytes:
        resource.fileSizeBytes !== undefined && resource.fileSizeBytes !== null
          ? Number(resource.fileSizeBytes)
          : resource.fileSizeBytes,
    };
  }

  /**
   * Get single resource by ID with organization isolation.
   */
  static async getResourceById(
    organizationId: string,
    resourceId: string,
    userRole?: UserRole | string | null
  ) {
    const resource = await prisma.trainerResource.findFirst({
      where: {
        id: resourceId,
        organizationId,
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
            department: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            category: true,
          },
        },
        competency: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
          },
        },
      },
    });

    if (!resource) {
      throw new TrainerLibraryServiceError("Trainer resource not found", 404, "NOT_FOUND");
    }

    if (userRole === "TRAINEE" && !resource.isPublished) {
      throw new TrainerLibraryServiceError("Trainer resource is not published", 403, "FORBIDDEN");
    }

    return this.serializeResource(resource);
  }

  /**
   * Create a new trainer resource.
   */
  static async createResource(
    organizationId: string,
    trainerId: string,
    input: CreateTrainerResourceInput,
    actorContext?: ActorContext
  ) {
    if (!organizationId) {
      throw new TrainerLibraryServiceError("Organization ID is required", 400, "MISSING_ORG");
    }

    const validated = createTrainerResourceSchema.parse(input);

    // Verify trainer belongs to organization
    const trainer = await prisma.employee.findFirst({
      where: {
        id: trainerId,
        organizationId,
      },
    });

    if (!trainer) {
      throw new TrainerLibraryServiceError(
        "Trainer profile not found in organization",
        404,
        "TRAINER_NOT_FOUND"
      );
    }

    // If courseId is provided, verify it belongs to organization
    if (validated.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: validated.courseId, organizationId },
      });
      if (!course) {
        throw new TrainerLibraryServiceError("Linked course not found", 404, "COURSE_NOT_FOUND");
      }
    }

    // If competencyId is provided, verify it belongs to organization
    if (validated.competencyId) {
      const comp = await prisma.competency.findFirst({
        where: { id: validated.competencyId, organizationId },
      });
      if (!comp) {
        throw new TrainerLibraryServiceError("Linked competency not found", 404, "COMPETENCY_NOT_FOUND");
      }
    }

    const resource = await prisma.trainerResource.create({
      data: {
        organizationId,
        trainerId,
        title: validated.title,
        description: validated.description,
        resourceType: validated.resourceType,
        fileUrl: validated.fileUrl,
        fileSize: validated.fileSize ?? null,
        fileFormat: validated.fileFormat ?? null,
        courseId: validated.courseId ?? null,
        competencyId: validated.competencyId ?? null,
        isPublished: validated.isPublished ?? true,
      },
      include: {
        trainer: {
          select: { id: true, name: true, email: true, employeeCode: true },
        },
        course: { select: { id: true, title: true, code: true } },
        competency: { select: { id: true, name: true, code: true } },
      },
    });

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: actorContext?.actorName ?? trainer.name,
      actorRole: (actorContext?.actorRole as UserRole) ?? "TRAINER",
      action: "TRAINER_RESOURCE_CREATED",
      category: "TRAINER_OPERATION",
      targetId: resource.id,
      targetName: resource.title,
      description: `Created trainer resource '${resource.title}' (${resource.resourceType})`,
      metadata: {
        resourceType: resource.resourceType,
        courseId: resource.courseId,
        isPublished: resource.isPublished,
      },
    });

    return this.serializeResource(resource);
  }

  /**
   * Update an existing trainer resource with strict ownership & RBAC enforcement.
   */
  static async updateResource(
    organizationId: string,
    resourceId: string,
    trainerEmployeeId: string | null | undefined,
    userRole: UserRole | string,
    input: UpdateTrainerResourceInput,
    actorContext?: ActorContext
  ) {
    const validated = updateTrainerResourceSchema.parse(input);

    const existing = await prisma.trainerResource.findFirst({
      where: {
        id: resourceId,
        organizationId,
      },
    });

    if (!existing) {
      throw new TrainerLibraryServiceError("Trainer resource not found", 404, "NOT_FOUND");
    }

    // Role ownership check: Trainers can ONLY edit their own resources
    if (userRole === "TRAINER" && existing.trainerId !== trainerEmployeeId) {
      throw new TrainerLibraryServiceError(
        "You can only edit resources that you have uploaded",
        403,
        "FORBIDDEN"
      );
    }

    // Trainees cannot edit resources
    if (userRole === "TRAINEE") {
      throw new TrainerLibraryServiceError(
        "Trainees do not have permission to modify resources",
        403,
        "FORBIDDEN"
      );
    }

    // If courseId is provided, verify it belongs to organization
    if (validated.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: validated.courseId, organizationId },
      });
      if (!course) {
        throw new TrainerLibraryServiceError("Linked course not found", 404, "COURSE_NOT_FOUND");
      }
    }

    // If competencyId is provided, verify it belongs to organization
    if (validated.competencyId) {
      const comp = await prisma.competency.findFirst({
        where: { id: validated.competencyId, organizationId },
      });
      if (!comp) {
        throw new TrainerLibraryServiceError("Linked competency not found", 404, "COMPETENCY_NOT_FOUND");
      }
    }

    const updated = await prisma.trainerResource.update({
      where: { id: resourceId },
      data: {
        ...(validated.title !== undefined ? { title: validated.title } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
        ...(validated.resourceType !== undefined ? { resourceType: validated.resourceType } : {}),
        ...(validated.fileUrl !== undefined ? { fileUrl: validated.fileUrl } : {}),
        ...(validated.fileSize !== undefined ? { fileSize: validated.fileSize } : {}),
        ...(validated.fileFormat !== undefined ? { fileFormat: validated.fileFormat } : {}),
        ...(validated.courseId !== undefined ? { courseId: validated.courseId } : {}),
        ...(validated.competencyId !== undefined ? { competencyId: validated.competencyId } : {}),
        ...(validated.isPublished !== undefined ? { isPublished: validated.isPublished } : {}),
      },
      include: {
        trainer: {
          select: { id: true, name: true, email: true, employeeCode: true },
        },
        course: { select: { id: true, title: true, code: true } },
        competency: { select: { id: true, name: true, code: true } },
      },
    });

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: actorContext?.actorName ?? "Trainer",
      actorRole: (actorContext?.actorRole as UserRole) ?? (userRole as UserRole),
      action: "TRAINER_RESOURCE_UPDATED",
      category: "TRAINER_OPERATION",
      targetId: updated.id,
      targetName: updated.title,
      description: `Updated trainer resource '${updated.title}'`,
      metadata: {
        resourceType: updated.resourceType,
        isPublished: updated.isPublished,
      },
    });

    return this.serializeResource(updated);
  }

  /**
   * Delete a trainer resource with strict ownership & RBAC enforcement.
   */
  static async deleteResource(
    organizationId: string,
    resourceId: string,
    trainerEmployeeId: string | null | undefined,
    userRole: UserRole | string,
    actorContext?: ActorContext
  ) {
    const existing = await prisma.trainerResource.findFirst({
      where: {
        id: resourceId,
        organizationId,
      },
    });

    if (!existing) {
      throw new TrainerLibraryServiceError("Trainer resource not found", 404, "NOT_FOUND");
    }

    // Role ownership check: Trainers can ONLY delete their own resources
    if (userRole === "TRAINER" && existing.trainerId !== trainerEmployeeId) {
      throw new TrainerLibraryServiceError(
        "You can only delete resources that you have uploaded",
        403,
        "FORBIDDEN"
      );
    }

    // Trainees cannot delete resources
    if (userRole === "TRAINEE") {
      throw new TrainerLibraryServiceError(
        "Trainees do not have permission to delete resources",
        403,
        "FORBIDDEN"
      );
    }

    await prisma.trainerResource.delete({
      where: { id: resourceId },
    });

    // Clean up stored object from storage provider if present
    if (existing.storageKey) {
      await StorageService.delete(existing.storageKey);
    }

    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: actorContext?.actorName ?? "Trainer",
      actorRole: (actorContext?.actorRole as UserRole) ?? (userRole as UserRole),
      action: "TRAINER_RESOURCE_DELETED",
      category: "TRAINER_OPERATION",
      targetId: existing.id,
      targetName: existing.title,
      description: `Deleted trainer resource '${existing.title}'`,
    });

    return { success: true, deletedId: resourceId };
  }

  /**
   * Create a new uploaded trainer resource with storage persistence and compensation rollback.
   */
  static async createUploadedResource(
    organizationId: string,
    trainerId: string,
    params: {
      title: string;
      description: string;
      resourceType: ResourceType;
      courseId?: string | null;
      competencyId?: string | null;
      isPublished?: boolean;
      fileBuffer: Buffer;
      originalFileName: string;
      mimeType: string;
    },
    actorContext?: ActorContext
  ) {
    if (!organizationId) {
      throw new TrainerLibraryServiceError("Organization ID is required", 400, "MISSING_ORG");
    }

    // 1. Verify trainer exists in organization
    const trainer = await prisma.employee.findFirst({
      where: { id: trainerId, organizationId },
    });

    if (!trainer) {
      throw new TrainerLibraryServiceError(
        "Trainer profile not found in organization",
        404,
        "TRAINER_NOT_FOUND"
      );
    }

    // 2. Validate course & competency links
    if (params.courseId) {
      const course = await prisma.course.findFirst({
        where: { id: params.courseId, organizationId },
      });
      if (!course) {
        throw new TrainerLibraryServiceError("Linked course not found", 404, "COURSE_NOT_FOUND");
      }
    }

    if (params.competencyId) {
      const comp = await prisma.competency.findFirst({
        where: { id: params.competencyId, organizationId },
      });
      if (!comp) {
        throw new TrainerLibraryServiceError("Linked competency not found", 404, "COMPETENCY_NOT_FOUND");
      }
    }

    // 3. Validate File
    const validation = validateTrainerFile(
      params.fileBuffer,
      params.originalFileName,
      params.mimeType,
      params.resourceType as any
    );

    if (!validation.valid) {
      throw new TrainerLibraryServiceError(
        validation.error || "Invalid file",
        400,
        "INVALID_FILE"
      );
    }

    // 4. Upload to storage provider
    const uploadResult = await StorageService.upload({
      organizationId,
      filename: params.originalFileName,
      buffer: params.fileBuffer,
      mimeType: validation.detectedMimeType || params.mimeType,
    });

    // 5. Persist to database with compensation error handling
    let createdResource;
    try {
      createdResource = await prisma.trainerResource.create({
        data: {
          organizationId,
          trainerId,
          title: params.title.trim(),
          description: params.description.trim(),
          resourceType: params.resourceType,
          fileUrl: uploadResult.accessUrl,
          fileSize: uploadResult.fileSizeFormatted,
          fileSizeBytes: BigInt(uploadResult.fileSizeBytes),
          fileFormat: validation.detectedFormat || null,
          mimeType: validation.detectedMimeType || params.mimeType,
          originalFileName: params.originalFileName,
          storageKey: uploadResult.storageKey,
          courseId: params.courseId ?? null,
          competencyId: params.competencyId ?? null,
          isPublished: params.isPublished ?? true,
        },
        include: {
          trainer: {
            select: { id: true, name: true, email: true, employeeCode: true },
          },
          course: { select: { id: true, title: true, code: true } },
          competency: { select: { id: true, name: true, code: true } },
        },
      });
    } catch (dbError: any) {
      // Compensation Pattern: Clean up uploaded storage object on database failure
      console.error("[TrainerLibraryService] DB creation failed, compensating by deleting uploaded object:", dbError);
      await StorageService.delete(uploadResult.storageKey);
      throw new TrainerLibraryServiceError(
        "Failed to record uploaded file metadata in database.",
        500,
        "PERSISTENCE_FAILED"
      );
    }

    // 6. Audit Log
    await AuditService.log({
      organizationId,
      actorId: actorContext?.actorId ?? null,
      actorName: actorContext?.actorName ?? trainer.name,
      actorRole: (actorContext?.actorRole as UserRole) ?? "TRAINER",
      action: "TRAINER_RESOURCE_UPLOADED",
      category: "TRAINER_OPERATION",
      targetId: createdResource.id,
      targetName: createdResource.title,
      description: `Uploaded and published trainer resource '${createdResource.title}' (${createdResource.resourceType}, ${uploadResult.fileSizeFormatted})`,
      metadata: {
        resourceType: createdResource.resourceType,
        fileFormat: createdResource.fileFormat,
        fileSizeBytes: uploadResult.fileSizeBytes,
        storageKey: uploadResult.storageKey,
        isPublished: createdResource.isPublished,
      },
    });

    return this.serializeResource(createdResource);
  }
}

