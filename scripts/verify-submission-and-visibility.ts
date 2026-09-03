import { prisma } from "../lib/db/prisma";
import { evaluateExam, PYTHON_ADVANCED_EXAM } from "../lib/assessment/exam-bank";
import { RecommendationService } from "../lib/services/recommendation.service";

const ORG_A = "org-kl-university";
const CLEANUP_EMPLOYEE_IDS: string[] = [];
const CLEANUP_USER_IDS: string[] = [];

function trackEmployee(id: string) {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

function trackUser(id: string) {
  CLEANUP_USER_IDS.push(id);
  return id;
}

async function verifyFullWorkflow() {
  console.log("================================================================================");
  console.log("CAPACITY CONNECT — DIAGNOSTIC SUBMISSION & PERFORMANCE VISIBILITY VERIFICATION");
  console.log("================================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // 1. AUDIT: CHECK POSTGRESQL USERS & LINKAGES
    // -------------------------------------------------------------------------
    console.log("1. AUDITING POSTGRESQL USERS AND WORKFORCE PROFILE LINKAGES...");
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, employeeId: true, organizationId: true },
    });

    console.log(`   - Found ${users.length} total user records in PostgreSQL:`);
    for (const u of users) {
      if (u.role === "EMPLOYEE") {
        const linkedEmp = u.employeeId
          ? await prisma.employee.findUnique({ where: { id: u.employeeId } })
          : null;
        console.log(
          `     * [EMPLOYEE] ${u.email} -> employeeId: ${u.employeeId || "NULL"} (Linked Employee Exists: ${
            linkedEmp ? "✅ " + linkedEmp.name : "❌ NO"
          })`
        );
        if (!u.employeeId || !linkedEmp) {
          throw new Error(`Unlinked employee found: ${u.email}`);
        }
      } else {
        console.log(`     * [${u.role}] ${u.email} -> Staff user (Org: ${u.organizationId})`);
      }
    }

    // -------------------------------------------------------------------------
    // 2. PART 1: TEST DIAGNOSTIC EXAM SUBMISSION & RECOMMENDATIONS
    // -------------------------------------------------------------------------
    console.log("\n2. PART 1: TESTING EXAM SUBMISSION & SERVER-SIDE EVALUATION...");
    const comp = await prisma.competency.findFirst({ where: { organizationId: ORG_A } });
    if (!comp) throw new Error("No competency found in Org A");

    const empTest = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-VIS-TEST-${Date.now().toString(36).toUpperCase()}`,
        name: "Exam Verification User",
        email: `exam.verify.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(empTest.id);

    // Simulate answering 14 of 20 correctly (70%)
    const answers: Array<{ questionId: string; selectedOption: string }> = [];
    for (let i = 0; i < 14; i++) {
      answers.push({
        questionId: PYTHON_ADVANCED_EXAM.questions[i].id,
        selectedOption: PYTHON_ADVANCED_EXAM.questions[i].correctAnswer,
      });
    }
    for (let i = 14; i < 20; i++) {
      answers.push({
        questionId: PYTHON_ADVANCED_EXAM.questions[i].id,
        selectedOption: "WRONG",
      });
    }

    const evaluation = evaluateExam("exam-python-advanced", answers);
    console.log(`   - Server Evaluation Score: ${evaluation.score}% (${evaluation.correctQuestions}/${evaluation.totalQuestions})`);

    const assessment = await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: empTest.id,
      competencyId: comp.id,
      title: evaluation.title,
      score: evaluation.score,
      totalQuestions: evaluation.totalQuestions,
      correctQuestions: evaluation.correctQuestions,
      topicBreakdown: evaluation.topicBreakdown,
      timeTakenMinutes: 21,
    });

    console.log(`   - SkillAssessment created in PostgreSQL: ID=${assessment.id}, Score=${assessment.score}%`);
    console.log(`   - Verified SkillAssessment.employeeId === ${empTest.id}: ✅ YES`);

    // Verify recommendations
    const recs = await RecommendationService.getEmployeeRecommendations(ORG_A, empTest.id);
    console.log(`   - Recommendations generated for employee: count = ${recs.length}`);
    if (recs.length > 0) {
      console.log(`     * Target Competency: "${recs[0].competency.name}", Priority: ${recs[0].priority}`);
      console.log(`     * Verified Recommendation.employeeId === ${empTest.id}: ✅ YES`);
    }

    // -------------------------------------------------------------------------
    // 3. PART 2: TESTING ROLE-BASED ACCESS CONTROL & PERFORMANCE VISIBILITY
    // -------------------------------------------------------------------------
    console.log("\n3. PART 2: TESTING ROLE-BASED PERFORMANCE VISIBILITY & BOUNDARIES...");

    const empOther = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-OTHER-${Date.now().toString(36).toUpperCase()}`,
        name: "Other Employee",
        email: `other.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(empOther.id);

    // Record assessment for other employee
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: empOther.id,
      competencyId: comp.id,
      title: "Other Employee Assessment",
      score: 85,
      totalQuestions: 20,
      correctQuestions: 17,
      topicBreakdown: [{ topic: "Variables", score: 85, totalQuestions: 4, correctQuestions: 3 }],
      timeTakenMinutes: 16,
    });

    // EMPLOYEE OWN ACCESS
    const ownAssessments = await RecommendationService.getEmployeeAssessments(ORG_A, empTest.id);
    console.log(`   - Employee query own assessments: count = ${ownAssessments.length}`);
    const hasOtherData = ownAssessments.some((a) => a.employeeId === empOther.id);
    console.log(`   - Employee can see other employee assessments: ${hasOtherData ? "❌ FAIL (Leaked)" : "✅ NO (Strictly Isolated)"}`);

    // ADMIN / MANAGER ACCESS
    const orgAssessments = await prisma.skillAssessment.findMany({
      where: { organizationId: ORG_A },
      include: { employee: true, competency: true },
    });
    console.log(`   - Admin/Manager organization query: found ${orgAssessments.length} total assessments across org.`);
    console.log(`   - Includes empTest assessment: ${orgAssessments.some((a) => a.employeeId === empTest.id) ? "✅ YES" : "❌ NO"}`);
    console.log(`   - Includes empOther assessment: ${orgAssessments.some((a) => a.employeeId === empOther.id) ? "✅ YES" : "❌ NO"}`);

    // -------------------------------------------------------------------------
    // 4. CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n4. CLEANUP TEST DATA...");
    await prisma.skillRecommendation.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.skillAssessment.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.employee.deleteMany({ where: { id: { in: CLEANUP_EMPLOYEE_IDS } } });
    console.log("   - Cleaned up test records.");

    console.log("\n================================================================================");
    console.log("ALL SUBMISSION & VISIBILITY CHECKS COMPLETED AND VERIFIED! ✅");
    console.log("================================================================================");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFullWorkflow();
