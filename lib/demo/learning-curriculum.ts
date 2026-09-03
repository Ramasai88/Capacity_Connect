export interface CourseModule {
  id: string;
  order: number;
  title: string;
  durationMinutes: number;
  summary: string;
  learningObjectives: string[];
  content: {
    overview: string;
    keyConcepts: { title: string; description: string; codeSnippet?: string }[];
    practicalExercise: string;
    competencyVerification: string;
  };
}

export interface CourseCurriculum {
  courseId: string;
  totalDurationMinutes: number;
  modules: CourseModule[];
}

export const COURSE_CURRICULA: Record<string, CourseCurriculum> = {
  "course-py-401": {
    courseId: "course-py-401",
    totalDurationMinutes: 1440, // 24 hours
    modules: [
      {
        id: "py-mod-1",
        order: 1,
        title: "Module 1 — Python Advanced Fundamentals & Data Structures",
        durationMinutes: 240,
        summary: "Master advanced data structures, generators, comprehensions, and memory-efficient iterators.",
        learningObjectives: [
          "Understand memory footprint of dicts, sets, and lists in CPython",
          "Implement custom iterator protocols and generator pipelines",
          "Use context managers and the `contextlib` standard module",
        ],
        content: {
          overview:
            "CPython manages memory and data structures using reference counting and cyclic garbage collection. At Level 4 proficiency, software engineers must write performant code that minimizes memory allocations and utilizes iterators over in-memory collections for large datasets.",
          keyConcepts: [
            {
              title: "Custom Iterator Protocol & Generators",
              description:
                "Generators evaluate lazily, reducing peak memory usage from O(N) to O(1) when streaming large data payloads.",
              codeSnippet: `def stream_large_dataset(filepath: str):\n    with open(filepath, "r", encoding="utf-8") as f:\n        for line in f:\n            yield process_raw_record(line.strip())`,
            },
            {
              title: "Context Managers and Resource Cleanup",
              description:
                "Ensure transactional rollback or socket closure using contextmanager decorators.",
              codeSnippet: `from contextlib import contextmanager\n\n@contextmanager\ndef managed_transaction(db_pool):\n    conn = db_pool.acquire()\n    try:\n        yield conn\n        conn.commit()\n    except Exception:\n        conn.rollback()\n        raise\n    finally:\n        db_pool.release(conn)`,
            },
          ],
          practicalExercise:
            "Implement a streaming log parser that processes a 10GB access log file with less than 50MB resident memory footprint.",
          competencyVerification:
            "Verifies Level 4 Python standard for memory-efficient backend data pipelines.",
        },
      },
      {
        id: "py-mod-2",
        order: 2,
        title: "Module 2 — Async Programming & Event Loop Internals",
        durationMinutes: 240,
        summary: "Deep dive into `asyncio`, non-blocking I/O, coroutines, and task cancellation semantics.",
        learningObjectives: [
          "Master the `asyncio` event loop lifecycle and task scheduling",
          "Implement concurrency with `asyncio.gather` and `asyncio.TaskGroup`",
          "Handle timeouts, cancellations, and exception propagation in async workflows",
        ],
        content: {
          overview:
            "Asynchronous programming in Python leverages cooperative multitasking via an event loop. Understanding coroutine suspension points (`await`) is critical for building high-throughput microservices and API gateways.",
          keyConcepts: [
            {
              title: "Structured Concurrency with TaskGroups (Python 3.11+)",
              description:
                "TaskGroups guarantee that all spawned background child coroutines either finish or cancel cleanly upon failure.",
              codeSnippet: `async def fetch_aggregated_metrics(employee_ids: list[str]):\n    results = {}\n    async with asyncio.TaskGroup() as tg:\n        for emp_id in employee_ids:\n            tg.create_task(fetch_employee_gaps(emp_id, results))\n    return results`,
            },
          ],
          practicalExercise:
            "Build an asynchronous batch evaluator that verifies competency matrices across 500 employees concurrently with rate-limiting.",
          competencyVerification:
            "Demonstrates non-blocking microservice backend architecture capabilities.",
        },
      },
      {
        id: "py-mod-3",
        order: 3,
        title: "Module 3 — Multi-Threading, Multiprocessing & GIL Bypass",
        durationMinutes: 240,
        summary: "Architecting CPU-bound vs I/O-bound workflows using ProcessPoolExecutors and C-extensions.",
        learningObjectives: [
          "Differentiate Global Interpreter Lock (GIL) constraints on CPU vs I/O workloads",
          "Employ `concurrent.futures.ProcessPoolExecutor` for parallel compute",
          "Share memory across processes using `multiprocessing.shared_memory`",
        ],
        content: {
          overview:
            "When performing heavy computational tasks such as skill-gap matrix crunching or dataset tokenization, standard Python threads are bound by the GIL. Multiprocessing bypasses the GIL by spawning discrete OS processes with isolated Python runtimes.",
          keyConcepts: [
            {
              title: "Process Pool Parallelization",
              description:
                "Offload matrix computations across all CPU cores with zero GIL contention.",
              codeSnippet: `from concurrent.futures import ProcessPoolExecutor\n\ndef compute_organization_gaps(org_payload):\n    with ProcessPoolExecutor(max_workers=4) as executor:\n        results = list(executor.map(calculate_employee_gap, org_payload))\n    return results`,
            },
          ],
          practicalExercise:
            "Convert a single-threaded batch matrix calculation into a parallel multicore worker pool.",
          competencyVerification:
            "Evaluates high-scale computational parallelization for Level 4 Engineers.",
        },
      },
      {
        id: "py-mod-4",
        order: 4,
        title: "Module 4 — Memory Management & Profiling",
        durationMinutes: 240,
        summary: "Diagnose memory leaks, inspect object graphs, and use `tracemalloc` and `cProfile`.",
        learningObjectives: [
          "Profile runtime bottlenecks with `cProfile` and FlameGraphs",
          "Trace memory allocations with `tracemalloc`",
          "Identify cyclic references preventing garbage collection",
        ],
        content: {
          overview:
            "Senior engineers must diagnose production slowdowns before they cause outages. This module covers telemetry, CPU profiling snapshots, and heap analysis.",
          keyConcepts: [
            {
              title: "Heap Allocation Tracing",
              description:
                "Snapshot object allocations before and after critical batch executions.",
              codeSnippet: `import tracemalloc\n\ntracemalloc.start()\nsnapshot1 = tracemalloc.take_snapshot()\n# Execute workload\nsnapshot2 = tracemalloc.take_snapshot()\ntop_stats = snapshot2.compare_to(snapshot1, 'lineno')\nfor stat in top_stats[:5]:\n    print(stat)`,
            },
          ],
          practicalExercise:
            "Identify and eliminate a cyclic reference leak in an employee competency historical logger.",
          competencyVerification:
            "Validates diagnostics and production telemetry capabilities.",
        },
      },
      {
        id: "py-mod-5",
        order: 5,
        title: "Module 5 — Metaprogramming, Descriptors & Decorators",
        durationMinutes: 240,
        summary: "Build framework-level abstractions, class decorators, custom descriptors, and `__init_subclass__` hooks.",
        learningObjectives: [
          "Implement custom property descriptors with type validation",
          "Use `__init_subclass__` for plugin registration without metaclass complexity",
          "Write parameterized decorators preserving function signatures with `functools.wraps`",
        ],
        content: {
          overview:
            "Metaprogramming enables building elegant internal SDKs, ORMs, and validation frameworks. Learn how Python's descriptor protocol powers properties and SQLAlchemy/Prisma bindings.",
          keyConcepts: [
            {
              title: "Validated Level Field Descriptor",
              description:
                "Enforce 1-5 integer scale constraints directly at class attribute assignment.",
              codeSnippet: `class CompetencyLevelField:\n    def __set_name__(self, owner, name):\n        self.name = name\n    def __set__(self, instance, value):\n        if not (1 <= value <= 5):\n            raise ValueError(f"{self.name} must be between 1 and 5")\n        instance.__dict__[self.name] = value`,
            },
          ],
          practicalExercise:
            "Create a declarative role matrix schema validator using descriptors.",
          competencyVerification:
            "Demonstrates framework design and code abstraction mastery.",
        },
      },
      {
        id: "py-mod-6",
        order: 6,
        title: "Module 6 — Production Architecture & Metaprogramming",
        durationMinutes: 240,
        summary: "Production readiness: Clean Architecture, domain-driven design, and resilient API contracts.",
        learningObjectives: [
          "Structure modular Python repositories following Clean Architecture",
          "Enforce separation between domain entities and database adapters",
          "Prepare artifacts for production deployment with type contracts",
        ],
        content: {
          overview:
            "The final milestone integrates all concepts into a production-grade backend service adhering to enterprise standards. Complete this module to submit your skill upgrade verification request.",
          keyConcepts: [
            {
              title: "Domain-Driven Service Boundary",
              description:
                "Decouple business calculation logic completely from web framework route handlers.",
              codeSnippet: `class SkillGapService:\n    def __init__(self, repository: CompetencyRepository):\n        self.repository = repository\n    def evaluate_employee(self, emp_id: str) -> SkillGapSummary:\n        required = self.repository.get_role_requirements(emp_id)\n        current = self.repository.get_current_competencies(emp_id)\n        return calculate_skill_gap(required, current)`,
            },
          ],
          practicalExercise:
            "Assemble a complete, production-ready Capacity Connect Skill Gap backend module with full unit test coverage.",
          competencyVerification:
            "Final verification milestone to elevate competency to Level 4 (Advanced / Specialist).",
        },
      },
    ],
  },

  "course-ml-402": {
    courseId: "course-ml-402",
    totalDurationMinutes: 1920,
    modules: [
      {
        id: "ml-mod-1",
        order: 1,
        title: "Module 1 — Mathematical Foundations & Loss Landscapes",
        durationMinutes: 240,
        summary: "Gradient descent dynamics, convex optimization, and matrix calculus.",
        learningObjectives: ["Matrix derivatives", "Optimization algorithms (AdamW, SGD)"],
        content: {
          overview: "Mathematical fundamentals required for designing custom deep neural network layers and loss functions.",
          keyConcepts: [{ title: "Backpropagation Calculus", description: "Analytical computation of gradients across chain-rule computational graphs." }],
          practicalExercise: "Implement backprop from scratch in NumPy.",
          competencyVerification: "Verifies foundational mathematical depth for ML Level 4.",
        },
      },
      {
        id: "ml-mod-2",
        order: 2,
        title: "Module 2 — Advanced Feature Engineering & Ensembles",
        durationMinutes: 240,
        summary: "Target encoding, feature crosses, and XGBoost/LightGBM hyperparameter optimization.",
        learningObjectives: ["Cross-validated target encoding", "GBDT regularization"],
        content: {
          overview: "Feature pipelines that maximize signal-to-noise ratio in tabular enterprise datasets.",
          keyConcepts: [{ title: "Gradient Boosted Trees", description: "Iterative residual fitting with early stopping." }],
          practicalExercise: "Build an automated feature selection pipeline.",
          competencyVerification: "Validates high-performing tabular model engineering.",
        },
      },
      {
        id: "ml-mod-3",
        order: 3,
        title: "Module 3 — PyTorch Deep Learning Architecture",
        durationMinutes: 240,
        summary: "Custom Modules, Dataset loaders, and distributed training setups.",
        learningObjectives: ["PyTorch Lightning workflows", "Mixed-precision training (FP16)"],
        content: {
          overview: "Writing production PyTorch neural networks with custom autograd functions.",
          keyConcepts: [{ title: "Torch Dynamic Graphs", description: "Efficient tensor batching and GPU acceleration." }],
          practicalExercise: "Implement a deep tabular classifier in PyTorch.",
          competencyVerification: "Deep learning framework proficiency.",
        },
      },
      {
        id: "ml-mod-4",
        order: 4,
        title: "Module 4 — Production MLOps & Real-Time Inference",
        durationMinutes: 240,
        summary: "Model registry, ONNX runtime export, and latency optimization.",
        learningObjectives: ["ONNX quantization", "Model drift monitoring"],
        content: {
          overview: "Deploying high-throughput models under 10ms P99 latency SLA.",
          keyConcepts: [{ title: "ONNX Runtime Optimization", description: "Graph pruning and FP16 quantization for low-latency scoring." }],
          practicalExercise: "Deploy an ONNX model inside a FastAPI container.",
          competencyVerification: "Qualifies candidate for Level 4 ML Specialist designation.",
        },
      },
    ],
  },

  "course-jv-401": {
    courseId: "course-jv-401",
    totalDurationMinutes: 1680,
    modules: [
      {
        id: "jv-mod-1",
        order: 1,
        title: "Module 1 — JVM Internals & Memory Architecture",
        durationMinutes: 240,
        summary: "JVM heap regions, ZGC/G1 garbage collection algorithms, and JIT compilation.",
        learningObjectives: ["Tune JVM memory parameters", "Analyze GC pause telemetry"],
        content: {
          overview: "Understanding how the HotSpot JVM optimizes bytecode into machine instructions.",
          keyConcepts: [{ title: "G1 Garbage Collector Tuning", description: "Controlling pause time goals and young generation sizing." }],
          practicalExercise: "Diagnose an OutOfMemoryError heap dump using Eclipse MAT.",
          competencyVerification: "Proves enterprise Java runtime mastery.",
        },
      },
      {
        id: "jv-mod-2",
        order: 2,
        title: "Module 2 — Reactive Microservices with Spring Boot 3",
        durationMinutes: 240,
        summary: "Spring WebFlux, Project Reactor, non-blocking R2DBC database connections.",
        learningObjectives: ["Implement reactive publisher-subscriber streams", "Backpressure management"],
        content: {
          overview: "Building resilient microservices capable of handling 50,000 concurrent socket connections.",
          keyConcepts: [{ title: "Non-blocking Event Loops", description: "Netty-based reactive HTTP dispatching." }],
          practicalExercise: "Build an event-driven skill gap event streaming pipeline.",
          competencyVerification: "Level 4 Enterprise Java architecture verification.",
        },
      },
      {
        id: "jv-mod-3",
        order: 3,
        title: "Module 3 — Distributed Transactions & Resiliency",
        durationMinutes: 240,
        summary: "Saga patterns, idempotency, Circuit Breakers, and Resilience4j.",
        learningObjectives: ["Implement Saga orchestrations", "Configure rate limiters and bulkheads"],
        content: {
          overview: "Ensuring zero data loss in distributed multi-database transactions.",
          keyConcepts: [{ title: "Saga Pattern Compensation", description: "Compensating transactions for rollback across distributed systems." }],
          practicalExercise: "Implement resilient cross-service competency assessment synchronization.",
          competencyVerification: "Final verification milestone for Level 4 Java Specialist.",
        },
      },
    ],
  },

  "course-sql-301": {
    courseId: "course-sql-301",
    totalDurationMinutes: 960,
    modules: [
      {
        id: "sql-mod-1",
        order: 1,
        title: "Module 1 — Advanced Joins, Subqueries & CTEs",
        durationMinutes: 200,
        summary: "Recursive CTEs, lateral joins, and complex relational transformations.",
        learningObjectives: ["Write hierarchical CTE queries", "Understand execution plans"],
        content: {
          overview: "Mastering complex relational querying techniques for analytical reporting.",
          keyConcepts: [{ title: "Recursive Common Table Expressions", description: "Querying organizational hierarchy graphs in a single query." }],
          practicalExercise: "Write a recursive query traversing employee managerial chains.",
          competencyVerification: "Relational querying proficiency.",
        },
      },
      {
        id: "sql-mod-2",
        order: 2,
        title: "Module 2 — Indexing Strategies & Query Optimization",
        durationMinutes: 200,
        summary: "B-Tree, GIN, BRIN indexes and EXPLAIN ANALYZE interpretation.",
        learningObjectives: ["Eliminate Seq Scans on large tables", "Design composite indexes"],
        content: {
          overview: "Optimizing PostgreSQL execution plans to reduce query latency by 90%.",
          keyConcepts: [{ title: "EXPLAIN ANALYZE Plan Inspection", description: "Diagnosing index scans vs bitmap heap scans." }],
          practicalExercise: "Index a 5-million row employee competency table for sub-5ms query times.",
          competencyVerification: "Level 3 SQL Practitioner milestone.",
        },
      },
    ],
  },

  "course-com-501": {
    courseId: "course-com-501",
    totalDurationMinutes: 840,
    modules: [
      {
        id: "com-mod-1",
        order: 1,
        title: "Module 1 — Executive Technical Storytelling & Strategy",
        durationMinutes: 200,
        summary: "Distilling complex architectural trade-offs for C-suite decision makers.",
        learningObjectives: ["Structure executive memos", "Lead alignment meetings"],
        content: {
          overview: "Mastering the art of translating technical capacity metrics into strategic business value.",
          keyConcepts: [{ title: "Pyramid Principle Communication", description: "Lead with the answer, group supporting arguments logically." }],
          practicalExercise: "Draft an executive proposal for organization-wide capacity building initiatives.",
          competencyVerification: "Level 5 Communication Master qualification.",
        },
      },
    ],
  },

  "course-ldr-401": {
    courseId: "course-ldr-401",
    totalDurationMinutes: 1200,
    modules: [
      {
        id: "ldr-mod-1",
        order: 1,
        title: "Module 1 — High-Performance Engineering Mentorship",
        durationMinutes: 240,
        summary: "Effective 1-on-1 coaching, skill gap remediation plans, and feedback frameworks.",
        learningObjectives: ["Conduct capacity reviews", "Create personalized growth roadmaps"],
        content: {
          overview: "Guiding team members through competency elevation and career development milestones.",
          keyConcepts: [{ title: "SBI Feedback Framework", description: "Situation-Behavior-Impact model for actionable coaching." }],
          practicalExercise: "Structure a 90-day competency turnaround plan for an underperforming engineer.",
          competencyVerification: "Level 4 Leadership Specialist qualification.",
        },
      },
    ],
  },
};

/**
 * Returns curriculum for a given course ID, falling back to a structured default curriculum if needed.
 */
export function getCourseCurriculum(courseId: string): CourseCurriculum {
  if (COURSE_CURRICULA[courseId]) {
    return COURSE_CURRICULA[courseId];
  }

  // Generic fallback curriculum
  return {
    courseId,
    totalDurationMinutes: 720,
    modules: [
      {
        id: `${courseId}-mod-1`,
        order: 1,
        title: "Module 1 — Core Foundations & Domain Principles",
        durationMinutes: 180,
        summary: "Foundational mastery and modern industry best practices.",
        learningObjectives: ["Core principles", "Best practices"],
        content: {
          overview: "Introduction to fundamental concepts in this subject area.",
          keyConcepts: [{ title: "Key Principle 1", description: "Comprehensive breakdown of foundational methodologies." }],
          practicalExercise: "Complete foundational exercises to demonstrate working capability.",
          competencyVerification: "Verifies foundational prerequisite compliance.",
        },
      },
      {
        id: `${courseId}-mod-2`,
        order: 2,
        title: "Module 2 — Advanced Implementation & Practical Systems",
        durationMinutes: 180,
        summary: "Hands-on execution and real-world system patterns.",
        learningObjectives: ["Implementation patterns", "Error handling"],
        content: {
          overview: "Hands-on implementation of core technical workflows.",
          keyConcepts: [{ title: "Key Principle 2", description: "Advanced patterns and architecture." }],
          practicalExercise: "Build an end-to-end practical solution.",
          competencyVerification: "Verifies intermediate implementation skill.",
        },
      },
      {
        id: `${courseId}-mod-3`,
        order: 3,
        title: "Module 3 — Enterprise Integration & Capstone Verification",
        durationMinutes: 180,
        summary: "Enterprise integration and target level qualification.",
        learningObjectives: ["Enterprise integration", "Verification"],
        content: {
          overview: "Capstone evaluation matching target competency level requirements.",
          keyConcepts: [{ title: "Capstone Milestone", description: "Comprehensive evaluation." }],
          practicalExercise: "Submit final capstone artifact for evaluation.",
          competencyVerification: "Final verification milestone for level elevation.",
        },
      },
    ],
  };
}

/**
 * Registers a newly created course curriculum in memory.
 */
export function registerCourseCurriculum(
  courseId: string,
  curriculum: {
    courseId: string;
    courseTitle: string;
    targetCompetency: string;
    targetLevel: number;
    modules: CourseModule[];
  }
) {
  const totalMinutes = curriculum.modules.reduce(
    (acc, m) => acc + (m.durationMinutes || 60),
    0
  );

  COURSE_CURRICULA[courseId] = {
    courseId,
    totalDurationMinutes: totalMinutes,
    modules: curriculum.modules,
  };
}


