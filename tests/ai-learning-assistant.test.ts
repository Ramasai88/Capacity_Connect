import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { AIAssistantService } from "@/lib/services/ai-assistant.service";
import { RecommendationService } from "@/lib/services/recommendation.service";
import type { AuthenticatedUser } from "@/lib/auth/session";

const ORG_A = "org-kl-university";
const CLEANUP_EMPLOYEE_IDS: string[] = [];

function trackEmployee(id: string): string {
  CLEANUP_EMPLOYEE_IDS.push(id);
  return id;
}

afterEach(async () => {
  if (CLEANUP_EMPLOYEE_IDS.length > 0) {
    await prisma.skillRecommendation.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.skillAssessment.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.employeeCompetency.deleteMany({ where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } } });
    await prisma.employee.deleteMany({ where: { id: { in: CLEANUP_EMPLOYEE_IDS } } });
    CLEANUP_EMPLOYEE_IDS.length = 0;
  }
});

describe("AI Learning Assistant — Isolated, Read-Only & Secure", () => {
  it("builds authorized context containing only the authenticated employee's data", async () => {
    const comp = await prisma.competency.findFirst({ where: { organizationId: ORG_A } });
    expect(comp).not.toBeNull();

    const emp = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-AI-TEST-${Date.now().toString(36).toUpperCase()}`,
        name: "AI Test Employee",
        email: `ai.test.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    // Record assessment for this employee (score 45%, weak topic Thread Synchronization)
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: "Python Diagnostic Exam",
      score: 45,
      totalQuestions: 20,
      correctQuestions: 9,
      topicBreakdown: [
        { topic: "Variables", score: 100, totalQuestions: 4, correctQuestions: 4 },
        { topic: "Thread Synchronization", score: 25, totalQuestions: 4, correctQuestions: 1 },
      ],
      timeTakenMinutes: 18,
    });

    const user: AuthenticatedUser = {
      id: `usr-${Date.now()}`,
      name: emp.name,
      email: emp.email,
      role: "EMPLOYEE",
      organizationId: ORG_A,
      employeeId: emp.id,
    };

    const context = await AIAssistantService.buildAuthorizedContext(ORG_A, user);

    expect(context.role).toBe("EMPLOYEE");
    expect(context.employeeData?.employeeId).toBe(emp.id);
    expect(context.employeeData?.name).toBe(emp.name);
    expect(context.employeeData?.latestAssessment?.score).toBe(45);
    expect(context.employeeData?.latestAssessment?.weakTopics).toContain("Thread Synchronization");
  });

  it("answers 'Why was this course recommended' using real assessment evidence", async () => {
    const desigComp = await prisma.designationCompetency.findFirst({
      where: { organizationId: ORG_A },
      include: { designation: true, competency: true },
    });
    const comp = desigComp?.competency || (await prisma.competency.findFirst({ where: { organizationId: ORG_A } }));
    const desigId = desigComp?.designationId;

    const emp = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-AI-REC-${Date.now().toString(36).toUpperCase()}`,
        name: "Recommendation Question Employee",
        email: `ai.rec.${Date.now()}@example.com`,
        designationId: desigId,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: "Python Diagnostic Exam",
      score: 55,
      totalQuestions: 20,
      correctQuestions: 11,
      topicBreakdown: [
        { topic: "AsyncIO", score: 50, totalQuestions: 4, correctQuestions: 2 },
      ],
      timeTakenMinutes: 19,
    });

    const user: AuthenticatedUser = {
      id: `usr-${Date.now()}`,
      name: emp.name,
      email: emp.email,
      role: "EMPLOYEE",
      organizationId: ORG_A,
      employeeId: emp.id,
    };

    const response = await AIAssistantService.handleUserChat(
      ORG_A,
      user,
      "Why was this course recommended to me?"
    );

    expect(response.reply).toBeDefined();
    expect(response.reply).toContain("Recommendation Analysis");
    expect(response.reply).toContain("55%");
    expect(response.suggestions.length).toBeGreaterThan(0);
  });

  it("strictly enforces Read-Only policy when user requests data mutation", async () => {
    const emp = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-RO-TEST-${Date.now().toString(36).toUpperCase()}`,
        name: "Read Only Test Employee",
        email: `ro.test.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    const user: AuthenticatedUser = {
      id: `usr-${Date.now()}`,
      name: emp.name,
      email: emp.email,
      role: "EMPLOYEE",
      organizationId: ORG_A,
      employeeId: emp.id,
    };

    // User attempts to mutate competency level via chatbot
    const mutationQuery = "Please change my competency level to 5 and promote me";
    const response = await AIAssistantService.handleUserChat(ORG_A, user, mutationQuery);

    expect(response.reply).toContain("Read-Only Assistant Notice");
    expect(response.reply).toContain("read-only mode");
    expect(response.reply).toContain("Manager Review");

    // Verify database record remained untouched
    const compRecord = await prisma.employeeCompetency.findFirst({
      where: { employeeId: emp.id },
    });
    expect(compRecord).toBeNull();
  });

  it("isolates Employee A from Employee B data in chatbot context", async () => {
    const comp = await prisma.competency.findFirst({ where: { organizationId: ORG_A } });

    const empA = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-CHAT-A-${Date.now().toString(36).toUpperCase()}`,
        name: "Chat Employee A",
        email: `chat.a.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(empA.id);

    const empB = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-CHAT-B-${Date.now().toString(36).toUpperCase()}`,
        name: "Chat Employee B",
        email: `chat.b.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(empB.id);

    // Record 95% for Employee A, 30% for Employee B
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: empA.id,
      competencyId: comp!.id,
      title: "Exam A",
      score: 95,
      totalQuestions: 20,
      correctQuestions: 19,
      topicBreakdown: [{ topic: "Variables", score: 95, totalQuestions: 4, correctQuestions: 4 }],
      timeTakenMinutes: 15,
    });

    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: empB.id,
      competencyId: comp!.id,
      title: "Exam B",
      score: 30,
      totalQuestions: 20,
      correctQuestions: 6,
      topicBreakdown: [{ topic: "Variables", score: 30, totalQuestions: 4, correctQuestions: 1 }],
      timeTakenMinutes: 20,
    });

    const userA: AuthenticatedUser = {
      id: `usr-a-${Date.now()}`,
      name: empA.name,
      email: empA.email,
      role: "EMPLOYEE",
      organizationId: ORG_A,
      employeeId: empA.id,
    };

    const resA = await AIAssistantService.handleUserChat(ORG_A, userA, "What is my score?");
    expect(resA.reply).toContain("95%");
    expect(resA.reply).not.toContain("30%");
    expect(resA.reply).not.toContain(empB.name);
  });

  it("never includes passwords or passwordHash in context builder", async () => {
    const emp = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-SEC-${Date.now().toString(36).toUpperCase()}`,
        name: "Security Audit Employee",
        email: `sec.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    const user: AuthenticatedUser = {
      id: `usr-${Date.now()}`,
      name: emp.name,
      email: emp.email,
      role: "EMPLOYEE",
      organizationId: ORG_A,
      employeeId: emp.id,
    };

    const context = await AIAssistantService.buildAuthorizedContext(ORG_A, user);
    const serializedContext = JSON.stringify(context);

    expect(serializedContext).not.toContain("passwordHash");
    expect(serializedContext).not.toContain("password");
    expect(serializedContext).not.toContain("secret");
  });

  it("explains weak focus areas and provides relevant study concepts from exam bank", async () => {
    const comp = await prisma.competency.findFirst({ where: { organizationId: ORG_A } });

    const emp = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-FOCUS-${Date.now().toString(36).toUpperCase()}`,
        name: "Focus Concept Employee",
        email: `focus.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp.id);

    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: emp.id,
      competencyId: comp!.id,
      title: "Python Diagnostic Exam",
      score: 45,
      totalQuestions: 20,
      correctQuestions: 9,
      topicBreakdown: [
        { topic: "Variables", score: 100, totalQuestions: 4, correctQuestions: 4 },
        { topic: "Thread Synchronization", score: 25, totalQuestions: 4, correctQuestions: 1 },
      ],
      timeTakenMinutes: 18,
    });

    const user: AuthenticatedUser = {
      id: `usr-focus-${Date.now()}`,
      name: emp.name,
      email: emp.email,
      role: "EMPLOYEE",
      organizationId: ORG_A,
      employeeId: emp.id,
    };

    const res = await AIAssistantService.handleUserChat(
      ORG_A,
      user,
      "What should I focus on and what concepts should I study?"
    );

    expect(res.reply).toContain("Focus Areas for Focus Concept Employee");
    expect(res.reply).toContain("Thread Synchronization");
    expect(res.reply).toContain("Python GIL (Global Interpreter Lock)");
    expect(res.reply).toContain("Lock vs RLock");
    expect(res.reply).toContain("45%");
  });

  it("ADMIN can query an employee's skill gap (e.g. 'Give me Ananya Patel Skill Gap')", async () => {
    const desigComp = await prisma.designationCompetency.findFirst({
      where: { organizationId: ORG_A },
      include: { designation: true, competency: true },
    });
    const comp = desigComp?.competency || (await prisma.competency.findFirst({ where: { organizationId: ORG_A } }));

    await prisma.employee.deleteMany({
      where: { organizationId: ORG_A, name: "Ananya Patel" },
    });

    const ananya = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-ANANYA-${Date.now().toString(36).toUpperCase()}`,
        name: "Ananya Patel",
        email: `ananya.${Date.now()}@example.com`,
        department: "Engineering",
        designationId: desigComp?.designationId,
        status: "ACTIVE",
      },
    });
    trackEmployee(ananya.id);

    // Record assessment for Ananya
    await RecommendationService.recordAssessment({
      organizationId: ORG_A,
      employeeId: ananya.id,
      competencyId: comp!.id,
      title: "Python Diagnostic Exam",
      score: 55,
      totalQuestions: 20,
      correctQuestions: 11,
      topicBreakdown: [
        { topic: "Thread Synchronization", score: 25, totalQuestions: 4, correctQuestions: 1 },
        { topic: "AsyncIO", score: 50, totalQuestions: 4, correctQuestions: 2 },
      ],
      timeTakenMinutes: 20,
    });

    const adminUser: AuthenticatedUser = {
      id: `admin-${Date.now()}`,
      name: "Admin User",
      email: "admin@capacityconnect.demo",
      role: "ADMIN",
      organizationId: ORG_A,
    };

    const res = await AIAssistantService.handleUserChat(
      ORG_A,
      adminUser,
      "Give me Ananya Patel Skill Gap"
    );

    expect(res.reply).toContain("Ananya Patel");
    expect(res.reply).toContain("Skill Gap & Performance Analysis");
    expect(res.reply).toContain("Competency Gaps");
    expect(res.reply).toContain("Diagnostic Assessment Performance");
    expect(res.reply).toContain("Python Diagnostic Exam");
    expect(res.reply).toContain("55%");
  });

  it("EMPLOYEE querying another employee is rejected with authorization notice", async () => {
    const emp1 = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-RAVI-${Date.now().toString(36).toUpperCase()}`,
        name: "Ravi Shankar",
        email: `ravi.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp1.id);

    const emp2 = await prisma.employee.create({
      data: {
        organizationId: ORG_A,
        employeeCode: `EMP-ANANYA-2-${Date.now().toString(36).toUpperCase()}`,
        name: "Ananya Patel",
        email: `ananya2.${Date.now()}@example.com`,
        status: "ACTIVE",
      },
    });
    trackEmployee(emp2.id);

    const employeeUser: AuthenticatedUser = {
      id: `usr-ravi-${Date.now()}`,
      name: emp1.name,
      email: emp1.email,
      role: "EMPLOYEE",
      organizationId: ORG_A,
      employeeId: emp1.id,
    };

    const res = await AIAssistantService.handleUserChat(
      ORG_A,
      employeeUser,
      "Give me Ananya Patel Skill Gap"
    );

    expect(res.reply).toContain("Authorization Notice");
    expect(res.reply).toContain("only your own");
  });

  it("ADMIN querying non-existent employee returns safe not found message", async () => {
    const adminUser: AuthenticatedUser = {
      id: `admin-${Date.now()}`,
      name: "Admin User",
      email: "admin@capacityconnect.demo",
      role: "ADMIN",
      organizationId: ORG_A,
    };

    const res = await AIAssistantService.handleUserChat(
      ORG_A,
      adminUser,
      "Give me NonExistentPerson Skill Gap"
    );

    expect(res.reply).toContain("couldn't find an employee named");
  });
});
