import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import {
  PublishingService,
  PublishingServiceError,
} from "@/lib/services/publishing.service";
import { createPublishedPostSchema } from "@/lib/validations/publishing";
import { ZodError } from "zod";

/**
 * GET /api/admin/publishing
 * List published announcements, notifications, achievements, or featured content.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "TRAINER", "TRAINEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as any;
    const search = searchParams.get("search") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const result = await PublishingService.listPosts(
      auth.organizationId!,
      auth.user.role,
      false,
      { category, search, page, limit }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof PublishingServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/admin/publishing error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve published posts." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/publishing
 * Admin-only post authoring.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const validated = createPublishedPostSchema.parse(body);

    const post = await PublishingService.createPost(
      auth.organizationId!,
      auth.userId,
      validated,
      { actorId: auth.userId, actorName: auth.user.name, actorRole: auth.user.role }
    );

    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
    );
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
    console.error("POST /api/admin/publishing error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to publish post." } },
      { status: 500 }
    );
  }
}
