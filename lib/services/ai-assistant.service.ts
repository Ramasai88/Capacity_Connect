import { prisma } from "@/lib/db/prisma";
import { RecommendationService } from "@/lib/services/recommendation.service";
import { SkillGapService } from "@/lib/services/skill-gap.service";
import { calculateSkillGap } from "@/lib/skill-gap/calculateSkillGap";
import { TOPIC_CONCEPTS } from "@/lib/assessment/exam-bank";
import type { AuthenticatedUser } from "@/lib/auth/session";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface EmployeeAssistantProfile {
  employeeId: string;
  name: string;
  employeeCode?: string;
  designation: string;
  department: string;
  competencies: Array<{
    name: string;
    currentLevel: number;
    requiredLevel: number;
    gap: number;
    status: string;
  }>;
  latestAssessment?: {
    title: string;
    score: number;
    completedAt: string;
    topicBreakdown: Array<{
      topic: string;
      score: number;
      correctQuestions: number;
      totalQuestions: number;
    }>;
    weakTopics: string[];
  };
  recommendations: Array<{
    competencyName: string;
    priority: string;
    scorePercentage: number | null;
    weakTopics: string[];
    reason: string;
    courseTitle?: string;
  }>;
  enrollments: Array<{
    courseTitle: string;
    progressPercent: number;
    status: string;
  }>;
}

export interface AuthorizedContext {
  role: string;
  userName: string;
  organizationName: string;
  employeeData?: EmployeeAssistantProfile;
  targetEmployeeData?: EmployeeAssistantProfile;
  employeeNotFound?: string;
  unauthorizedCrossEmployeeQuery?: boolean;
  organizationData?: {
    totalEmployees: number;
    totalCompetencies: number;
    topGaps: Array<{ competencyName: string; count: number }>;
  };
}

export class AIAssistantService {
  /**
   * Build minimal, strictly authorized context from PostgreSQL.
   * Authorization and multi-tenant isolation are enforced BEFORE data reaches this layer.
   */
  static async buildAuthorizedContext(
    organizationId: string,
    user: AuthenticatedUser,
    userMessage: string = ""
  ): Promise<AuthorizedContext> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    const baseContext: AuthorizedContext = {
      role: user.role,
      userName: user.name,
      organizationName: org?.name || "Capacity Connect",
    };

    const lower = userMessage.toLowerCase();

    // -------------------------------------------------------------------------
    // 1. EMPLOYEE ROLE CONTEXT: Strictly limited to authenticated employee's records
    // -------------------------------------------------------------------------
    if (user.role === "EMPLOYEE") {
      let employeeId = user.employeeId;

      if (!employeeId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { employeeId: true },
        });
        employeeId = dbUser?.employeeId ?? null;
      }

      // Check if employee is trying to query someone else's data
      const otherEmployees = await prisma.employee.findMany({
        where: {
          organizationId,
          NOT: employeeId ? { id: employeeId } : undefined,
        },
        select: { id: true, name: true },
      });

      const matchedOther = otherEmployees.find((e) => lower.includes(e.name.toLowerCase()));
      if (matchedOther) {
        baseContext.unauthorizedCrossEmployeeQuery = true;
        return baseContext;
      }

      if (!employeeId) {
        return baseContext;
      }

      baseContext.employeeData = await this.fetchEmployeeProfile(organizationId, employeeId);
      return baseContext;
    }

    // -------------------------------------------------------------------------
    // 2. ADMIN & MANAGER CONTEXT: Organization-level intelligence + Target Employee Search
    // -------------------------------------------------------------------------
    const totalEmployees = await prisma.employee.count({ where: { organizationId } });
    const totalCompetencies = await prisma.competency.count({ where: { organizationId } });

    baseContext.organizationData = {
      totalEmployees,
      totalCompetencies,
      topGaps: [],
    };

    // Check if the query asks about a specific employee in this organization
    if (userMessage.trim()) {
      const orgEmployees = await prisma.employee.findMany({
        where: { organizationId },
        select: { id: true, name: true, employeeCode: true },
      });

      const matched = orgEmployees.find(
        (e) =>
          lower.includes(e.name.toLowerCase()) ||
          (e.employeeCode && lower.includes(e.employeeCode.toLowerCase()))
      );

      if (matched) {
        baseContext.targetEmployeeData = await this.fetchEmployeeProfile(organizationId, matched.id);
      } else {
        // Check if query is structured as an employee inquiry (e.g. "Give me <Name> Skill Gap", "Show <Name>'s assessment")
        const nameExtractionMatch = userMessage.match(
          /(?:give me|show|how is|what are|about)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)(?:'s|\s+skill|\s+assessment|\s+performance|\s+gaps|\s+course)?/i
        );
        if (nameExtractionMatch && nameExtractionMatch[1]) {
          const candidate = nameExtractionMatch[1].trim();
          const genericWords = ["the", "my", "our", "all", "latest", "asyncio", "python", "thread", "this"];
          if (!genericWords.includes(candidate.toLowerCase()) && candidate.length > 2) {
            baseContext.employeeNotFound = candidate;
          }
        }
      }
    }

    return baseContext;
  }

  /**
   * Helper to retrieve rich, read-only employee profile data.
   */
  private static async fetchEmployeeProfile(
    organizationId: string,
    employeeId: string
  ): Promise<EmployeeAssistantProfile | undefined> {
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
        enrollments: {
          include: { course: true },
        },
      },
    });

    if (!employee) return undefined;

    // 1. Skill Gaps Calculation via canonical calculateSkillGap
    const gapSummary = await SkillGapService.getEmployeeSkillGaps(organizationId, employeeId);
    const competenciesList = gapSummary
      ? gapSummary.gaps.map((g) => ({
          name: g.competencyName,
          currentLevel: g.currentLevel ?? 0,
          requiredLevel: g.requiredLevel,
          gap: g.gap,
          status: g.status,
        }))
      : [];

    // 2. Latest Diagnostic Assessment
    const latestAssessment = await prisma.skillAssessment.findFirst({
      where: { organizationId, employeeId },
      orderBy: { completedAt: "desc" },
    });

    let assessmentData = undefined;
    if (latestAssessment) {
      const rawBreakdown = Array.isArray(latestAssessment.topicBreakdown)
        ? (latestAssessment.topicBreakdown as any[])
        : [];
      const weakTopics = rawBreakdown.filter((t) => t.score < 60).map((t) => t.topic);

      assessmentData = {
        title: latestAssessment.title,
        score: latestAssessment.score,
        completedAt: latestAssessment.completedAt.toISOString(),
        topicBreakdown: rawBreakdown,
        weakTopics,
      };
    }

    // 3. Structured Recommendations
    const rawRecs = await RecommendationService.getEmployeeRecommendations(
      organizationId,
      employeeId
    );

    const recommendations = rawRecs.map((r) => ({
      competencyName: r.competency.name,
      priority: r.priority,
      scorePercentage: r.scorePercentage,
      weakTopics: r.weakTopics,
      reason: r.reason,
      courseTitle: r.course?.title,
    }));

    // 4. Course Enrollments
    const enrollments = employee.enrollments.map((e) => ({
      courseTitle: e.course.title,
      progressPercent: e.progressPercent,
      status: e.status,
    }));

    return {
      employeeId,
      name: employee.name,
      employeeCode: employee.employeeCode,
      designation: employee.designation?.title || "Not Assigned",
      department: employee.department || "General",
      competencies: competenciesList,
      latestAssessment: assessmentData,
      recommendations,
      enrollments,
    };
  }

  /**
   * Process chat request and generate intelligent, educational, read-only response.
   */
  static async handleUserChat(
    organizationId: string,
    user: AuthenticatedUser,
    message: string,
    history: ChatMessage[] = []
  ): Promise<{ reply: string; suggestions: string[] }> {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      return {
        reply: "Please provide a question or topic you would like assistance with.",
        suggestions: ["What are my weakest skills?", "Why was this course recommended?"],
      };
    }

    // 1. Build authorized context
    const context = await this.buildAuthorizedContext(organizationId, user, cleanMessage);

    // 2. Check for cross-employee unauthorized attempts by employees
    if (context.unauthorizedCrossEmployeeQuery) {
      return {
        reply:
          "🔒 **Authorization Notice**\n\nAs an employee, you are authorized to view **only your own** competency records, diagnostic assessments, and recommendations.",
        suggestions: [
          "What are my weakest skills?",
          "Why was this course recommended to me?",
          "Explain my latest assessment result",
        ],
      };
    }

    // 3. Check for explicit mutation requests and deny with helpful explanation
    const lower = cleanMessage.toLowerCase();
    if (
      lower.includes("change my level") ||
      lower.includes("update my level") ||
      lower.includes("change competency") ||
      lower.includes("update competency") ||
      lower.includes("set my competency") ||
      lower.includes("promote me") ||
      lower.includes("give me level 5") ||
      lower.includes("delete") ||
      lower.includes("approve reassessment") ||
      lower.includes("change ananya") ||
      lower.includes("update ananya")
    ) {
      return {
        reply:
          "🔒 **Read-Only Assistant Notice**\n\nI am the **Capacity Connect Learning Assistant** and operate strictly in **read-only mode**. I cannot modify official competency levels, grades, course catalogs, or system records.\n\n### Official Path for Level Updates:\n1. 📖 **Learn**: Complete recommended course modules.\n2. 📝 **Reassessment**: Submit an official reassessment request upon completing learning.\n3. 👔 **Manager Review**: Designated managers evaluate demonstration and officially record level updates in **Settings / Competencies**.",
        suggestions: [
          "What courses are recommended?",
          "Explain diagnostic assessment scores",
          "What topics should be studied before reassessment?",
        ],
      };
    }

    // 4. If an Admin/Manager queried an employee that doesn't exist in this organization
    if (context.employeeNotFound) {
      return {
        reply: `I couldn't find an employee named **${context.employeeNotFound}** in your organization (${context.organizationName}). Please verify the spelling or check the **Employees** directory.`,
        suggestions: [
          "What are common skill gaps in our organization?",
          "Show all published courses",
        ],
      };
    }

    // 5. Optional External LLM Integration (if AI_API_KEY is configured in .env)
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const externalReply = await this.callExternalLLM(apiKey, cleanMessage, context, history);
        if (externalReply) {
          return {
            reply: externalReply,
            suggestions: this.generateSuggestions(context, cleanMessage),
          };
        }
      } catch (err) {
        console.warn("External AI call failed; engaging native reasoning engine:", err);
      }
    }

    // 6. Native Intelligent Reasoning Engine (Zero-dependency, offline-ready, deterministic)
    const nativeReply = this.generateNativeResponse(cleanMessage, context);
    return {
      reply: nativeReply,
      suggestions: this.generateSuggestions(context, cleanMessage),
    };
  }

  /**
   * Native contextual knowledge engine that maps the user's question against authorized PostgreSQL metrics.
   */
  private static generateNativeResponse(message: string, context: AuthorizedContext): string {
    const lower = message.toLowerCase();

    // -------------------------------------------------------------------------
    // Case 1: ADMIN / MANAGER Asking About a Specific Target Employee
    // -------------------------------------------------------------------------
    if (context.targetEmployeeData) {
      const emp = context.targetEmployeeData;

      // Group competency gaps
      const gapsList =
        emp.competencies.length > 0
          ? emp.competencies
              .map((c) => {
                const isSatisfied = c.gap === 0;
                const indicator = isSatisfied ? "✅ *Satisfied*" : c.gap >= 2 ? "🔴 *High Priority*" : "🟠 *Moderate Priority*";
                return `• **${c.name}**: Current Level ${c.currentLevel || 0} → Required Level ${c.requiredLevel} (*Gap: ${c.gap} level${c.gap === 1 ? "" : "s"}*) — ${indicator}`;
              })
              .join("\n")
          : "No specific competency requirements mapped for this role.";

      // High priority focus areas
      const highGaps = emp.competencies.filter((c) => c.gap > 0);
      const focusSection =
        highGaps.length > 0
          ? highGaps.map((c) => `${c.gap >= 2 ? "🔴" : "🟠"} **${c.name}** (Gap: ${c.gap} level${c.gap === 1 ? "" : "s"})`).join("\n")
          : "✅ All required competencies meet the designation baseline.";

      // Assessment performance
      let assessmentSection = "No completed diagnostic assessment on record yet.";
      if (emp.latestAssessment) {
        const a = emp.latestAssessment;
        assessmentSection = `- **Exam Title:** ${a.title}
- **Overall Score:** **${a.score}%** (Completed: ${new Date(a.completedAt).toLocaleDateString()})
- **Topic Breakdown:** ${a.topicBreakdown.map((t) => `${t.topic} (${t.score}%)`).join(", ")}
- **Identified Weak Areas:** ${a.weakTopics.length > 0 ? a.weakTopics.join(", ") : "None (< 60%)"}`;
      }

      // Recommendations
      let recommendationSection = "No active course recommendations generated.";
      if (emp.recommendations.length > 0) {
        recommendationSection = emp.recommendations
          .map(
            (r) =>
              `- **${r.courseTitle || r.competencyName}** [**${r.priority} PRIORITY**]\n  *Reason:* ${r.reason}`
          )
          .join("\n");
      }

      return `### 👤 ${emp.name} — Skill Gap & Performance Analysis

**Role / Designation:** ${emp.designation} (${emp.department})  
**Employee Code:** \`${emp.employeeCode || "N/A"}\`

#### 📊 Competency Gaps:
${gapsList}

#### 🎯 Priority Focus Areas:
${focusSection}

#### 📝 Diagnostic Assessment Performance:
${assessmentSection}

#### 🚀 Recommended Learning Path:
${recommendationSection}`;
    }

    // -------------------------------------------------------------------------
    // Case 2: Employee Own Data Queries
    // -------------------------------------------------------------------------
    const emp = context.employeeData;

    // A. Why was this course / recommendation given to me?
    if (
      lower.includes("why was this course") ||
      lower.includes("why was this recommendation") ||
      lower.includes("why is this recommended") ||
      lower.includes("why should i learn") ||
      lower.includes("why was i recommended")
    ) {
      if (!emp || !emp.recommendations || emp.recommendations.length === 0) {
        return "You currently have no active course recommendations. Take the **Python Advanced Architecture Diagnostic Exam** to generate personalized learning paths!";
      }

      const topRec = emp.recommendations[0];
      if (!topRec) {
        return "You currently have no active course recommendations. Take the **Python Advanced Architecture Diagnostic Exam** to generate personalized learning paths!";
      }
      return `### 🎯 Recommendation Analysis for ${emp.name}

You were recommended **${topRec.courseTitle || topRec.competencyName}** with **${topRec.priority} PRIORITY**.

**Key Evidence:**
- **Diagnostic Assessment Score:** ${topRec.scorePercentage != null ? `${topRec.scorePercentage}%` : "Not assessed"}
- **Identified Weak Topics:** ${topRec.weakTopics.length > 0 ? topRec.weakTopics.join(", ") : "Core fundamentals"}
- **Reasoning:** ${topRec.reason}

**Recommended Action:**
Start with the foundational modules in this course and focus on your weak areas before scheduling an official reassessment.`;
    }

    // B. Weakest Skills / Focus Areas & Concepts to Study
    if (
      lower.includes("weakest") ||
      lower.includes("weak skills") ||
      lower.includes("weak areas") ||
      lower.includes("where should i improve") ||
      lower.includes("my weaknesses") ||
      lower.includes("what should i focus on") ||
      lower.includes("focus areas") ||
      lower.includes("concepts to study") ||
      lower.includes("what concepts")
    ) {
      if (!emp || !emp.latestAssessment) {
        return "I don't see any completed diagnostic assessments on file yet. Once you complete the Diagnostic Exam, I can pinpoint your exact topic weaknesses and recommend relevant concepts to study!";
      }

      const weakTopics = emp.latestAssessment.weakTopics;
      const topicStats = emp.latestAssessment.topicBreakdown;

      if (weakTopics.length === 0) {
        return `### 🌟 Assessment Performance Summary
Great work, **${emp.name}**! Your diagnostic score was **${emp.latestAssessment.score}%** and all topics scored above the 60% proficiency threshold. You can focus on advanced competency enhancement and mastery modules.`;
      }

      const topicDetails = topicStats
        .map((t) => {
          const tier = t.score >= 75 ? "Strong" : t.score >= 60 ? "Good" : t.score >= 40 ? "Needs Improvement" : "High Priority";
          return `- **${t.topic}**: ${t.score}% (${t.correctQuestions}/${t.totalQuestions} correct) — *${tier}*`;
        })
        .join("\n");

      const focusConcepts = weakTopics
        .map((wt) => {
          const concepts = TOPIC_CONCEPTS[wt] || ["Core architecture & error handling", "Edge cases & optimization"];
          return `#### 🔴 ${wt} (Score: ${topicStats.find((s) => s.topic === wt)?.score || 0}%)
**Focus on mastering:**
${concepts.map((c) => `• ${c}`).join("\n")}`;
        })
        .join("\n\n");

      return `### 📊 Diagnostic Performance & Focus Areas for ${emp.name}

**Overall Assessment Score:** **${emp.latestAssessment.score}%** (${emp.latestAssessment.title})

**Topic-by-Topic Performance:**
${topicDetails}

### 🎯 Key Concepts to Study:
${focusConcepts}

**Recommended Next Step:**
Start with your recommended course modules in **My Learning** to close these specific conceptual gaps before attempting official reassessment.`;
    }

    // C. Explain Assessment Result
    if (
      lower.includes("explain my assessment") ||
      lower.includes("assessment result") ||
      lower.includes("my score") ||
      lower.includes("how did i do") ||
      lower.includes("exam score")
    ) {
      if (!emp || !emp.latestAssessment) {
        return "You have not completed any diagnostic exams yet. Go to **AI Recommendations → Take Diagnostic Exam** to test your knowledge!";
      }

      const a = emp.latestAssessment;
      return `### 📝 Diagnostic Assessment Breakdown
- **Exam Title:** ${a.title}
- **Overall Score:** **${a.score}%**
- **Date Completed:** ${new Date(a.completedAt).toLocaleDateString()}

**Topic-Level Mastery:**
${a.topicBreakdown.map((t) => `- **${t.topic}:** ${t.score}% (${t.correctQuestions}/${t.totalQuestions}) ${t.score < 60 ? "⚠️ Needs Revision" : "✅ Proficient"}`).join("\n")}

This diagnostic score is used by the recommendation engine to tailor your courses. It does **not** downgrade your official competency record.`;
    }

    // D. Learning Plan / What should I study first?
    if (
      lower.includes("learning plan") ||
      lower.includes("study plan") ||
      lower.includes("what should i study") ||
      lower.includes("what to learn first") ||
      lower.includes("roadmap")
    ) {
      if (lower.includes("asyncio") || lower.includes("async")) {
        return `### ⚡ AsyncIO Learning Roadmap (4-Step Plan)

1. **Event Loop Fundamentals**: Understand cooperative multitasking, non-blocking sockets, and why blocking calls freeze the loop.
2. **Coroutines & Tasks**: Master \`async def\`, \`await\`, \`asyncio.create_task()\`, and structured concurrency.
3. **Concurrency Constructs**: Practice \`asyncio.gather(*tasks)\` and \`asyncio.as_completed()\`.
4. **CPU Offloading**: Learn how to bridge synchronous blocking code using \`loop.run_in_executor(None, sync_func)\`.

*Recommended Course Module:* **Advanced Python Architecture & Concurrency → Module 3: AsyncIO Event Loops**.`;
      }

      if (lower.includes("thread") || lower.includes("concurrency") || lower.includes("lock")) {
        return `### 🔒 Thread Synchronization Mastery Plan

1. **CPython GIL Mechanics**: Understand how the Global Interpreter Lock affects multithreaded bytecode execution.
2. **Mutex Primitives**: Difference between \`threading.Lock\` and reentrant \`threading.RLock\`.
3. **Signaling & Semaphores**: Using \`threading.Event\` for flag notifications and \`threading.Semaphore\` for bounded resource pools.
4. **Thread-Safe Queues**: Implementing producer-consumer patterns using \`queue.Queue\`.

*Recommended Course Module:* **Advanced Python Architecture & Concurrency → Module 4: Concurrency & Mutex Primitives**.`;
      }

      return `### 🚀 Recommended 5-Step Learning Roadmap for ${emp?.name || "You"}

1. **Review Diagnostic Weaknesses**: Focus first on topics where you scored under 60%.
2. **Engage with Module Curriculum**: Read course summaries, code snippets, and key concepts in **My Learning**.
3. **Practical Code Practice**: Implement hands-on exercises in an isolated environment.
4. **Self-Check**: Retake the Diagnostic Exam to measure score improvement.
5. **Reassessment Request**: Once confident, submit an official reassessment request for manager review.`;
    }

    // E. General Technical Explanations (Educational)
    if (lower.includes("what is asyncio") || lower.includes("explain asyncio")) {
      return `### 💡 What is AsyncIO in Python?
**AsyncIO** is a Python library used to write concurrent code using the **async/await** syntax.

- **Single-Threaded Event Loop**: Unlike multithreading which relies on OS-level preemptive context switching, AsyncIO uses an event loop that cooperatively runs tasks until an I/O wait occurs.
- **When to use**: High-throughput network I/O, WebSockets, API microservices, and database query pooling.
- **Key Caveat**: Never execute CPU-intensive synchronous operations directly in a coroutine, as this blocks the entire loop.`;
    }

    if (lower.includes("what is gil") || lower.includes("global interpreter lock")) {
      return `### 💡 Global Interpreter Lock (GIL) Explained
The **GIL** is a mutual-exclusion lock used by the CPython interpreter to ensure that only one native thread executes Python bytecode at any given moment.

- **Benefit**: Simplifies memory management and ensures thread safety for CPython's reference-counting garbage collection.
- **Limitation**: Pure CPU-bound Python threads cannot execute concurrently across multiple CPU cores in a single process.
- **Solution for CPU tasks**: Use the \`multiprocessing\` module or offload to C extensions.`;
    }

    // Organization-level summary for Admin/Manager
    if (context.role === "ADMIN" || context.role === "MANAGER") {
      return `Hello **${context.userName}** (${context.role})! I am your **Capacity Connect Management Assistant**.

**Organization Overview for ${context.organizationName}:**
- 👥 **Total Workforce:** ${context.organizationData?.totalEmployees ?? 0} active employees
- 📚 **Competency Library:** ${context.organizationData?.totalCompetencies ?? 0} standardized rubrics

You can ask me about individual employee performance, for example:
- *"Give me Ananya Patel Skill Gap"*
- *"Show Ananya Patel's assessment"*
- *"What course is recommended for Ananya Patel?"*`;
    }

    // Default contextual response
    return `Hello **${context.userName}**! I am your **Capacity Connect Learning Assistant**.

I can help you understand your:
- 📊 **Assessment Performance**: Topic scores and exam breakdowns.
- 🎯 **Skill Recommendations**: Why specific courses and priorities were assigned.
- 🧭 **Learning Roadmap**: Step-by-step study plans for AsyncIO, Concurrency, and Architecture.
- 📈 **Competency Gaps**: Role baselines vs current assessed levels.

What specific skill or assessment topic would you like to explore?`;
  }

  private static generateSuggestions(context: AuthorizedContext, lastQuery: string): string[] {
    if (context.targetEmployeeData) {
      const name = context.targetEmployeeData.name;
      return [
        `Show ${name}'s assessment`,
        `What course is recommended for ${name}?`,
        `What are ${name}'s weak skills?`,
      ];
    }
    const lower = lastQuery.toLowerCase();
    if (lower.includes("weak")) {
      return [
        "Give me a learning plan for Thread Synchronization",
        "Give me a learning plan for AsyncIO",
        "Why was this course recommended to me?",
      ];
    }
    if (lower.includes("score") || lower.includes("assessment")) {
      return [
        "What are my weakest skills?",
        "What should I study before reassessment?",
        "Explain AsyncIO in simple terms",
      ];
    }
    if (context.role === "ADMIN" || context.role === "MANAGER") {
      return [
        "Give me Ananya Patel Skill Gap",
        "What are common skill gaps in our organization?",
        "Explain AsyncIO in simple terms",
      ];
    }
    return [
      "Why was this course recommended to me?",
      "What are my weakest skills?",
      "Give me a learning plan for AsyncIO",
      "Explain my latest assessment score",
    ];
  }

  private static async callExternalLLM(
    apiKey: string,
    message: string,
    context: AuthorizedContext,
    history: ChatMessage[]
  ): Promise<string | null> {
    const systemPrompt = `You are the Capacity Connect Learning Assistant, an enterprise AI assistant for digital capacity building.
You are strictly READ-ONLY. You explain competency gaps, diagnostic assessments, and recommendations.
Never claim you can modify data or change official competency levels.
Always reference the authorized employee context provided below.

AUTHORIZED USER CONTEXT:
${JSON.stringify(context, null, 2)}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-4),
      { role: "user", content: message },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    }
    return null;
  }
}
