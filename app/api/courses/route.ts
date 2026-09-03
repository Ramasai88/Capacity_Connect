import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { CourseService, CourseServiceError } from "@/lib/services/course.service";
import { createCourseSchema, courseQuerySchema } from "@/lib/validations/course";

/**
 * GET /api/courses
 * List published/all courses with search, target level, and category filters.
 * RBAC: All authenticated users (ADMIN, MANAGER, EMPLOYEE).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsedQuery = courseQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters.",
            issues: parsedQuery.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const result = await CourseService.getCourses(auth.organizationId!, parsedQuery.data);

    return NextResponse.json({
      success: true,
      data: result.courses,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/courses error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve courses catalog." } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Create a new learning course with structured curriculum modules.
 * RBAC: ADMIN and MANAGER.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid course data.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const course = await CourseService.createCourse(auth.organizationId!, parsed.data);

    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully with modules.",
        data: course,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof CourseServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error("POST /api/courses error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create course." } },
      { status: 500 }
    );
  }
}
