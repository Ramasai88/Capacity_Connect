import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SkillGapService } from "@/lib/services/skill-gap.service";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { TOPIC_CONCEPTS } from "@/lib/assessment/exam-bank";

/**
 * GET /api/my-development
 * Secure, role-aware, comprehensive individual employee skill development profile.
 * - EMPLOYEE: Resolves strictly to authenticated session employeeId.
 * - ADMIN / MANAGER: Can query self or an authorized employee in their organization via ?employeeId=...
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const requestedEmpId = searchParams.get("employeeId");

    let targetEmployeeId: string | null = null;

    if (auth.user?.role === "EMPLOYEE") {
      let ownEmployeeId = auth.user.employeeId;
      if (!ownEmployeeId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: auth.user.id },
          select: { employeeId: true },
        });
        ownEmployeeId = dbUser?.employeeId ?? null;
      }

      if (requestedEmpId && requestedEmpId !== ownEmployeeId) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You can only view your own development profile." } },
          { status: 403 }
        );
      }

      targetEmployeeId = ownEmployeeId;
    } else {
      // ADMIN or MANAGER: Use requested employeeId or personal employeeId if linked
      targetEmployeeId = requestedEmpId || auth.user?.employeeId || null;
    }

    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_EMPLOYEE", message: "User is not linked to an employee workforce profile. Please specify an employeeId parameter." } },
        { status: 400 }
      );
    }

    // 1. Fetch Employee Profile
    const employee = await prisma.employee.findFirst({
      where: {
        id: targetEmployeeId,
        organizationId: auth.organizationId!,
      },
      include: {
        designation: {
          include: {
            requirements: {
              include: { competency: true },
            },
          },
        },
        competencies: {
          include: { competency: true },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Employee profile not found in your organization." } },
        { status: 404 }
      );
    }

    // 2. Canonical Skill Gap Analysis
    const skillGapSummary = await SkillGapService.getEmployeeSkillGaps(
      auth.organizationId!,
      targetEmployeeId
    );

    // 3. Diagnostic Assessments
    const assessments = await prisma.skillAssessment.findMany({
      where: {
        organizationId: auth.organizationId!,
        employeeId: targetEmployeeId,
      },
      orderBy: { completedAt: "desc" },
    });

    const latestAssessment = assessments[0] || null;

    // 4. Focus Areas & Topic Concepts
    let focusAreas: Array<{
      topic: string;
      score: number;
      priority: "HIGH_PRIORITY" | "NEEDS_IMPROVEMENT";
      concepts: string[];
    }> = [];

    if (latestAssessment && Array.isArray(latestAssessment.topicBreakdown)) {
      const breakdown = latestAssessment.topicBreakdown as any[];
      focusAreas = breakdown
        .filter((t) => t.score < 60)
        .map((t) => ({
          topic: t.topic,
          score: t.score,
          priority: t.score < 40 ? "HIGH_PRIORITY" : "NEEDS_IMPROVEMENT",
          concepts: TOPIC_CONCEPTS[t.topic] || [
            "Core topic architecture and design patterns",
            "Error handling and edge cases",
            "Optimization techniques",
          ],
        }));
    }

    // 5. AI Recommendations
    const rawRecommendations = await RecommendationService.getEmployeeRecommendations(
      auth.organizationId!,
      targetEmployeeId
    );

    const recommendations = rawRecommendations.map((r) => ({
      id: r.id,
      competencyId: r.competencyId,
      competencyName: r.competency.name,
      competencyCategory: r.competency.category,
      priority: r.priority,
      confidenceScore: r.confidenceScore,
      scorePercentage: r.scorePercentage,
      weakTopics: r.weakTopics,
      reason: r.reason,
      courseId: r.courseId,
      course: r.course
        ? {
            id: r.course.id,
            title: r.course.title,
            code: r.course.code,
            durationHours: r.course.durationHours,
            modulesCount: r.course.modules?.length || 0,
          }
        : null,
    }));

    // 6. Course Enrollments & Progress
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        employeeId: targetEmployeeId,
      },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" },
            },
          },
        },
        moduleProgress: true,
      },
      orderBy: { enrolledAt: "desc" },
    });

    const formattedEnrollments = enrollments.map((enr) => {
      const totalModules = enr.course.modules.length;
      const completedModules = enr.moduleProgress.filter((mp) => mp.completed).length;
      return {
        id: enr.id,
        courseId: enr.courseId,
        courseTitle: enr.course.title,
        courseCode: enr.course.code,
        category: enr.course.category,
        targetLevel: enr.course.targetLevel,
        status: enr.status,
        progressPercent: enr.progressPercent,
        totalModules,
        completedModules,
        enrolledAt: enr.enrolledAt.toISOString(),
        completedAt: enr.completedAt?.toISOString() || null,
      };
    });

    // 7. Reassessments
    const reassessments = await prisma.reassessment.findMany({
      where: {
        organizationId: auth.organizationId!,
        employeeId: targetEmployeeId,
      },
      include: {
        course: true,
        competency: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const formattedReassessments = reassessments.map((r) => ({
      id: r.id,
      courseTitle: r.course.title,
      competencyName: r.competency.name,
      previousLevel: r.previousLevel,
      requestedLevel: r.requestedLevel,
      status: r.status,
      submittedAt: r.submittedAt.toISOString(),
      reviewedAt: r.reviewedAt?.toISOString() || null,
      reviewerComments: r.reviewerComments,
    }));

    // 8. Competency Assessment History (Before vs Current comparison)
    const history = await prisma.competencyAssessmentHistory.findMany({
      where: { employeeId: targetEmployeeId },
      include: { competency: true },
      orderBy: { assessedAt: "desc" },
      take: 10,
    });

    // 9. Current Journey Stage
    let currentStage = 1; // 1: Profile Created
    if (employee.designationId && (employee.designation?.requirements.length || 0) > 0) currentStage = 2; // Role Requirements Mapped
    if (assessments.length > 0) currentStage = 3; // Diagnostic Assessed
    if (skillGapSummary && skillGapSummary.needsImprovementCount > 0) currentStage = 4; // Skill Gaps Identified
    if (recommendations.length > 0) currentStage = 5; // AI Recommended
    if (formattedEnrollments.length > 0) currentStage = 6; // Active Learning
    if (formattedEnrollments.some((e) => e.progressPercent === 100)) currentStage = 7; // Course Completed
    if (reassessments.length > 0) currentStage = 8; // Reassessment Submitted
    if (reassessments.some((r) => r.status === "APPROVED")) currentStage = 9; // Verified & Level Calibrated

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          name: employee.name,
          email: employee.email,
          department: employee.department || "General",
          designationTitle: employee.designation?.title || "Unassigned",
          status: employee.status,
          joiningDate: employee.joiningDate?.toISOString() || null,
        },
        skillGapSummary,
        latestAssessment,
        assessmentsCount: assessments.length,
        focusAreas,
        recommendations,
        enrollments: formattedEnrollments,
        reassessments: formattedReassessments,
        history,
        currentStage,
      },
    });
  } catch (error: any) {
    console.error("GET /api/my-development error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to retrieve employee skill development data." } },
      { status: 500 }
    );
  }
}
