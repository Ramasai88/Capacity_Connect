import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import {
  PublishingService,
  PublishingServiceError,
} from "@/lib/services/publishing.service";
import { updatePublishedPostSchema } from "@/lib/validations/publishing";
import { ZodError } from "zod";

/**
 * GET /api/admin/publishing/[id]
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

    const post = await PublishingService.getPostById(
      auth.organizationId!,
      params.id,
      auth.user.role
    );

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    if (error instanceof PublishingServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/admin/publishing/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve post." } },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/publishing/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const validated = updatePublishedPostSchema.parse(body);

    const updated = await PublishingService.updatePost(
      auth.organizationId!,
      params.id,
      auth.userId,
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
    if (error instanceof PublishingServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("PUT /api/admin/publishing/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update post." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/publishing/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const result = await PublishingService.deletePost(
      auth.organizationId!,
      params.id,
      auth.userId,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: "Post deleted successfully.",
    });
  } catch (error: any) {
    if (error instanceof PublishingServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/admin/publishing/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete post." } },
      { status: 500 }
    );
  }
}
