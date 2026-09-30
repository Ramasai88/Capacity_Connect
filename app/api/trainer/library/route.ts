import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { resolveEmployeeIdForUser } from "@/lib/auth/resolve-employee";
import {
  TrainerLibraryService,
  TrainerLibraryServiceError,
} from "@/lib/services/trainer-library.service";
import {
  createTrainerResourceSchema,
  trainerResourceQuerySchema,
} from "@/lib/validations/trainer-library";
import { ZodError } from "zod";

/**
 * GET /api/trainer/library
 * List trainer resources with role-aware visibility and filters.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, any> = {};
    searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    const parsedQuery = trainerResourceQuerySchema.parse(queryParams);

    const result = await TrainerLibraryService.listResources(
      auth.organizationId!,
      parsedQuery,
      auth.user.role,
      auth.userId
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid query parameters", details: error.errors } },
        { status: 400 }
      );
    }
    if (error instanceof TrainerLibraryServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/trainer/library error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve trainer library resources." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trainer/library
 * Create a new trainer resource.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const validated = createTrainerResourceSchema.parse(body);

    let trainerEmployeeId = await resolveEmployeeIdForUser(auth.user, auth.organizationId!);

    // If caller is ADMIN and specified trainerId in body or no employee profile linked, fallback
    if (auth.user.role === "ADMIN" && body.trainerId) {
      trainerEmployeeId = body.trainerId;
    }

    if (!trainerEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_TRAINER", message: "User is not linked to a trainer employee profile." } },
        { status: 400 }
      );
    }

    const resource = await TrainerLibraryService.createResource(
      auth.organizationId!,
      trainerEmployeeId,
      validated,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json(
      { success: true, data: resource },
      { status: 201 }
    );
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
    console.error("POST /api/trainer/library error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create trainer resource." } },
      { status: 500 }
    );
  }
}
