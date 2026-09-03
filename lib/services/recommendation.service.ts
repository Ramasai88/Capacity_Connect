import { prisma } from "@/lib/db/prisma";
import { calculateSkillGap, CompetencyGapResult } from "@/lib/skill-gap/calculateSkillGap";

export interface TopicBreakdownItem {
  topic: string;
  score: number; // percentage 0 - 100
  totalQuestions: number;
  correctQuestions: number;
}

export interface CreateAssessmentInput {
  organizationId: string;
  employeeId: string;
  competencyId: string;
  title: string;
  score: number;
  totalQuestions: number;
  correctQuestions: number;
  topicBreakdown: TopicBreakdownItem[];
  timeTakenMinutes?: number;
}

export interface RecommendationExplanation {
  topicScoreSummary: string;
  competencyStatusSummary: string;
  roleRequirementSummary: string;
  recommendationReason: string;
}

export class RecommendationEngine {
  /**
   * Evaluates priority and confidence based on assessment performance and skill gap.
   * Transparent Rule-Based scoring with ML-compatible feature vector extraction.
   */
  public static evaluatePriority(
    assessmentScore: number,
    gap: number,
    currentLevel: number,
    requiredLevel: number
  ): { priority: "HIGH" | "MEDIUM" | "LOW"; confidenceScore: number; reason: string } {
    let priority: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    let confidenceScore = 0.85;
    let reason = "";

    if (assessmentScore < 50 || (assessmentScore < 65 && gap >= 2)) {
      priority = "HIGH";
      confidenceScore = 0.92;
      reason = `Critical priority: Diagnostic assessment score was ${assessmentScore.toFixed(0)}%, while your current role requires Level ${requiredLevel} (current: Level ${currentLevel || 0}, gap: ${gap} level${gap > 1 ? "s" : ""}).`;
    } else if (assessmentScore < 75 || gap >= 1) {
      priority = "MEDIUM";
      confidenceScore = 0.88;
      reason = `Moderate priority: Diagnostic assessment score was ${assessmentScore.toFixed(0)}%. Closing your ${gap}-level gap will bring your competency up to the required Level ${requiredLevel}.`;
    } else {
      priority = "LOW";
      confidenceScore = 0.82;
      reason = `Skill enhancement: You demonstrated strong baseline competency (${assessmentScore.toFixed(0)}%). Advanced learning modules are recommended for mastery.`;
    }

    return { priority, confidenceScore, reason };
  }

  /**
   * ML Feature Extractor: Prepares normalized feature vectors for future ML training
   * when sufficient historical assessment and outcome records are accumulated.
   */
  public static extractMLFeatures(
    assessmentScore: number,
    topicScores: number[],
    currentLevel: number,
    requiredLevel: number,
    gap: number,
    completedCoursesCount: number
  ): Record<string, number> {
    const avgTopicScore =
      topicScores.length > 0
        ? topicScores.reduce((a, b) => a + b, 0) / topicScores.length
        : assessmentScore;
    const minTopicScore = topicScores.length > 0 ? Math.min(...topicScores) : assessmentScore;

    return {
      feat_assessment_score_norm: assessmentScore / 100,
      feat_avg_topic_score_norm: avgTopicScore / 100,
      feat_min_topic_score_norm: minTopicScore / 100,
      feat_current_level_norm: currentLevel / 5,
      feat_required_level_norm: requiredLevel / 5,
      feat_skill_gap: gap,
      feat_completed_courses: completedCoursesCount,
    };
  }
}

export class RecommendationService {
  /**
   * Record a new diagnostic skill assessment for an employee.
   */
  public static async recordAssessment(input: CreateAssessmentInput) {
    const assessment = await prisma.skillAssessment.create({
      data: {
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        competencyId: input.competencyId,
        title: input.title,
        score: input.score,
        totalQuestions: input.totalQuestions,
        correctQuestions: input.correctQuestions,
        topicBreakdown: input.topicBreakdown as any,
        timeTakenMinutes: input.timeTakenMinutes || 15,
      },
    });

    // Auto-generate fresh recommendations immediately
    await this.generateRecommendationsForEmployee(input.organizationId, input.employeeId);

    return assessment;
  }

  /**
   * Retrieve all assessments for an employee.
   */
  public static async getEmployeeAssessments(organizationId: string, employeeId: string) {
    return prisma.skillAssessment.findMany({
      where: { organizationId, employeeId },
      include: {
        competency: {
          select: { id: true, name: true, code: true, category: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });
  }

  /**
   * Generate recommendations by cross-referencing:
   * 1. Skill Assessment scores & topic breakdowns
   * 2. Designation baseline requirements & current competency levels (Skill Gap)
   * 3. Available published Courses in PostgreSQL
   */
  public static async generateRecommendationsForEmployee(organizationId: string, employeeId: string) {
    // 1. Fetch Employee with Designation requirements and Competency assessments
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
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
      throw new Error("Employee not found");
    }

    // 2. Fetch latest assessments for each competency
    const assessments = await prisma.skillAssessment.findMany({
      where: { organizationId, employeeId },
      orderBy: { completedAt: "desc" },
    });

    const latestAssessmentsByComp = new Map<string, typeof assessments[0]>();
    for (const a of assessments) {
      if (!latestAssessmentsByComp.has(a.competencyId)) {
        latestAssessmentsByComp.set(a.competencyId, a);
      }
    }

    // 3. Compute skill gaps using standard calculateSkillGap formula
    const requiredCompetencies = (employee.designation?.requirements || []).map((r) => ({
      competencyId: r.competencyId,
      competencyName: r.competency.name,
      category: r.competency.category,
      requiredLevel: r.requiredLevel,
    }));

    const currentCompetencies = employee.competencies.map((c) => ({
      competencyId: c.competencyId,
      currentLevel: c.currentLevel,
    }));

    const skillGaps = calculateSkillGap(requiredCompetencies, currentCompetencies);

    // 4. Fetch available published courses
    const courses = await prisma.course.findMany({
      where: { organizationId, status: "PUBLISHED" },
      include: { modules: { orderBy: { order: "asc" } } },
    });

    const recommendationsToCreate: Array<{
      organizationId: string;
      employeeId: string;
      competencyId: string;
      courseId?: string | null;
      priority: string;
      weakTopics: string[];
      scorePercentage?: number;
      currentLevel?: number;
      requiredLevel?: number;
      gap?: number;
      reason: string;
      confidenceScore: number;
    }> = [];

    // Analyze each required competency
    for (const gapItem of skillGaps) {
      const assessment = latestAssessmentsByComp.get(gapItem.competencyId);
      const score = assessment ? assessment.score : 0;
      const currentLevel = gapItem.currentLevel || 0;
      const requiredLevel = gapItem.requiredLevel;
      const gap = gapItem.gap;

      // Extract weak topics (< 60% score) from assessment topic breakdown
      let weakTopics: string[] = [];
      if (assessment && Array.isArray(assessment.topicBreakdown)) {
        const breakdown = assessment.topicBreakdown as unknown as TopicBreakdownItem[];
        weakTopics = breakdown.filter((t) => t.score < 60).map((t) => t.topic);
      }

      // If no weak topics extracted from breakdown, use generic competency focus
      if (weakTopics.length === 0) {
        weakTopics = [gapItem.competencyName];
      }

      // Find matching course for this competency
      const matchingCourse = courses.find((c) => c.competencyId === gapItem.competencyId);

      const evaluation = RecommendationEngine.evaluatePriority(
        assessment ? score : 45, // default to 45% if not yet assessed
        gap,
        currentLevel,
        requiredLevel
      );

      recommendationsToCreate.push({
        organizationId,
        employeeId,
        competencyId: gapItem.competencyId,
        courseId: matchingCourse ? matchingCourse.id : null,
        priority: evaluation.priority,
        weakTopics,
        scorePercentage: assessment ? score : undefined,
        currentLevel,
        requiredLevel,
        gap,
        reason: evaluation.reason,
        confidenceScore: evaluation.confidenceScore,
      });
    }

    // 5. Replace existing active recommendations for this employee
    await prisma.skillRecommendation.deleteMany({
      where: { organizationId, employeeId, status: "ACTIVE" },
    });

    if (recommendationsToCreate.length > 0) {
      await prisma.skillRecommendation.createMany({
        data: recommendationsToCreate,
      });
    }

    return prisma.skillRecommendation.findMany({
      where: { organizationId, employeeId },
      include: {
        competency: true,
        course: {
          include: {
            modules: { orderBy: { order: "asc" } },
          },
        },
      },
      orderBy: [
        { priority: "asc" }, // HIGH comes first alphabetically if sorted appropriately or custom handled
        { createdAt: "desc" },
      ],
    });
  }

  /**
   * Retrieve recommendations for an employee.
   */
  public static async getEmployeeRecommendations(organizationId: string, employeeId: string) {
    const recs = await prisma.skillRecommendation.findMany({
      where: { organizationId, employeeId },
      include: {
        competency: true,
        course: {
          include: {
            modules: { orderBy: { order: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Custom sort: HIGH -> MEDIUM -> LOW
    const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return recs.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
  }

  /**
   * Update recommendation status (e.g. ACCEPTED, DISMISSED).
   */
  public static async updateRecommendationStatus(
    organizationId: string,
    employeeId: string,
    recommendationId: string,
    status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "DISMISSED"
  ) {
    return prisma.skillRecommendation.updateMany({
      where: { id: recommendationId, organizationId, employeeId },
      data: { status },
    });
  }
}
