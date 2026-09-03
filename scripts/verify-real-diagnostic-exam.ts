import { prisma } from "../lib/db/prisma";
import { getClientExam, evaluateExam, PYTHON_ADVANCED_EXAM } from "../lib/assessment/exam-bank";
import { RecommendationService } from "../lib/services/recommendation.service";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_EMPLOYEE_IDS: string[] = [];

function trackEmployee(id: string) {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

async function runRealDiagnosticExamVerification() {
  console.log("================================================================================");
  console.log("CAPACITY CONNECT — REAL DIAGNOSTIC EXAM FULL WORKFLOW VERIFICATION");
  console.log("================================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // 1. QUESTION BANK & CLIENT SANITIZATION AUDIT
    // -------------------------------------------------------------------------
    console.log("1. AUDIT: Verifying Question Bank & Client Sanitization...");
    const clientExam = getClientExam("exam-python-advanced");
    console.log(`   - Exam Title: "${clientExam.title}"`);
    console.log(`   - Total Questions: ${clientExam.totalQuestions}`);
    console.log(`   - Topics: ${clientExam.topics.join(", ")}`);

    if (clientExam.questions.length !== 20) {
      throw new Error(`Expected 20 questions, found ${clientExam.questions.length}`);
    }

    const hasLeakedAnswers = clientExam.questions.some((q) => (q as any).correctAnswer !== undefined);
    console.log(`   - Correct answers stripped from client payload: ${!hasLeakedAnswers ? "✅ YES (Secure)" : "❌ NO"}`);

    // -------------------------------------------------------------------------
    // 2. CREATE TEST EMPLOYEE
    // -------------------------------------------------------------------------
    console.log("\n2. SETTING UP TEST EMPLOYEE IN POSTGRESQL...");
    const desig = await prisma.designation.findFirst({
      where: { organizationId: TEST_ORG_ID, id: "desig-sr-se" },
      include: { requirements: { include: { competency: true } } },
    }) || await prisma.designation.findFirst({
      where: { organizationId: TEST_ORG_ID },
      include: { requirements: { include: { competency: true } } },
    });

    const comp = desig?.requirements[0]?.competency || await prisma.competency.findFirst({ where: { organizationId: TEST_ORG_ID } });

    const emp = await prisma.employee.create({
      data: {
        organizationId: TEST_ORG_ID,
        employeeCode: `EMP-REAL-EXAM-${Date.now().toString(36).toUpperCase()}`,
        name: "Diagnostic Exam Taker",
        email: `diagnostic.taker.${Date.now()}@example.com`,
        designationId: desig?.id,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);
    console.log(`   - Created Employee: "${emp.name}" (ID: ${emp.id})`);

    // -------------------------------------------------------------------------
    // 3. EMPLOYEE TAKES EXAM & SUBMITS ANSWERS
    // -------------------------------------------------------------------------
    console.log("\n3. SIMULATING QUESTION-BY-QUESTION EXAM SUBMISSION...");
    // Answer simulation:
    // Variables: 4/4 correct (100%)
    // OOP: 3/4 correct (75%)
    // AsyncIO: 2/4 correct (50%)
    // Thread Synchronization: 1/4 correct (25%)
    // Microservices Architecture: 2/4 correct (50%)
    // Total: 12/20 = 60%
    const submittedAnswers: Array<{ questionId: string; selectedOption: string }> = [];

    const exam = PYTHON_ADVANCED_EXAM;
    const varQs = exam.questions.filter((q) => q.topic === "Variables");
    varQs.forEach((q) => submittedAnswers.push({ questionId: q.id, selectedOption: q.correctAnswer }));

    const oopQs = exam.questions.filter((q) => q.topic === "OOP");
    submittedAnswers.push({ questionId: oopQs[0].id, selectedOption: oopQs[0].correctAnswer });
    submittedAnswers.push({ questionId: oopQs[1].id, selectedOption: oopQs[1].correctAnswer });
    submittedAnswers.push({ questionId: oopQs[2].id, selectedOption: oopQs[2].correctAnswer });
    submittedAnswers.push({ questionId: oopQs[3].id, selectedOption: "WRONG" });

    const asyncQs = exam.questions.filter((q) => q.topic === "AsyncIO");
    submittedAnswers.push({ questionId: asyncQs[0].id, selectedOption: asyncQs[0].correctAnswer });
    submittedAnswers.push({ questionId: asyncQs[1].id, selectedOption: asyncQs[1].correctAnswer });
    submittedAnswers.push({ questionId: asyncQs[2].id, selectedOption: "WRONG" });
    submittedAnswers.push({ questionId: asyncQs[3].id, selectedOption: "WRONG" });

    const threadQs = exam.questions.filter((q) => q.topic === "Thread Synchronization");
    submittedAnswers.push({ questionId: threadQs[0].id, selectedOption: threadQs[0].correctAnswer });
    submittedAnswers.push({ questionId: threadQs[1].id, selectedOption: "WRONG" });
    submittedAnswers.push({ questionId: threadQs[2].id, selectedOption: "WRONG" });
    submittedAnswers.push({ questionId: threadQs[3].id, selectedOption: "WRONG" });

    const microQs = exam.questions.filter((q) => q.topic === "Microservices Architecture");
    submittedAnswers.push({ questionId: microQs[0].id, selectedOption: microQs[0].correctAnswer });
    submittedAnswers.push({ questionId: microQs[1].id, selectedOption: microQs[1].correctAnswer });
    submittedAnswers.push({ questionId: microQs[2].id, selectedOption: "WRONG" });
    submittedAnswers.push({ questionId: microQs[3].id, selectedOption: "WRONG" });

    console.log(`   - Submitted ${submittedAnswers.length} answers.`);

    // -------------------------------------------------------------------------
    // 4. SERVER-SIDE EVALUATION
    // -------------------------------------------------------------------------
    console.log("\n4. SERVER-SIDE EVALUATION & SCORING...");
    const evaluation = evaluateExam("exam-python-advanced", submittedAnswers);

    console.log(`   - Overall Score: ${evaluation.score}% (${evaluation.correctQuestions}/${evaluation.totalQuestions} correct)`);
    console.log("   - Topic Breakdown:");
    evaluation.topicBreakdown.forEach((t) => {
      console.log(`     * ${t.topic}: ${t.score}% (${t.correctQuestions}/${t.totalQuestions})`);
    });

    if (evaluation.score !== 60 || evaluation.correctQuestions !== 12) {
      throw new Error(`Evaluation mismatch: expected 60%, got ${evaluation.score}%`);
    }

    // -------------------------------------------------------------------------
    // 5. POSTGRESQL STORAGE & RECOMMENDATION ENGINE TRIGGER
    // -------------------------------------------------------------------------
    console.log("\n5. STORING IN POSTGRESQL & GENERATING RECOMMENDATIONS...");
    const assessment = await RecommendationService.recordAssessment({
      organizationId: TEST_ORG_ID,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: evaluation.title,
      score: evaluation.score,
      totalQuestions: evaluation.totalQuestions,
      correctQuestions: evaluation.correctQuestions,
      topicBreakdown: evaluation.topicBreakdown,
      timeTakenMinutes: 18,
    });

    console.log(`   - SkillAssessment saved in DB: ID=${assessment.id}, Score=${assessment.score}%`);

    const dbAssessment = await prisma.skillAssessment.findUnique({
      where: { id: assessment.id },
    });
    if (!dbAssessment || dbAssessment.score !== 60) {
      throw new Error("PostgreSQL verification failed for SkillAssessment!");
    }
    console.log("   - PostgreSQL SkillAssessment verification: ✅ VERIFIED");

    // -------------------------------------------------------------------------
    // 6. RECOMMENDATION ENGINE VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n6. VERIFYING GENERATED RECOMMENDATIONS...");
    const recs = await RecommendationService.getEmployeeRecommendations(TEST_ORG_ID, emp.id);
    console.log(`   - Generated ${recs.length} personalized recommendations:`);

    recs.forEach((r) => {
      console.log(`     * Competency: "${r.competency.name}"`);
      console.log(`       - Priority: ${r.priority}`);
      console.log(`       - Weak Topics: [${r.weakTopics.join(", ")}]`);
      console.log(`       - Reason: "${r.reason}"`);
      console.log(`       - Recommended Course: ${r.course ? r.course.title : "None"}`);
    });

    const targetRec = recs.find((r) => r.competencyId === comp!.id);
    console.log(`   - Weak topics include Thread Synchronization & AsyncIO: ${
      targetRec?.weakTopics.some((t) => t.includes("Thread Synchronization") || t.includes("AsyncIO")) ? "✅ YES" : "❌ NO"
    }`);

    // -------------------------------------------------------------------------
    // 7. CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n7. CLEANUP...");
    await prisma.skillRecommendation.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.skillAssessment.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.employee.deleteMany({ where: { id: { in: CLEANUP_EMPLOYEE_IDS } } });
    console.log("   - Cleaned up test records.");

    console.log("\n================================================================================");
    console.log("REAL DIAGNOSTIC EXAM FULL WORKFLOW VERIFIED SUCCESSFULLY! ✅");
    console.log("================================================================================");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRealDiagnosticExamVerification();
