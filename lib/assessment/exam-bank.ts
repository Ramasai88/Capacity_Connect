export interface QuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface ExamQuestion {
  id: string;
  topic: "Variables" | "OOP" | "AsyncIO" | "Thread Synchronization" | "Microservices Architecture";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question: string;
  options: QuestionOption[];
  correctAnswer: "A" | "B" | "C" | "D"; // Server-only!
}

export interface ClientQuestion {
  id: string;
  topic: "Variables" | "OOP" | "AsyncIO" | "Thread Synchronization" | "Microservices Architecture";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question: string;
  options: QuestionOption[];
}

export interface DiagnosticExam {
  id: string;
  title: string;
  description: string;
  competencyCode: string;
  durationMinutes: number;
  totalQuestions: number;
  topics: string[];
  questions: ExamQuestion[];
}

export const TOPIC_CONCEPTS: Record<string, string[]> = {
  "Thread Synchronization": [
    "Python GIL (Global Interpreter Lock)",
    "Lock vs RLock (Reentrant Locks)",
    "Thread synchronization primitives",
    "Event objects for thread signaling",
    "Semaphore & BoundedSemaphore",
    "Thread-safe Queues & race conditions",
  ],
  "AsyncIO": [
    "Event loop & cooperative multitasking",
    "asyncio.gather() & Task concurrency",
    "Handling CPU-bound work in AsyncIO",
    "run_in_executor() thread pooling",
    "Blocking vs non-blocking socket operations",
    "Coroutines vs Generators",
  ],
  "Microservices Architecture": [
    "Saga Pattern (Choreography vs Orchestration)",
    "Circuit Breaker & Retry resilience",
    "API Gateway pattern & rate limiting",
    "Event-driven architecture",
    "Kafka / RabbitMQ asynchronous messaging",
    "Distributed tracing & Idempotency",
  ],
  "OOP": [
    "Method Resolution Order (MRO) & C3 Linearization",
    "Abstract Base Classes (abc.ABC)",
    "Metaclasses (__new__ vs __init__)",
    "Inheritance vs Composition",
    "Dunder methods & Encapsulation",
  ],
  "Variables": [
    "Memory model & object reference binding",
    "Mutability vs Immutability semantics",
    "Scope resolution (LEGB rule)",
    "Variable shadowing & closures",
    "Garbage collection & reference counting",
  ],
};

export const PYTHON_ADVANCED_EXAM: DiagnosticExam = {
  id: "exam-python-advanced",
  title: "Python Advanced Architecture Diagnostic Exam",
  description: "Comprehensive diagnostic assessment evaluating Python variables & memory models, OOP architecture, AsyncIO event loops, Thread Synchronization, and Microservices design.",
  competencyCode: "comp-py-adv",
  durationMinutes: 25,
  totalQuestions: 20,
  topics: ["Variables", "OOP", "AsyncIO", "Thread Synchronization", "Microservices Architecture"],
  questions: [
    // -------------------------------------------------------------------------
    // TOPIC 1: Variables (4 Questions)
    // -------------------------------------------------------------------------
    {
      id: "py-var-1",
      topic: "Variables",
      difficulty: "EASY",
      question: "In Python, how are variables and memory references managed for immutable objects such as integers and strings?",
      options: [
        { id: "A", text: "Variables store values directly inside their local stack frame memory without reference pointers." },
        { id: "B", text: "Variables are named references pointing to objects allocated on the heap; rebinding creates or points to a new object." },
        { id: "C", text: "Variables allocate a fixed-size heap buffer that is overwritten directly when reassigned." },
        { id: "D", text: "Variables are always passed by value in function calls, creating an isolated duplicate copy." },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-var-2",
      topic: "Variables",
      difficulty: "MEDIUM",
      question: "What is the primary danger of using a mutable object (like a list or dict) as a default parameter in a Python function definition?",
      options: [
        { id: "A", text: "It causes an immediate TypeError when the module is imported." },
        { id: "B", text: "The default object is evaluated once at function definition time and shared across all subsequent invocations." },
        { id: "C", text: "Python garbage collects the default parameter after the first execution, causing a NameError." },
        { id: "D", text: "It converts the parameter into a global variable inaccessible outside its enclosing scope." },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-var-3",
      topic: "Variables",
      difficulty: "MEDIUM",
      question: "In Python's LEGB variable scoping rule, what does LEGB stand for?",
      options: [
        { id: "A", text: "Lexical, External, Generic, Base" },
        { id: "B", text: "Local, Enclosing, Global, Built-in" },
        { id: "C", text: "Logical, Environment, Group, Binary" },
        { id: "D", text: "Linked, Extended, Global, Block" },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-var-4",
      topic: "Variables",
      difficulty: "HARD",
      question: "What is the difference between the 'is' operator and the '==' operator in Python?",
      options: [
        { id: "A", text: "'is' checks memory identity (same object address), while '==' checks equality of values." },
        { id: "B", text: "'is' compares string contents, while '==' compares numeric representations." },
        { id: "C", text: "'is' invokes the __eq__ dunder method, while '==' checks byte hash values." },
        { id: "D", text: "'is' checks type compatibility, while '==' checks reference pointers." },
      ],
      correctAnswer: "A",
    },

    // -------------------------------------------------------------------------
    // TOPIC 2: OOP (4 Questions)
    // -------------------------------------------------------------------------
    {
      id: "py-oop-1",
      topic: "OOP",
      difficulty: "EASY",
      question: "What algorithm does Python 3 use to resolve Method Resolution Order (MRO) in multiple inheritance hierarchies?",
      options: [
        { id: "A", text: "Depth-First Search (DFS) with cyclic backoff" },
        { id: "B", text: "C3 Linearization algorithm" },
        { id: "C", text: "Breadth-First Topological sort" },
        { id: "D", text: "Dijkstra's Shortest Inheritance Path" },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-oop-2",
      topic: "OOP",
      difficulty: "MEDIUM",
      question: "What is the purpose of defining '__slots__' in a custom Python class?",
      options: [
        { id: "A", text: "To prevent inheritance from any subclass." },
        { id: "B", text: "To replace the dynamic '__dict__' attribute dictionary, optimizing memory and attribute access." },
        { id: "C", text: "To automatically generate thread-safe mutex locks for every class method." },
        { id: "D", text: "To make instances of the class serializable directly into JSON." },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-oop-3",
      topic: "OOP",
      difficulty: "MEDIUM",
      question: "How does the '@property' decorator enhance object-oriented encapsulation in Python?",
      options: [
        { id: "A", text: "It converts an instance method into a static method that can be called without an instance." },
        { id: "B", text: "It allows a method to be accessed like an attribute while enabling getter, setter, and deleter logic." },
        { id: "C", text: "It encrypts the underlying attribute values in RAM." },
        { id: "D", text: "It forces subclasses to override the decorated attribute." },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-oop-4",
      topic: "OOP",
      difficulty: "HARD",
      question: "When creating a custom Metaclass in Python by inheriting from 'type', which dunder method controls class object creation before initialization?",
      options: [
        { id: "A", text: "__init__" },
        { id: "B", text: "__new__" },
        { id: "C", text: "__call__" },
        { id: "D", text: "__prepare__" },
      ],
      correctAnswer: "B",
    },

    // -------------------------------------------------------------------------
    // TOPIC 3: AsyncIO (4 Questions)
    // -------------------------------------------------------------------------
    {
      id: "py-async-1",
      topic: "AsyncIO",
      difficulty: "EASY",
      question: "What core concurrency model powers Python's AsyncIO framework?",
      options: [
        { id: "A", text: "Preemptive multi-threaded time slicing" },
        { id: "B", text: "Single-threaded cooperative multitasking driven by an event loop and non-blocking I/O" },
        { id: "C", text: "Kernel-level multi-processing with shared memory pointers" },
        { id: "D", text: "Distributed actor model with remote message queues" },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-async-2",
      topic: "AsyncIO",
      difficulty: "MEDIUM",
      question: "What occurs if you execute a long-running CPU-bound blocking call (e.g. time.sleep(10)) inside an async coroutine without offloading it?",
      options: [
        { id: "A", text: "AsyncIO automatically spawns a background thread to handle the blocking call." },
        { id: "B", text: "The entire event loop is blocked, freezing all other concurrent tasks from progressing." },
        { id: "C", text: "The coroutine raises an AsyncBlockedError and terminates gracefully." },
        { id: "D", text: "The Python interpreter switches execution to another CPU core." },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-async-3",
      topic: "AsyncIO",
      difficulty: "MEDIUM",
      question: "Which AsyncIO construct is designed to safely execute multiple coroutines concurrently and gather their results in order?",
      options: [
        { id: "A", text: "asyncio.gather(*coroutines)" },
        { id: "B", text: "asyncio.thread_pool_map()" },
        { id: "C", text: "asyncio.fork_join()" },
        { id: "D", text: "asyncio.synchronize_all()" },
      ],
      correctAnswer: "A",
    },
    {
      id: "py-async-4",
      topic: "AsyncIO",
      difficulty: "HARD",
      question: "How should blocking synchronous I/O or heavy CPU functions be integrated into an AsyncIO application to avoid freezing the event loop?",
      options: [
        { id: "A", text: "By wrapping them in an asynchronous generator function." },
        { id: "B", text: "By using 'await loop.run_in_executor(None, sync_function)' to delegate execution to a ThreadPoolExecutor." },
        { id: "C", text: "By increasing the event loop clock frequency via asyncio.set_speed()." },
        { id: "D", text: "By calling asyncio.yield_now() after every line of synchronous code." },
      ],
      correctAnswer: "B",
    },

    // -------------------------------------------------------------------------
    // TOPIC 4: Thread Synchronization (4 Questions)
    // -------------------------------------------------------------------------
    {
      id: "py-thread-1",
      topic: "Thread Synchronization",
      difficulty: "EASY",
      question: "What is the Global Interpreter Lock (GIL) in CPython and what is its primary impact?",
      options: [
        { id: "A", text: "A mutex that prevents multiple native threads from executing Python bytecode concurrently in a single process." },
        { id: "B", text: "A security sandbox preventing Python scripts from accessing external OS network sockets." },
        { id: "C", text: "A disk encryption lock that protects Python virtual environments." },
        { id: "D", text: "A database transaction lock used by the sqlite3 library." },
      ],
      correctAnswer: "A",
    },
    {
      id: "py-thread-2",
      topic: "Thread Synchronization",
      difficulty: "MEDIUM",
      question: "What is the key difference between a threading.Lock and a threading.RLock in Python?",
      options: [
        { id: "A", text: "RLock is a reentrant lock that can be acquired multiple times by the same thread without causing a deadlock." },
        { id: "B", text: "RLock runs on remote network nodes, while Lock runs locally." },
        { id: "C", text: "Lock is asynchronous, while RLock is strictly synchronous." },
        { id: "D", text: "RLock releases automatically after a 500ms timeout." },
      ],
      correctAnswer: "A",
    },
    {
      id: "py-thread-3",
      topic: "Thread Synchronization",
      difficulty: "MEDIUM",
      question: "Which synchronization primitive allows one or more threads to wait until a specific notification or flag is set by another thread?",
      options: [
        { id: "A", text: "threading.Event" },
        { id: "B", text: "threading.Pipe" },
        { id: "C", text: "threading.AtomicInteger" },
        { id: "D", text: "threading.MemoryBarrier" },
      ],
      correctAnswer: "A",
    },
    {
      id: "py-thread-4",
      topic: "Thread Synchronization",
      difficulty: "HARD",
      question: "When managing a pool of limited shared resources (e.g. database connection pool of size 5), which synchronization primitive controls access via a counter?",
      options: [
        { id: "A", text: "threading.Semaphore" },
        { id: "B", text: "threading.Barrier" },
        { id: "C", text: "threading.ConditionVariable" },
        { id: "D", text: "threading.Future" },
      ],
      correctAnswer: "A",
    },

    // -------------------------------------------------------------------------
    // TOPIC 5: Microservices Architecture (4 Questions)
    // -------------------------------------------------------------------------
    {
      id: "py-micro-1",
      topic: "Microservices Architecture",
      difficulty: "EASY",
      question: "In microservice architectures, what pattern is used to distribute and handle cross-service transactions without traditional two-phase locking?",
      options: [
        { id: "A", text: "Saga Pattern (Choreography or Orchestration with compensating transactions)" },
        { id: "B", text: "Singleton State Engine" },
        { id: "C", text: "Monolithic Shared Database Locking" },
        { id: "D", text: "Direct Point-to-Point Socket Polling" },
      ],
      correctAnswer: "A",
    },
    {
      id: "py-micro-2",
      topic: "Microservices Architecture",
      difficulty: "MEDIUM",
      question: "What is the primary role of the Circuit Breaker pattern in resilient microservice communication?",
      options: [
        { id: "A", text: "To encrypt incoming HTTP requests with AES-256." },
        { id: "B", text: "To prevent cascading failures by failing fast when a downstream dependency is unhealthy." },
        { id: "C", text: "To compress JSON payloads across REST endpoints." },
        { id: "D", text: "To automatically restart crashed Docker containers." },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-micro-3",
      topic: "Microservices Architecture",
      difficulty: "MEDIUM",
      question: "Why is an API Gateway commonly placed between external clients and backend microservices?",
      options: [
        { id: "A", text: "To eliminate the need for microservice unit tests." },
        { id: "B", text: "To provide centralized routing, SSL termination, authentication, rate limiting, and request aggregation." },
        { id: "C", text: "To merge all microservice databases into a single SQLite file." },
        { id: "D", text: "To convert all Python code into C++ at runtime." },
      ],
      correctAnswer: "B",
    },
    {
      id: "py-micro-4",
      topic: "Microservices Architecture",
      difficulty: "HARD",
      question: "What is the primary advantage of event-driven architecture using Kafka or RabbitMQ over synchronous REST calls in high-throughput systems?",
      options: [
        { id: "A", text: "Temporal decoupling, buffering traffic spikes, and asynchronous event distribution without blocking producers." },
        { id: "B", text: "Zero network latency." },
        { id: "C", text: "Automatic database schema migration." },
        { id: "D", text: "Guaranteed single-threaded execution across the cluster." },
      ],
      correctAnswer: "A",
    },
  ],
};

/**
 * Return client-sanitized exam questions (WITHOUT correctAnswer).
 */
export function getClientExam(examId: string = "exam-python-advanced") {
  const exam = PYTHON_ADVANCED_EXAM;
  const clientQuestions: ClientQuestion[] = exam.questions.map((q) => ({
    id: q.id,
    topic: q.topic,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
  }));

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    competencyCode: exam.competencyCode,
    durationMinutes: exam.durationMinutes,
    totalQuestions: exam.totalQuestions,
    topics: exam.topics,
    questions: clientQuestions,
  };
}

export interface SubmittedAnswer {
  questionId: string;
  selectedOption: string;
}

export interface EvaluationResult {
  examId: string;
  title: string;
  competencyCode: string;
  score: number; // Percentage 0 - 100
  totalQuestions: number;
  correctQuestions: number;
  topicBreakdown: Array<{
    topic: string;
    score: number;
    totalQuestions: number;
    correctQuestions: number;
  }>;
  detailedResults: Array<{
    questionId: string;
    topic: string;
    isCorrect: boolean;
  }>;
}

/**
 * Server-side exam evaluation: compares submitted answers against canonical question bank.
 */
export function evaluateExam(
  examId: string = "exam-python-advanced",
  answers: SubmittedAnswer[]
): EvaluationResult {
  const exam = PYTHON_ADVANCED_EXAM;
  const answersMap = new Map<string, string>();
  for (const a of answers) {
    answersMap.set(a.questionId, a.selectedOption?.toUpperCase()?.trim());
  }

  let totalCorrect = 0;
  const detailedResults: EvaluationResult["detailedResults"] = [];

  // Group by topic
  const topicStats: Record<string, { total: number; correct: number }> = {};
  for (const t of exam.topics) {
    topicStats[t] = { total: 0, correct: 0 };
  }

  for (const q of exam.questions) {
    const selected = answersMap.get(q.id);
    const isCorrect = selected === q.correctAnswer;

    if (isCorrect) {
      totalCorrect++;
    }

    const currentStat = topicStats[q.topic] || { total: 0, correct: 0 };
    currentStat.total += 1;
    if (isCorrect) {
      currentStat.correct += 1;
    }
    topicStats[q.topic] = currentStat;

    detailedResults.push({
      questionId: q.id,
      topic: q.topic,
      isCorrect,
    });
  }

  const overallScore = Math.round((totalCorrect / exam.totalQuestions) * 100);

  const topicBreakdown = Object.entries(topicStats).map(([topic, stats]) => ({
    topic,
    score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    totalQuestions: stats.total,
    correctQuestions: stats.correct,
  }));

  return {
    examId: exam.id,
    title: exam.title,
    competencyCode: exam.competencyCode,
    score: overallScore,
    totalQuestions: exam.totalQuestions,
    correctQuestions: totalCorrect,
    topicBreakdown,
    detailedResults,
  };
}
