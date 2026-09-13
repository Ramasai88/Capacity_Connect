import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SkillGapService } from "@/lib/services/skill-gap.service";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { TOPIC_CONCEPTS } from "@/lib/assessment/exam-bank";

/**
 * GET /api/my-development
 * Secure employee self-service development profile.
 * - EMPLOYEE: Resolves strictly to authenticated session employeeId.
 * - Non-EMPLOYEE: Access denied with 403 Forbidden.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateApi(["EMPLOYEE"]);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { searchParams } = new URL(request.url);
    const requestedEmpId = searchParams.get("employeeId");

    let ownEmployeeId = auth.user?.employeeId;
    if (!ownEmployeeId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: auth.user!.id },
        select: { employeeId: true, email: true },
      });
      ownEmployeeId = dbUser?.employeeId ?? null;

      // Self-healing: Match employee profile by email within the authenticated organization
      if (!ownEmployeeId && (auth.user?.email || dbUser?.email) && auth.organizationId) {
        const userEmail = (auth.user?.email || dbUser?.email)!.toLowerCase().trim();
        const matchedEmployee = await prisma.employee.findFirst({
          where: {
            organizationId: auth.organizationId,
            email: { equals: userEmail, mode: "insensitive" },
          },
          select: { id: true },
        });

        if (matchedEmployee) {
          ownEmployeeId = matchedEmployee.id;
          await prisma.user.update({
            where: { id: auth.user!.id },
            data: { employeeId: ownEmployeeId },
          }).catch((err) => console.warn("Failed to persist resolved employeeId on user:", err));
        }
      }
    }

    if (requestedEmpId && requestedEmpId !== ownEmployeeId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You can only view your own development profile." } },
        { status: 403 }
      );
    }

    const targetEmployeeId = ownEmployeeId;

    if (!targetEmployeeId) {
      return NextResponse.json(
        { error: { code: "UNLINKED_EMPLOYEE", message: "User is not linked to an employee workforce profile. Please specify an employeeId parameter." } },
        { status: 400 }
      );
    }

    // 1. Fetch Employee Profile (Strictly Organization-Scoped)
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
    let rawRecommendations = await RecommendationService.getEmployeeRecommendations(
      auth.organizationId!,
      targetEmployeeId
    );

    // If no recommendations generated yet, automatically generate them from skill gaps
    if (rawRecommendations.length === 0) {
      try {
        rawRecommendations = await RecommendationService.generateRecommendationsForEmployee(
          auth.organizationId!,
          targetEmployeeId
        );
      } catch (recErr) {
        console.warn("Auto-generation of recommendations deferred:", recErr);
        rawRecommendations = [];
      }
    }

    const recommendations = (rawRecommendations || []).map((r) => ({
      id: r.id,
      competencyId: r.competencyId,
      competencyName: r.competency?.name || "Competency",
      competencyCategory: r.competency?.category || "General",
      priority: r.priority,
      confidenceScore: r.confidenceScore,
      scorePercentage: r.scorePercentage,
      weakTopics: r.weakTopics || [],
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

    const formattedEnrollments = (enrollments || []).map((enr) => {
      const totalModules = enr.course?.modules?.length || 0;
      const completedModules = (enr.moduleProgress || []).filter((mp) => mp.completed).length;
      return {
        id: enr.id,
        courseId: enr.courseId,
        courseTitle: enr.course?.title || "Untitled Course",
        courseCode: enr.course?.code || "",
        category: enr.course?.category || "General",
        targetLevel: enr.course?.targetLevel || 1,
        status: enr.status,
        progressPercent: enr.progressPercent,
        totalModules,
        completedModules,
        enrolledAt: enr.enrolledAt instanceof Date ? enr.enrolledAt.toISOString() : (enr.enrolledAt ? String(enr.enrolledAt) : new Date().toISOString()),
        completedAt: enr.completedAt instanceof Date ? enr.completedAt.toISOString() : (enr.completedAt ? String(enr.completedAt) : null),
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

    const formattedReassessments = (reassessments || []).map((r) => ({
      id: r.id,
      courseTitle: r.course?.title || "Course",
      competencyName: r.competency?.name || "Competency",
      previousLevel: r.previousLevel,
      requestedLevel: r.requestedLevel,
      status: r.status,
      submittedAt: r.submittedAt instanceof Date ? r.submittedAt.toISOString() : (r.submittedAt ? String(r.submittedAt) : new Date().toISOString()),
      reviewedAt: r.reviewedAt instanceof Date ? r.reviewedAt.toISOString() : (r.reviewedAt ? String(r.reviewedAt) : null),
      reviewerComments: r.reviewerComments,
    }));

    // 8. Competency Assessment History (Before vs Current comparison)
    const history = await prisma.competencyAssessmentHistory.findMany({
      where: { employeeId: targetEmployeeId },
      include: { competency: true },
      orderBy: { assessedAt: "desc" },
      take: 10,
    });

    // 9. Current Journey Stage Calculation
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
          joiningDate: employee.joiningDate instanceof Date ? employee.joiningDate.toISOString() : (employee.joiningDate ? String(employee.joiningDate) : null),
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
