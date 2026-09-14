import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { getClientExam, getExamIdForRole } from "@/lib/assessment/exam-bank";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/assessments/exam
 * Returns client-safe diagnostic exam questions (NO correct answers exposed).
 * Dynamically resolves the exam scope tailored to the employee's assigned Job Role / Designation.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    let examId = searchParams.get("examId");

    // If examId not specified explicitly, resolve dynamically from authenticated employee's designation
    if (!examId) {
      let employeeId = auth.user?.employeeId;

      if (!employeeId && auth.user?.role === "EMPLOYEE") {
        const dbUser = await prisma.user.findUnique({
          where: { id: auth.user.id },
          select: { employeeId: true },
        });
        employeeId = dbUser?.employeeId ?? null;
      }

      if (employeeId) {
        const employee = await prisma.employee.findFirst({
          where: {
            id: employeeId,
            organizationId: auth.organizationId!,
          },
          include: {
            designation: {
              select: {
                code: true,
                title: true,
              },
            },
          },
        });

        if (employee?.designation) {
          examId = getExamIdForRole(employee.designation.code, employee.designation.title);
        }
      }
    }

    const resolvedExamId = examId || "exam-python-advanced";
    const exam = getClientExam(resolvedExamId);

    return NextResponse.json({
      success: true,
      exam,
    });
  } catch (error) {
    console.error("GET /api/assessments/exam error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to load exam questions." } },
      { status: 500 }
    );
  }
}
