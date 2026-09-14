import { CourseCurriculum } from "./types";

export const courseCom501: CourseCurriculum = {
  courseId: "course-com-501",
  totalDurationMinutes: 840,
  modules: [
    {
      id: "com-mod-1",
      order: 1,
      title: "Module 1 — Executive Communication Frameworks & The Pyramid Principle",
      durationMinutes: 210,
      summary: "Top-down executive messaging, Barbara Minto's Pyramid Principle, Answer-First (BLUF) communication, executive summary construction, and synthesizing complex engineering architectures for C-suite decision-makers.",
      learningObjectives: [
        "Structure business communications using Barbara Minto's Pyramid Principle and MECE logical grouping.",
        "Synthesize multi-month technical and operational initiatives into 60-second executive summaries.",
        "Construct Answer-First (Bottom Line Up Front) decision memos that drive executive alignment and resource authorization.",
        "Eliminate technical jargon and map engineering constraints directly to business risks, revenue impact, and strategic priorities."
      ],
      resources: [
        {
          title: "The Minto Pyramid Principle: Logic in Writing and Thinking",
          url: "https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights",
          description: "Authoritative McKinsey framework on top-down structured thinking, answer-first reasoning, and hierarchical communication.",
          type: "guide",
          provider: "McKinsey & Company"
        },
        {
          title: "Harvard Business Review: The Science of Strong Business Writing",
          url: "https://hbr.org/2021/11/the-science-of-strong-business-writing",
          description: "Evidence-based strategies for cognitive ease, eliminating passive voice, and structuring decision-oriented executive prose.",
          type: "article",
          provider: "Harvard Business Review"
        },
        {
          title: "MIT Sloan Management Review: How to Talk So Executives Will Listen",
          url: "https://sloanreview.mit.edu/article/how-to-talk-so-executives-will-listen/",
          description: "Strategic communication techniques for aligning engineering recommendations with boardroom priorities.",
          type: "article",
          provider: "MIT Sloan"
        }
      ],
      content: {
        overview: "Executive stakeholders operate under intense cognitive load and severe time scarcity. They prioritize business outcomes, risk mitigation, and capital allocation over granular operational details. The Pyramid Principle enforces top-down communication: leading with the core recommendation first (Answer-First / BLUF), followed by logically grouped, mutually exclusive arguments (MECE) backed by quantified evidence.",
        keyConcepts: [
          {
            section: "Section 1 — Top-Down Structured Thinking",
            topic: "The Minto Pyramid Principle",
            title: "Lesson 1 — The Pyramid Principle: Answer-First (BLUF) Architecture",
            prerequisites: "Understanding of basic business reporting and technical project delivery.",
            description: "Barbara Minto's Pyramid Principle structures communication hierarchically: starting with the single governing thought or recommendation at the top, supported by mutually exclusive, collectively exhaustive (MECE) pillars.",
            whyItMatters: "Traditional bottom-up communication ('Here is the history, here are the tests we ran, and finally here is what we should do') loses executive attention within 30 seconds. Answer-first communication establishes immediate context and enables rapid decision-making.",
            howItWorks: "1. The apex of the pyramid contains the core conclusion or recommendation. 2. Level 2 contains 3 to 4 distinct supporting rationales (MECE). 3. Level 3 contains the data, metrics, and operational evidence that substantiate each rationale.",
            stepByStep: [
              "Step 1: Formulate the single core recommendation in 1 concise sentence (the 'Governing Thought').",
              "Step 2: Group supporting arguments into 3–4 MECE categories (e.g., Financial, Operational, Risk).",
              "Step 3: Arrange arguments in deductive or inductive order based on audience familiarity.",
              "Step 4: Attach quantified data points (ROI, SLA impact, latency reduction, cost savings) to each pillar.",
              "Step 5: Review the structure from top to bottom: every sub-point must directly validate its parent."
            ],
            workedExample: "Real-World Executive Memo Scenario:\n\n❌ Poor Bottom-Up Communication:\n'Last month the platform team noticed database CPU spikes on our shard cluster. We benchmarked connection pooling, ran vacuum analyzes, and tested read-replica failovers. The logs show slow queries during peak batch loads. Therefore, we think we need to allocate $40,000 for database memory upgrades.'\n\n✅ Executive Pyramid Structure:\nGoverning Thought: 'Approve a $40,000 infrastructure allocation to upgrade primary database memory before Q4 peak traffic.'\n\nSupporting Pillars (MECE):\n1. Business Continuity: Prevents projected 4.5-hour downtime during Black Friday peak sales ($280K revenue risk).\n2. Operational Efficiency: Reduces 99th-percentile API latency from 450ms to 65ms, meeting enterprise SLA commitments.\n3. Implementation Readiness: Requires zero code refactoring; migration executed in a 30-minute scheduled maintenance window.",
            realWorldUsage: "Used by management consultants (McKinsey, BCG, Bain), VPs of Engineering, and Directors in quarterly business reviews (QBRs), capital expenditure approvals, and executive steering committee presentations.",
            commonMistakes: "Burying the lead recommendation on slide 15 or page 4 of a document after pages of technical methodology.",
            bestPractices: "Always ensure the executive can understand your recommendation, its business impact, and required decision within the first 30 seconds.",
            practiceTask: "Draft a 1-page executive decision memo proposing a cloud database migration using the Pyramid Principle. Ensure the governing thought is the first sentence.",
            keyTakeaway: "Lead with the answer. Structure supporting arguments into mutually exclusive categories that answer the executive's immediate next question: 'Why?'"
          },
          {
            section: "Section 1 — Top-Down Structured Thinking",
            topic: "MECE Framework",
            title: "Lesson 2 — MECE (Mutually Exclusive, Collectively Exhaustive) Reasoning",
            prerequisites: "Lesson 1 (The Pyramid Principle).",
            description: "MECE is a systematic grouping principle where categories do not overlap (Mutually Exclusive) and together cover all possible scenarios without gaps (Collectively Exhaustive).",
            whyItMatters: "Non-MECE presentations confuse decision-makers by mixing overlapping categories (e.g., 'Cost, Revenue, and Marketing Expense') or leaving critical blind spots (e.g., analyzing security but omitting compliance).",
            howItWorks: "Divide complex business problems into structural dimensions: Internal vs External, Revenue vs Cost, Short-Term vs Long-Term, or Acquisition vs Retention vs Expansion.",
            stepByStep: [
              "Step 1: Identify the universe of the problem (e.g., 'Reasons for Project Delivery Delay').",
              "Step 2: Choose a segmentation lens (e.g., Process, People, Technology).",
              "Step 3: Test for Mutual Exclusivity: Does any single cause belong to more than one bucket? If yes, redefine boundaries.",
              "Step 4: Test for Collective Exhaustiveness: Are there any causes not captured by these buckets? If yes, add missing dimensions.",
              "Step 5: Populate each bucket with validated facts and metric evidence."
            ],
            workedExample: "MECE Diagnostic Analysis for Platform Outage:\n\nDimension 1 — Infrastructure (Hardware & Network):\n• Cloud provider regional availability zone network partition (62 minutes).\n\nDimension 2 — Application Code & Dependencies:\n• Unhandled timeout exception in downstream payment gateway integration.\n\nDimension 3 — Operational Process & Human Factors:\n• Automated rollback triggered manually due to alert threshold misconfiguration.\n\nTotal Scope: 100% of incident root causes classified with zero duplicate attribution.",
            realWorldUsage: "Root-cause analyses (RCA) presented to executive boards, vendor evaluation matrices, merger & acquisition technical due diligence.",
            commonMistakes: "Creating a catch-all 'Miscellaneous' or 'Other' category that hides 50% of the actual root cause data.",
            bestPractices: "Use standard 2x2 or 3-pillar MECE models (Cost/Quality/Speed, Feasibility/Desirability/Viability) to facilitate rapid audience comprehension.",
            practiceTask: "Break down the business justification for adopting an enterprise microservices architecture into a 3-pillar MECE structure.",
            keyTakeaway: "MECE grouping guarantees clarity and completeness, assuring executives that all critical dimensions have been rigorously evaluated."
          },
          {
            section: "Section 2 — Executive Synthesis & Briefing",
            topic: "Executive Summaries",
            title: "Lesson 3 — Crafting High-Impact 60-Second Executive Summaries",
            prerequisites: "Lessons 1 & 2 (Pyramid & MECE).",
            description: "Writing concise, high-impact executive summaries that extract core business insights from multi-page technical reports and engineering specifications.",
            whyItMatters: "C-suite leaders read dozens of memos daily. If an executive summary fails to clarify the problem, financial impact, and requested action in under 200 words, it will be deprioritized.",
            howItWorks: "Combines the 4-part Executive Briefing Formula: Context -> Complication -> Quantified Impact -> Action Required.",
            stepByStep: [
              "Step 1: Open with a single context sentence outlining current operational baseline.",
              "Step 2: State the critical challenge or inflection point (Complication).",
              "Step 3: Quantify the business impact ($ loss, customer churn, SLA breach, latency risk).",
              "Step 4: Detail the exact decision, budget, or policy sign-off required today."
            ],
            workedExample: "Sample 150-Word C-Level Executive Summary:\n\n'Context: Capacity Connect currently processes 4.2M daily transactions across 18 enterprise clients.\n\nComplication: Legacy authentication servers have reached 88% peak CPU utilization, causing an 8% increase in login latency during morning peak hours.\n\nImpact: Without intervention, projected Q3 customer onboarding will trigger intermittent gateway timeouts, risking breach of our 99.95% enterprise SLA commitments ($120,000 penalty liability).\n\nRecommendation: Authorize immediate deployment of the Redis distributed session cache cluster ($18,500 capex, 2-week implementation). Platform engineering has completed staging benchmarks with zero downtime impact.'",
            realWorldUsage: "Weekly executive syncs, board briefing packs, investor updates, cross-functional engineering status reports.",
            commonMistakes: "Using passive language ('It was observed that errors occurred') and omitting specific budget, date, or decision requests.",
            bestPractices: "Bold key numbers, limit paragraphs to 3 sentences, and clearly specify the 'Decision Requested' at the bottom.",
            practiceTask: "Condense a 10-page architecture document into a 180-word executive briefing following the 4-part formula.",
            keyTakeaway: "An executive summary must be a self-contained decision document that enables an executive to approve action without reading the entire appendix."
          }
        ],
        practicalExercise: "Practical Executive Communication Lab: You are the Lead Architect for Capacity Connect. Your core backend database requires an unscheduled 45-minute maintenance window tonight due to a critical security patch. Draft an executive notification email to the Chief Technology Officer (CTO) and Chief Operating Officer (COO) using the Answer-First Pyramid Principle. Specify business impact, customer mitigation measures, and rollback safety guarantees.",
        competencyVerification: "Verifies Level 5 Executive Communication competency: ability to structure top-down business messaging, eliminate jargon, synthesize technical risks into financial impact, and construct decision-oriented C-suite briefings."
      }
    },
    {
      id: "com-mod-2",
      order: 2,
      title: "Module 2 — The SCQA Framework & Strategic Narrative Construction",
      durationMinutes: 210,
      summary: "Mastering the Situation-Complication-Question-Answer (SCQA) storytelling framework to construct compelling business cases, change-management narratives, and strategic proposals.",
      learningObjectives: [
        "Structure business proposals and white papers using the SCQA narrative framework.",
        "Establish immediate stakeholder resonance by anchoring on shared, undisputed context (Situation).",
        "Articulate the critical tension or market shift (Complication) to build urgency for transformation.",
        "Frame the precise strategic Question that leads inexorably to your recommended Solution."
      ],
      resources: [
        {
          title: "McKinsey Quarterly: The Art of Strategic Storytelling",
          url: "https://www.mckinsey.com/capabilities/strategy-and-corporate-finance/our-insights",
          description: "Frameworks for building alignment around major strategic transformations through structured narrative.",
          type: "guide",
          provider: "McKinsey & Company"
        },
        {
          title: "Stanford Graduate School of Business: Storytelling for Strategic Leaders",
          url: "https://www.gsb.stanford.edu/insights",
          description: "Techniques for combining quantitative data with persuasive narrative to influence executive decision-making.",
          type: "article",
          provider: "Stanford GSB"
        }
      ],
      content: {
        overview: "SCQA (Situation, Complication, Question, Answer) is the gold standard narrative structure for strategic consulting, business transformation proposals, and high-stakes pitch decks. It aligns audience understanding by beginning with uncontroversial facts (Situation), introducing the catalyst for change (Complication), defining the core challenge (Question), and delivering the solution (Answer).",
        keyConcepts: [
          {
            section: "Section 1 — The SCQA Architecture",
            topic: "SCQA Narrative Structure",
            title: "Lesson 1 — Anatomy of SCQA: Situation, Complication, Question, Answer",
            prerequisites: "Module 1 (The Pyramid Principle).",
            description: "Deep dive into the 4 components of SCQA and how they create psychological momentum for decision-makers.",
            whyItMatters: "Proposals that start with the solution without grounding the audience in shared context trigger skepticism. SCQA brings stakeholders along the logical journey so the answer feels inevitable.",
            howItWorks: "1. Situation: Establish undisputed shared baseline facts. 2. Complication: Introduce what changed, the threat, or the opportunity. 3. Question: State what we must resolve. 4. Answer: Deliver the strategic recommendation.",
            stepByStep: [
              "Step 1: Write a Situation statement that 100% of stakeholders agree on (undisputed historical context).",
              "Step 2: Define the Complication: Identify the internal failure, market shift, competitor move, or regulatory change.",
              "Step 3: Frame the strategic Question that naturally springs from the Complication.",
              "Step 4: Present your Answer as the optimal, high-ROI resolution to that precise Question."
            ],
            workedExample: "SCQA Business Case for Cloud Modernization:\n\n• Situation: 'Capacity Connect has grown customer accounts by 140% year-over-year while operating our core infrastructure on dedicated on-premises servers.' (Undisputed fact)\n\n• Complication: 'However, physical server lead times are now 16 weeks, and our hardware capacity will be 100% exhausted before the Q4 holiday surge, making rapid provisioning impossible.' (Urgent problem)\n\n• Question: 'How can we scale our compute capacity dynamically to support Q4 demand without incurring $500K in upfront capital expenditure?' (Core strategic dilemma)\n\n• Answer: 'Migrate our API tier to an auto-scaling AWS container cluster by October 15th, transitioning capex to on-demand opex and reducing scaling latency from 16 weeks to 90 seconds.' (Recommended solution)",
            realWorldUsage: "Annual operating plan proposals, multi-million dollar vendor pitches, engineering RFCs, restructuring communications.",
            commonMistakes: "Putting controversial assertions into the Situation statement, causing immediate argument before reaching the Complication.",
            bestPractices: "Keep Situation to 2 sentences max; ensure the Complication highlights the cost of doing nothing.",
            practiceTask: "Write an SCQA narrative proposing the adoption of automated CI/CD pipelines to a skeptical Director of Engineering.",
            keyTakeaway: "SCQA builds undeniable logical momentum: when stakeholders agree with the Situation and Complication, they readily embrace the Answer."
          }
        ],
        practicalExercise: "Strategic Narrative Lab: Construct a 400-word business transformation narrative using SCQA proposing that Capacity Connect transition from monolithic deployment cycles to weekly micro-releases. Emphasize developer productivity, incident recovery speed, and competitive market positioning.",
        competencyVerification: "Verifies ability to craft executive narrative arcs, manage organizational resistance to change, and frame high-impact strategic proposals."
      }
    },
    {
      id: "com-mod-3",
      order: 3,
      title: "Module 3 — Executive Presentations, C-Suite Data Storytelling & Deck Design",
      durationMinutes: 210,
      summary: "Designing high-impact executive slide decks, C-suite data visualization, lead-with-insight charts, managing executive Q&A, and controlling boardroom dynamics.",
      learningObjectives: [
        "Design executive presentations where every slide title is an actionable takeaway statement (Action Titles).",
        "Transform raw engineering charts into decision-focused data stories with clear visual hierarchy.",
        "Manage executive interruptions, tough Q&A pushback, and time reductions gracefully.",
        "Structure appendix data to defend assumptions without cluttering the primary presentation deck."
      ],
      resources: [
        {
          title: "Gartner Research: How to Present to the Board of Directors",
          url: "https://www.gartner.com/en/executive-guidance",
          description: "Best practices for executive board decks, risk reporting, and high-stakes executive presence.",
          type: "guide",
          provider: "Gartner"
        },
        {
          title: "Edward Tufte: The Visual Display of Quantitative Information",
          url: "https://www.edwardtufte.com/tufte/",
          description: "Principles of graphical integrity, maximizing data-ink ratio, and avoiding chart junk in executive reporting.",
          type: "reference",
          provider: "Graphics Press"
        }
      ],
      content: {
        overview: "Executive slide decks are fundamentally different from technical documentation. Slides must follow the '10-Second Rule': an executive glancing at the slide should absorb the core takeaway immediately from the Action Title and primary data callout. Cluttered charts with 20 metrics confuse the audience; clean visuals with callout annotations illuminate strategic choices.",
        keyConcepts: [
          {
            section: "Section 1 — Executive Visual Architecture",
            topic: "Action Titles & Slide Design",
            title: "Lesson 1 — Action Titles: Writing Insight-Driven Slide Headers",
            prerequisites: "Module 1 (The Pyramid Principle).",
            description: "Replacing descriptive topic labels (e.g., 'Infrastructure Costs 2024') with actionable conclusion statements (e.g., 'Serverless migration reduced monthly compute spend by 42%').",
            whyItMatters: "Executives often skim slide titles without reading body text. Action titles ensure the full narrative is communicated even if the presentation is interrupted on slide 3.",
            howItWorks: "Every slide title must be a complete, grammatically sound sentence asserting a finding, trend, or recommendation.",
            stepByStep: [
              "Step 1: Review slide content and identify the single most important metric or conclusion.",
              "Step 2: Draft the title as a Subject + Verb + Quantified Business Impact.",
              "Step 3: Test: Does reading ONLY the slide titles in sequence tell a coherent, persuasive story?",
              "Step 4: Remove redundant chart titles; let the Action Title provide the interpretation."
            ],
            workedExample: "Before vs After Slide Titles:\n\n❌ Topic Title: 'Q2 Platform Performance Metrics'\n✅ Action Title: 'API latency improvements drove a 14% increase in user session completion.'\n\n❌ Topic Title: 'Cloud Budget Comparison'\n✅ Action Title: 'Reserved instances will save $85,000 annually compared to on-demand pricing.'",
            realWorldUsage: "Board meeting decks, investor pitch presentations, steering committee reviews.",
            commonMistakes: "Using 1-word titles ('Overview', 'Metrics', 'Background') that force the reader to decipher the data independently.",
            bestPractices: "Make the title font prominent and bold; reserve the body for supporting visual proof.",
            practiceTask: "Rewrite 5 generic slide titles from a technical project review into executive action titles with quantified outcomes.",
            keyTakeaway: "If an executive reads only your slide titles, they should understand your entire recommendation and business rationale."
          }
        ],
        practicalExercise: "Executive Deck Lab: Design an outline for a 5-slide C-suite presentation requesting a $150,000 security compliance budget. Include Action Titles, primary data visualizations, risk callouts, and a structured Q&A defense appendix.",
        competencyVerification: "Verifies capability in C-level data storytelling, slide narrative architecture, and managing boardroom communication dynamics."
      }
    },
    {
      id: "com-mod-4",
      order: 4,
      title: "Module 4 — High-Stakes Stakeholder Alignment & Crisis Communication",
      durationMinutes: 210,
      summary: "Navigating cross-functional stakeholder conflict, managing communication during critical system outages, transparent risk escalation, and rebuilding executive trust.",
      learningObjectives: [
        "Construct multi-tier incident communication cadences for technical, executive, and external customer audiences.",
        "De-escalate high-tension stakeholder conflicts by aligning on shared organizational goals and objective data.",
        "Communicate technical debt, security vulnerabilities, and architectural trade-offs without defensive posturing.",
        "Write transparent, blameless Post-Mortem summaries that reassure leadership and reinforce systemic reliability."
      ],
      resources: [
        {
          title: "Google SRE Book: Postmortem Culture & Crisis Communications",
          url: "https://sre.google/sre-book/postmortem-culture/",
          description: "Industry-standard frameworks for blameless incident reviews, executive escalation, and transparency.",
          type: "guide",
          provider: "Google"
        },
        {
          title: "Harvard Business Review: How to Communicate in a Crisis",
          url: "https://hbr.org/2020/04/communicating-through-a-crisis",
          description: "Strategic principles for executive communication when systems fail and stakeholder trust is on the line.",
          type: "article",
          provider: "Harvard Business Review"
        }
      ],
      content: {
        overview: "In times of severe operational crisis or major cross-functional tension, effective communication separates exceptional leaders from reactive managers. Clear, transparent, cadence-driven updates replace panic with trust. Blameless post-mortems and proactive risk escalation demonstrate organizational maturity and engineering rigor.",
        keyConcepts: [
          {
            section: "Section 1 — Crisis Communication Protocols",
            topic: "Incident Communication & Escalation",
            title: "Lesson 1 — The 3-Tier Incident Communication Cadence",
            prerequisites: "Modules 1–3.",
            description: "Executing structured communication during major production incidents across engineering teams, executive leadership, and enterprise customers.",
            whyItMatters: "During a P0 outage, lack of communication causes executive anxiety, leading to micromanagement and distracted engineers. A predictable cadence keeps leadership informed while engineering focuses on remediation.",
            howItWorks: "Establish 3 distinct streams: 1. Technical War Room (continuous, granular). 2. Executive Incident Slack/Email (every 30 mins: Impact, Status, ETA). 3. Customer Status Page (objective, empathetic, SLA-aligned).",
            stepByStep: [
              "Step 1: Appoint a dedicated Incident Communications Lead separate from the Incident Commander.",
              "Step 2: Emit initial 'Under Investigation' alert within 10 minutes of severity confirmation.",
              "Step 3: Publish 30-minute status cadence: What is known, what is ruled out, current mitigation step, next update time.",
              "Step 4: Post-recovery: Publish immediate resolution summary followed by full blameless post-mortem within 48 hours."
            ],
            workedExample: "Executive Crisis Update Template:\n\n'INCIDENT STATUS UPDATE #3 [P0 — Core API Outage]\n• Current Status: MITIGATING (Traffic rerouted to secondary cluster; 70% error rate reduced to 4%).\n• Customer Impact: ~3,200 active users experienced login failures between 09:15 and 09:48 EST.\n• Root Cause Hypothesis: Memory leak in auth token verification service following deployment v2.14.0.\n• Immediate Action: Rolled back to v2.13.9 completed at 09:50 EST. Monitoring system stabilization.\n• Next Update: 10:30 EST (or upon full recovery).'",
            realWorldUsage: "Major cloud outages, data security incident response, regulatory compliance disclosures.",
            commonMistakes: "Promising unrealistic recovery ETAs prematurely, or going silent for 2 hours while debugging.",
            bestPractices: "Always commit to a specific 'Next Update Time' even if there is no new technical progress to report.",
            practiceTask: "Draft a complete crisis communication package (Internal Executive Update + External Customer Notice) for a simulated 2-hour payment processor outage.",
            keyTakeaway: "In a crisis, speed, honesty, and predictable cadence build more trust than perfection."
          }
        ],
        practicalExercise: "Crisis Escalation Lab: Capacity Connect suffers a data synchronization failure impacting 5,000 enterprise user accounts. Draft the executive escalation memo to the CEO, outline the 30-minute communication cadence, and write the customer-facing post-incident review (PIR) summary.",
        competencyVerification: "Verifies mastery of high-stakes crisis leadership, stakeholder negotiation, and executive reputation management."
      }
    }
  ]
};
