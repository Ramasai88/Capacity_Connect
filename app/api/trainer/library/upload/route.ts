import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import { prisma } from "@/lib/db/prisma";
import {
  TrainerLibraryService,
  TrainerLibraryServiceError,
} from "@/lib/services/trainer-library.service";
import { ResourceType } from "@prisma/client";

/**
 * POST /api/trainer/library/upload
 *
 * Accepts multipart/form-data upload from TRAINER or ADMIN,
 * validates file integrity, stores object privately, and persists resource metadata.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = ((formData.get("title") as string) || "").trim();
    const rawDesc = formData.get("description") as string | null;
    const description = (rawDesc && rawDesc.trim()) ? rawDesc.trim() : title;
    const resourceType = (formData.get("resourceType") as ResourceType) || "STUDY_MATERIAL";
    const courseId = (formData.get("courseId") as string) || null;
    const competencyId = (formData.get("competencyId") as string) || null;
    const isPublishedStr = formData.get("isPublished") as string | null;
    const isPublished = isPublishedStr !== null ? isPublishedStr === "true" : true;

    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: { code: "MISSING_FILE", message: "A valid file is required for upload." } },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Resource title is required." } },
        { status: 400 }
      );
    }

    let trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    if (auth.user.role === "ADMIN" && formData.get("trainerId")) {
      trainerEmployeeId = formData.get("trainerId") as string;
    }

    if (!trainerEmployeeId && auth.user.role === "ADMIN") {
      const adminEmp = await prisma.employee.findFirst({
        where: { organizationId: auth.organizationId! },
      }) || (await prisma.employee.create({
        data: {
          organizationId: auth.organizationId!,
          name: auth.user.name || "Admin User",
          email: auth.user.email || `admin-${Date.now()}@capacityconnect.internal`,
          employeeCode: `ADM-${Date.now().toString().slice(-6)}`,
        },
      }));
      trainerEmployeeId = adminEmp.id;
    }

    if (!trainerEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_TRAINER", message: "User is not linked to a trainer employee profile." } },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resource = await TrainerLibraryService.createUploadedResource(
      auth.organizationId!,
      trainerEmployeeId,
      {
        title,
        description,
        resourceType,
        courseId,
        competencyId,
        isPublished,
        fileBuffer: buffer,
        originalFileName: file.name || "upload.bin",
        mimeType: file.type || "application/octet-stream",
      },
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    // Convert BigInt to number/string for JSON serialization
    const serializedResource = {
      ...resource,
      fileSizeBytes: resource.fileSizeBytes ? Number(resource.fileSizeBytes) : null,
    };

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded and resource published successfully.",
        data: serializedResource,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof TrainerLibraryServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/trainer/library/upload error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to upload trainer resource." } },
      { status: 500 }
    );
  }
}
