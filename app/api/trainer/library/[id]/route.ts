import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  TrainerLibraryService,
  TrainerLibraryServiceError,
} from "@/lib/services/trainer-library.service";
import { updateTrainerResourceSchema } from "@/lib/validations/trainer-library";
import { ZodError } from "zod";

/**
 * GET /api/trainer/library/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const resource = await TrainerLibraryService.getResourceById(
      auth.organizationId!,
      params.id,
      auth.user.role
    );

    return NextResponse.json({
      success: true,
      data: resource,
    });
  } catch (error: any) {
    if (error instanceof TrainerLibraryServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/trainer/library/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve trainer resource." } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/trainer/library/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const validated = updateTrainerResourceSchema.parse(body);

    const trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    const updated = await TrainerLibraryService.updateResource(
      auth.organizationId!,
      params.id,
      trainerEmployeeId,
      auth.user.role,
      validated,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.errors[0]?.message || "Validation failed", details: error.errors } },
        { status: 400 }
      );
    }
    if (error instanceof TrainerLibraryServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("PUT /api/trainer/library/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update trainer resource." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/trainer/library/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    const result = await TrainerLibraryService.deleteResource(
      auth.organizationId!,
      params.id,
      trainerEmployeeId,
      auth.user.role,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: "Trainer resource deleted successfully.",
    });
  } catch (error: any) {
    if (error instanceof TrainerLibraryServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/trainer/library/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete trainer resource." } },
      { status: 500 }
    );
  }
}
