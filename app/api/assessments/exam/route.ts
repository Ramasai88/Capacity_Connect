import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { getClientExam } from "@/lib/assessment/exam-bank";

/**
 * GET /api/assessments/exam
 * Returns client-safe diagnostic exam questions (NO correct answers exposed).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId") || "exam-python-advanced";

    const exam = getClientExam(examId);

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
