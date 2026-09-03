import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { CourseService, CourseServiceError } from "@/lib/services/course.service";
import { updateCourseSchema } from "@/lib/validations/course";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/courses/:id
 * Retrieve single course with full curriculum modules.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const course = await CourseService.getCourseById(auth.organizationId!, params.id);

    if (!course) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: `Course with ID "${params.id}" was not found.` } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    console.error(`GET /api/courses/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve course." } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/courses/:id
 * Update course metadata or curriculum modules.
 * RBAC: ADMIN and MANAGER.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid update payload.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const updated = await CourseService.updateCourse(
      auth.organizationId!,
      params.id,
      parsed.data
    );

    return NextResponse.json({
      success: true,
      message: "Course updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof CourseServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, details: error.details } },
        { status: error.statusCode }
      );
    }

    console.error(`PATCH /api/courses/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update course." } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/:id
 * Delete course (blocked if active enrollments exist).
 * RBAC: ADMIN only.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await authenticateApi(["ADMIN"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const result = await CourseService.deleteCourse(auth.organizationId!, params.id);

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully.",
      data: result,
    });
  } catch (error: any) {
    if (error instanceof CourseServiceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }

    console.error(`DELETE /api/courses/${params.id} error:`, error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete course." } },
      { status: 500 }
    );
  }
}
