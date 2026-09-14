export interface QuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface ExamQuestion {
  id: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  question: string;
  options: QuestionOption[];
  correctAnswer: "A" | "B" | "C" | "D"; // Server-only!
}

export interface ClientQuestion {
  id: string;
  topic: string;
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
  // Python & Backend
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

  // AI & ML
  "Python for AI": [
    "NumPy multidimensional array vectorization",
    "Pandas DataFrame manipulation & indexing",
    "Broadcasting rules & memory layouts",
    "Matrix multiplication & linear algebra",
  ],
  "Machine Learning": [
    "Supervised vs Unsupervised learning",
    "Bias-Variance tradeoff & Regularization (L1/L2)",
    "Ensemble methods: Random Forests & Gradient Boosting",
    "Evaluation metrics: Precision, Recall, F1, ROC-AUC",
  ],
  "Deep Learning": [
    "Neural network backpropagation & chain rule",
    "Activation functions: ReLU, GeLU, Softmax",
    "Optimization: SGD with Momentum, AdamW",
    "CNN architectures & Transformer self-attention",
  ],
  "NLP & Generative AI": [
    "Subword tokenization (BPE, WordPiece)",
    "Word embeddings & Vector databases",
    "Transformer self-attention mechanisms",
    "RAG (Retrieval-Augmented Generation) & Prompt engineering",
  ],
  "MLOps": [
    "Model registry & versioning (MLflow, DVC)",
    "Feature stores & Data drift detection",
    "Containerized model serving (ONNX, BentoML)",
    "CI/CD/CT pipelines for ML systems",
  ],

  // Java & Enterprise
  "Java Core & Memory": [
    "JVM heap vs stack memory architecture",
    "Garbage collectors (G1GC, ZGC)",
    "String pool & immutability",
    "Java Generics & type erasure",
  ],
  "OOP Architecture": [
    "SOLID design principles in Java",
    "Design patterns: Factory, Builder, Strategy",
    "Interface vs Abstract class design",
    "Composition over inheritance",
  ],
  "Spring Boot": [
    "Spring IoC container & Dependency Injection",
    "Spring Boot auto-configuration",
    "Bean scopes & lifecycle annotations",
    "Spring Security filter chain",
  ],
  "REST APIs & JPA": [
    "Spring Data JPA & Hibernate ORM",
    "N+1 query problem & Fetch joins",
    "Transaction isolation levels (@Transactional)",
    "RESTful API design and status code mapping",
  ],

  // Leadership & Management
  "Strategic Leadership": [
    "Vision alignment and organizational strategy",
    "Change management and organizational transformation",
    "Decentralized decision making & empowerment",
    "Strategic delegation and OKRs",
  ],
  "Executive Communication": [
    "Stakeholder management and executive messaging",
    "Technical storytelling & presentation design",
    "Active listening & feedback delivery",
    "Cross-functional negotiation tactics",
  ],
  "Team Management": [
    "Building high-performing engineering teams",
    "Psychological safety and trust dynamics",
    "Conflict resolution and team mediation",
    "Hiring and talent development strategies",
  ],
  "Performance Coaching": [
    "GROW coaching framework",
    "Continuous performance calibration",
    "Conducting effective 1-on-1 development reviews",
    "Mentoring and leadership succession planning",
  ],
};

// =============================================================================
// EXAM 1: Python Full Stack Developer / Software Engineer
// =============================================================================
export const PYTHON_ADVANCED_EXAM: DiagnosticExam = {
  id: "exam-python-advanced",
  title: "Python Advanced Architecture Diagnostic Exam",
  description: "Comprehensive diagnostic assessment evaluating Python variables & memory models, OOP architecture, AsyncIO event loops, Thread Synchronization, and Microservices design.",
  competencyCode: "comp-python",
  durationMinutes: 25,
  totalQuestions: 20,
  topics: ["Variables", "OOP", "AsyncIO", "Thread Synchronization", "Microservices Architecture"],
  questions: [
    // Variables
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

    // OOP
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

    // AsyncIO
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

    // Thread Synchronization
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

    // Microservices Architecture
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

// =============================================================================
// EXAM 2: ML Engineer & Data Scientist
// =============================================================================
export const ML_ENGINEER_EXAM: DiagnosticExam = {
  id: "exam-ml-engineer",
  title: "Machine Learning & AI Engineering Diagnostic Exam",
  description: "Comprehensive diagnostic assessment evaluating Python for AI, Machine Learning algorithms, Deep Learning architectures, NLP & Generative AI, and MLOps production systems.",
  competencyCode: "comp-ml",
  durationMinutes: 25,
  totalQuestions: 20,
  topics: ["Python for AI", "Machine Learning", "Deep Learning", "NLP & Generative AI", "MLOps"],
  questions: [
    // Python for AI (4)
    {
      id: "ml-py-1",
      topic: "Python for AI",
      difficulty: "EASY",
      question: "What is the primary computational benefit of using vectorized NumPy array operations over standard Python lists in data science?",
      options: [
        { id: "A", text: "NumPy arrays execute in compiled C-level contiguous memory buffers, avoiding Python interpreter loop overhead." },
        { id: "B", text: "NumPy automatically compiles code into WebAssembly." },
        { id: "C", text: "NumPy bypasses operating system security boundaries." },
        { id: "D", text: "NumPy eliminates the need for RAM by streaming from disk." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-py-2",
      topic: "Python for AI",
      difficulty: "MEDIUM",
      question: "In NumPy broadcasting, what condition must two array dimensions satisfy to be compatible?",
      options: [
        { id: "A", text: "They must be identical in all dimensions without exception." },
        { id: "B", text: "Dimensions must either be equal, or one of the dimensions must be 1." },
        { id: "C", text: "One dimension must be exactly double the size of the other." },
        { id: "D", text: "Dimensions must both be prime numbers." },
      ],
      correctAnswer: "B",
    },
    {
      id: "ml-py-3",
      topic: "Python for AI",
      difficulty: "MEDIUM",
      question: "In Pandas, what is the key difference between DataFrame.loc and DataFrame.iloc?",
      options: [
        { id: "A", text: "loc uses label-based indexing, whereas iloc uses integer position-based indexing." },
        { id: "B", text: "loc is for columns only, iloc is for rows only." },
        { id: "C", text: "iloc is deprecated in Pandas 2.0." },
        { id: "D", text: "loc converts data to float, iloc converts data to int." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-py-4",
      topic: "Python for AI",
      difficulty: "HARD",
      question: "When computing matrix multiplications with high-dimensional tensors, why is memory alignment (C-contiguous vs Fortran-contiguous) critical for performance?",
      options: [
        { id: "A", text: "Contiguous row-major memory optimizes CPU/GPU cache line spatial locality, minimizing cache misses during GEMM operations." },
        { id: "B", text: "Fortran ordering allows infinite tensor depth." },
        { id: "C", text: "Non-contiguous tensors cause immediate hardware interrupts." },
        { id: "D", text: "Memory alignment only affects 64-bit integer values." },
      ],
      correctAnswer: "A",
    },

    // Machine Learning (4)
    {
      id: "ml-core-1",
      topic: "Machine Learning",
      difficulty: "EASY",
      question: "What is the primary difference between L1 (Lasso) and L2 (Ridge) regularization in linear models?",
      options: [
        { id: "A", text: "L1 regularization drives coefficients strictly to zero (feature selection), while L2 shrinks coefficients asymptotically towards zero." },
        { id: "B", text: "L2 eliminates features completely, while L1 only scales features." },
        { id: "C", text: "L1 only works on classification models." },
        { id: "D", text: "L2 ignores collinearity between features." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-core-2",
      topic: "Machine Learning",
      difficulty: "MEDIUM",
      question: "In highly imbalanced binary classification (e.g. 99% negative, 1% positive), why is standard Accuracy a deceptive evaluation metric?",
      options: [
        { id: "A", text: "A naive model predicting only the majority class achieves 99% accuracy while having 0% recall on the critical minority class." },
        { id: "B", text: "Accuracy cannot be calculated as a percentage." },
        { id: "C", text: "Imbalanced datasets cause floating-point arithmetic overflow." },
        { id: "D", text: "Accuracy is only defined for multi-class problems." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-core-3",
      topic: "Machine Learning",
      difficulty: "MEDIUM",
      question: "How does Gradient Boosting differ fundamentally from Random Forest in ensemble construction?",
      options: [
        { id: "A", text: "Random Forest trains independent trees in parallel (bagging), while Gradient Boosting trains trees sequentially, with each tree predicting the pseudo-residuals of the previous ensemble." },
        { id: "B", text: "Random Forest uses linear regression, while Gradient Boosting uses clustering." },
        { id: "C", text: "Gradient Boosting does not support decision trees." },
        { id: "D", text: "Random Forest always requires fewer data points." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-core-4",
      topic: "Machine Learning",
      difficulty: "HARD",
      question: "What does the Bias-Variance tradeoff dictate when increasing model complexity?",
      options: [
        { id: "A", text: "Bias decreases while variance increases, increasing risk of overfitting to training noise." },
        { id: "B", text: "Both bias and variance increase simultaneously." },
        { id: "C", text: "Bias and variance both drop to zero permanently." },
        { id: "D", text: "Variance decreases while bias increases." },
      ],
      correctAnswer: "A",
    },

    // Deep Learning (4)
    {
      id: "ml-dl-1",
      topic: "Deep Learning",
      difficulty: "EASY",
      question: "Why is the Rectified Linear Unit (ReLU) activation function widely preferred over Sigmoid in deep neural networks?",
      options: [
        { id: "A", text: "ReLU avoids vanishing gradients for positive activations and is computationally inexpensive to evaluate." },
        { id: "B", text: "ReLU squashes values strictly between 0 and 1." },
        { id: "C", text: "ReLU eliminates the need for backpropagation." },
        { id: "D", text: "ReLU is non-continuous and non-differentiable everywhere." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-dl-2",
      topic: "Deep Learning",
      difficulty: "MEDIUM",
      question: "In Convolutional Neural Networks (CNNs), what is the key advantage of shared filter weights over fully connected layers for image processing?",
      options: [
        { id: "A", text: "Translation invariance and a drastic reduction in parameter count compared to dense connections." },
        { id: "B", text: "CNNs guarantee 100% convergence in one epoch." },
        { id: "C", text: "CNNs only process 1-dimensional audio data." },
        { id: "D", text: "Shared weights eliminate the need for GPU memory." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-dl-3",
      topic: "Deep Learning",
      difficulty: "MEDIUM",
      question: "What is the primary role of Batch Normalization in deep network training?",
      options: [
        { id: "A", text: "It standardizes mini-batch layer inputs, mitigating internal covariate shift and allowing higher learning rates." },
        { id: "B", text: "It converts floating point weights into 8-bit integers." },
        { id: "C", text: "It replaces the loss function." },
        { id: "D", text: "It randomly drops 50% of layer activations." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-dl-4",
      topic: "Deep Learning",
      difficulty: "HARD",
      question: "In PyTorch autograd, what does calling 'loss.backward()' accomplish under the hood?",
      options: [
        { id: "A", text: "Traverses the dynamic computation graph in reverse topological order, computing and accumulating vector-Jacobian gradients into tensor '.grad' attributes via the chain rule." },
        { id: "B", text: "Reverts the model weights back to their initialization state." },
        { id: "C", text: "Transfers the model tensors to CPU RAM." },
        { id: "D", text: "Prints the loss value to stdout." },
      ],
      correctAnswer: "A",
    },

    // NLP & Generative AI (4)
    {
      id: "ml-nlp-1",
      topic: "NLP & Generative AI",
      difficulty: "EASY",
      question: "What core mechanism enables Transformer architectures to process entire sequence contexts simultaneously without sequential RNN recurrence?",
      options: [
        { id: "A", text: "Scaled Dot-Product Multi-Head Self-Attention with positional encodings." },
        { id: "B", text: "Bidirectional LSTM memory gates." },
        { id: "C", text: "Markov Chain Monte Carlo sampling." },
        { id: "D", text: "Fourier frequency decomposition." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-nlp-2",
      topic: "NLP & Generative AI",
      difficulty: "MEDIUM",
      question: "In Byte-Pair Encoding (BPE) subword tokenization, how are out-of-vocabulary (OOV) word problems handled?",
      options: [
        { id: "A", text: "Unseen words are decomposed into known constituent subword units or individual character byte tokens." },
        { id: "B", text: "Unseen words are replaced by random numbers." },
        { id: "C", text: "The tokenizer crashes and raises an OOVException." },
        { id: "D", text: "All words are hashed into a single 32-bit integer." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-nlp-3",
      topic: "NLP & Generative AI",
      difficulty: "MEDIUM",
      question: "In Retrieval-Augmented Generation (RAG) systems, what is the function of a Vector Database?",
      options: [
        { id: "A", text: "To store and perform Approximate Nearest Neighbor (ANN) cosine/Euclidean similarity searches over dense text embedding vectors." },
        { id: "B", text: "To execute SQL ACID transactions across relational tables." },
        { id: "C", text: "To compress video files for streaming." },
        { id: "D", text: "To manage user passwords." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-nlp-4",
      topic: "NLP & Generative AI",
      difficulty: "HARD",
      question: "What is the computational time and memory complexity of standard Self-Attention with respect to sequence length N?",
      options: [
        { id: "A", text: "O(N²) due to computing the full N x N attention matrix." },
        { id: "B", text: "O(1) constant time." },
        { id: "C", text: "O(log N) logarithmic time." },
        { id: "D", text: "O(N³) cubic time." },
      ],
      correctAnswer: "A",
    },

    // MLOps (4)
    {
      id: "ml-ops-1",
      topic: "MLOps",
      difficulty: "EASY",
      question: "What is 'Data Drift' (Covariate Shift) in production machine learning systems?",
      options: [
        { id: "A", text: "A statistical shift in the distribution of incoming production input features P(X) compared to the baseline training data." },
        { id: "B", text: "Corrupt disk sectors on database storage servers." },
        { id: "C", text: "A network routing latency spike." },
        { id: "D", text: "When code files are deleted by Git." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-ops-2",
      topic: "MLOps",
      difficulty: "MEDIUM",
      question: "What is the purpose of an ML Model Registry (e.g. MLflow Model Registry)?",
      options: [
        { id: "A", text: "To provide centralized model lineage, versioning, stage transitions (Staging -> Production), and artifact metadata tracking." },
        { id: "B", text: "To replace Docker container registries." },
        { id: "C", text: "To encrypt SQL databases." },
        { id: "D", text: "To automatically generate frontend UI mockups." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-ops-3",
      topic: "MLOps",
      difficulty: "MEDIUM",
      question: "Why is ONNX (Open Neural Network Exchange) widely adopted for production model inference?",
      options: [
        { id: "A", text: "It standardizes model graph representations across frameworks (PyTorch, TensorFlow, Scikit-learn) for optimized cross-platform runtime execution." },
        { id: "B", text: "It converts machine learning models into Python scripts." },
        { id: "C", text: "It trains models without any data." },
        { id: "D", text: "It replaces PostgreSQL with JSON files." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ml-ops-4",
      topic: "MLOps",
      difficulty: "HARD",
      question: "In continuous ML pipelines (CI/CD/CT), what triggers automated Continuous Training (CT)?",
      options: [
        { id: "A", text: "Performance metric degradation thresholds, data/concept drift alerts, or availability of new ground-truth labeled batches." },
        { id: "B", text: "Every HTTP request from a web client." },
        { id: "C", text: "When a user logs out." },
        { id: "D", text: "Only manual system reboot." },
      ],
      correctAnswer: "A",
    },
  ],
};

// =============================================================================
// EXAM 3: Java Enterprise Developer
// =============================================================================
export const JAVA_DEVELOPER_EXAM: DiagnosticExam = {
  id: "exam-java-developer",
  title: "Enterprise Java & Spring Boot Diagnostic Exam",
  description: "Comprehensive diagnostic assessment evaluating Java core memory models, JVM tuning, OOP architecture, Spring Boot microservices, and Spring Data JPA persistence.",
  competencyCode: "comp-java",
  durationMinutes: 25,
  totalQuestions: 20,
  topics: ["Java Core & Memory", "OOP Architecture", "Spring Boot", "REST APIs & JPA", "Microservices Architecture"],
  questions: [
    // Java Core & Memory (4)
    {
      id: "jv-mem-1",
      topic: "Java Core & Memory",
      difficulty: "EASY",
      question: "In the Java Virtual Machine (JVM), where are object instances allocated and where are local primitive variables stored?",
      options: [
        { id: "A", text: "Object instances are allocated on the Heap; local primitives and object references are stored on the thread's Stack." },
        { id: "B", text: "Everything is allocated strictly on the Stack." },
        { id: "C", text: "Objects are stored in CPU registers only." },
        { id: "D", text: "Primitives are stored in Metaspace; objects are stored on the Stack." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-mem-2",
      topic: "Java Core & Memory",
      difficulty: "MEDIUM",
      question: "Why is java.lang.String immutable in Java?",
      options: [
        { id: "A", text: "To enable String Pool caching, thread safety without synchronization, and secure use as Map keys and classloader parameters." },
        { id: "B", text: "Because the JVM cannot modify heap memory after allocation." },
        { id: "C", text: "To prevent strings from consuming more than 16 bytes." },
        { id: "D", text: "Because Java does not support pointers." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-mem-3",
      topic: "Java Core & Memory",
      difficulty: "MEDIUM",
      question: "What is 'Type Erasure' in Java Generics?",
      options: [
        { id: "A", text: "The Java compiler replaces generic type parameters with their bounding types (or Object) during compilation, omitting runtime generic type information from bytecode." },
        { id: "B", text: "A runtime error when converting String to Integer." },
        { id: "C", text: "Automatic garbage collection of unused classes." },
        { id: "D", text: "Converting abstract classes into concrete classes." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-mem-4",
      topic: "Java Core & Memory",
      difficulty: "HARD",
      question: "What is the primary difference between G1GC (Garbage-First Garbage Collector) and traditional Parallel GC in modern JVMs?",
      options: [
        { id: "A", text: "G1GC divides the heap into equal-sized regional blocks and prioritizes regions with the most reclaimable garbage to meet user-defined pause-time targets." },
        { id: "B", text: "G1GC never pauses application threads." },
        { id: "C", text: "Parallel GC only runs on single-core CPUs." },
        { id: "D", text: "G1GC requires manual memory deallocation via free()." },
      ],
      correctAnswer: "A",
    },

    // OOP Architecture (4)
    {
      id: "jv-oop-1",
      topic: "OOP Architecture",
      difficulty: "EASY",
      question: "In SOLID design principles, what does the 'L' (Liskov Substitution Principle) state?",
      options: [
        { id: "A", text: "Subtypes must be substitutable for their base types without altering the correctness of the program." },
        { id: "B", text: "Classes should only have one line of code per method." },
        { id: "C", text: "Layers must communicate via REST only." },
        { id: "D", text: "Legacy code must never be refactored." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-oop-2",
      topic: "OOP Architecture",
      difficulty: "MEDIUM",
      question: "When designing complex Java objects with many optional constructor arguments, which Gang of Four creational pattern is best suited?",
      options: [
        { id: "A", text: "Builder Pattern" },
        { id: "B", text: "Observer Pattern" },
        { id: "C", text: "Decorator Pattern" },
        { id: "D", text: "Flyweight Pattern" },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-oop-3",
      topic: "OOP Architecture",
      difficulty: "MEDIUM",
      question: "What is the architectural guideline 'Favor composition over inheritance' aiming to prevent in enterprise Java?",
      options: [
        { id: "A", text: "Fragile base class coupling, tight compile-time hierarchies, and unintended inheritance of superclass implementation details." },
        { id: "B", text: "Using interfaces in Spring applications." },
        { id: "C", text: "Creating more than 10 classes in a package." },
        { id: "D", text: "Using private methods." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-oop-4",
      topic: "OOP Architecture",
      difficulty: "HARD",
      question: "In Java 8+, how do 'default methods' inside interfaces maintain backward compatibility without violating single inheritance of state?",
      options: [
        { id: "A", text: "They provide concrete behavioral implementation in the interface without declaring instance fields (state)." },
        { id: "B", text: "They convert the interface into an abstract class." },
        { id: "C", text: "They disable interface polymorphism." },
        { id: "D", text: "They are executed only on application startup." },
      ],
      correctAnswer: "A",
    },

    // Spring Boot (4)
    {
      id: "jv-sb-1",
      topic: "Spring Boot",
      difficulty: "EASY",
      question: "What is the core role of the Spring Inversion of Control (IoC) Container?",
      options: [
        { id: "A", text: "Managing bean lifecycles, configuration, and injecting component dependencies (Dependency Injection) at runtime." },
        { id: "B", text: "Managing operating system threads directly." },
        { id: "C", text: "Converting Java classes into SQL scripts." },
        { id: "D", text: "Running Tomcat embedded server only." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-sb-2",
      topic: "Spring Boot",
      difficulty: "MEDIUM",
      question: "What is the difference between @Component, @Service, and @Repository annotations in Spring Boot?",
      options: [
        { id: "A", text: "@Service and @Repository are specialized stereotypic aliases of @Component; @Repository additionally translates database exceptions into Spring's DataAccessException hierarchy." },
        { id: "B", text: "@Component cannot be injected with @Autowired." },
        { id: "C", text: "@Service is only for SOAP web services." },
        { id: "D", text: "@Repository requires manual JDBC connection opening." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-sb-3",
      topic: "Spring Boot",
      difficulty: "MEDIUM",
      question: "In Spring Security 6, how are incoming HTTP requests authenticated and authorized before reaching controller endpoints?",
      options: [
        { id: "A", text: "Through a chain of security servlet filter intercepts (SecurityFilterChain) configured via HttpSecurity DSL." },
        { id: "B", text: "By hardcoding passwords in application.properties." },
        { id: "C", text: "Through database triggers." },
        { id: "D", text: "Via client-side JavaScript headers only." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-sb-4",
      topic: "Spring Boot",
      difficulty: "HARD",
      question: "What is the default bean scope in Spring Boot, and what are the concurrency implications?",
      options: [
        { id: "A", text: "Singleton (one shared instance per ApplicationContext); beans must be stateless or properly synchronized to avoid race conditions across concurrent HTTP worker threads." },
        { id: "B", text: "Prototype (new instance per request); thread safety is always guaranteed." },
        { id: "C", text: "Session scope; beans are destroyed after 5 seconds." },
        { id: "D", text: "ThreadLocal scope; one instance per CPU core." },
      ],
      correctAnswer: "A",
    },

    // REST APIs & JPA (4)
    {
      id: "jv-jpa-1",
      topic: "REST APIs & JPA",
      difficulty: "EASY",
      question: "What is the 'N+1 Selects problem' in Hibernate / Spring Data JPA and how is it resolved?",
      options: [
        { id: "A", text: "When fetching N child entities produces N additional database queries; resolved by using 'JOIN FETCH' or @EntityGraph." },
        { id: "B", text: "When a database table has N+1 columns." },
        { id: "C", text: "When primary keys exceed 32-bit limits." },
        { id: "D", text: "When too many REST endpoints are registered." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-jpa-2",
      topic: "REST APIs & JPA",
      difficulty: "MEDIUM",
      question: "What does the @Transactional annotation guarantee on a Spring service method?",
      options: [
        { id: "A", text: "Encloses method execution in an ACID database transaction, committing on success and automatically rolling back on unchecked (RuntimeException) errors." },
        { id: "B", text: "Runs the method in a separate microservice." },
        { id: "C", text: "Converts SQL into JSON automatically." },
        { id: "D", text: "Caches the method return value indefinitely." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-jpa-3",
      topic: "REST APIs & JPA",
      difficulty: "MEDIUM",
      question: "In RESTful HTTP semantics, which method is used for idempotent complete replacement of a resource?",
      options: [
        { id: "A", text: "PUT" },
        { id: "B", text: "POST" },
        { id: "C", text: "PATCH" },
        { id: "D", text: "OPTIONS" },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-jpa-4",
      topic: "REST APIs & JPA",
      difficulty: "HARD",
      question: "In Hibernate first-level cache (Persistence Context), what happens when an entity's fields are modified within an active @Transactional method?",
      options: [
        { id: "A", text: "Automatic Dirty Checking detects changes during flush time and emits SQL UPDATE statements without requiring explicit repository.save() calls." },
        { id: "B", text: "Changes are lost unless repository.save() is called." },
        { id: "C", text: "Hibernate raises an OptimisticLockException immediately." },
        { id: "D", text: "The database triggers a rollback." },
      ],
      correctAnswer: "A",
    },

    // Microservices Architecture (4)
    {
      id: "jv-ms-1",
      topic: "Microservices Architecture",
      difficulty: "EASY",
      question: "In distributed microservices, what is the role of the Circuit Breaker pattern (e.g. Resilience4j)?",
      options: [
        { id: "A", text: "To prevent cascading failures by tripping open and returning fallback responses when downstream service failure rates exceed thresholds." },
        { id: "B", text: "To compress HTTP responses." },
        { id: "C", text: "To encrypt passwords in RAM." },
        { id: "D", text: "To delete failed records from databases." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-ms-2",
      topic: "Microservices Architecture",
      difficulty: "MEDIUM",
      question: "Why are distributed transactions handled via Saga patterns instead of Two-Phase Commit (2PC) in high-throughput microservices?",
      options: [
        { id: "A", text: "2PC requires long-lived distributed resource locks that destroy scalability and availability, whereas Sagas use local transactions with compensating actions." },
        { id: "B", text: "2PC is only supported in C++." },
        { id: "C", text: "Sagas eliminate the need for databases." },
        { id: "D", text: "2PC cannot be used over TCP/IP." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-ms-3",
      topic: "Microservices Architecture",
      difficulty: "MEDIUM",
      question: "What is Distributed Tracing (e.g. OpenTelemetry / Micrometer Tracing) used for in Java microservices?",
      options: [
        { id: "A", text: "Propagating traceId and spanId across network boundaries to monitor and debug asynchronous request lifecycles and bottlenecks." },
        { id: "B", text: "Writing bytecode directly to flash drives." },
        { id: "C", text: "Generating SQL DDL migrations." },
        { id: "D", text: "Formatting log messages in HTML." },
      ],
      correctAnswer: "A",
    },
    {
      id: "jv-ms-4",
      topic: "Microservices Architecture",
      difficulty: "HARD",
      question: "How does an Outbox Pattern guarantee reliable message publishing to Kafka or RabbitMQ alongside database state updates?",
      options: [
        { id: "A", text: "Saves the event to an 'outbox' database table within the same local ACID transaction as the business entity, and an asynchronous process polls/streams outbox records to the broker." },
        { id: "B", text: "Directly sends the message to Kafka before checking database constraints." },
        { id: "C", text: "Stores messages on client browsers." },
        { id: "D", text: "Disables database transactions." },
      ],
      correctAnswer: "A",
    },
  ],
};

// =============================================================================
// EXAM 4: Leadership & Management
// =============================================================================
export const LEADERSHIP_EXAM: DiagnosticExam = {
  id: "exam-leadership",
  title: "Strategic Leadership & Performance Coaching Diagnostic Exam",
  description: "Comprehensive diagnostic assessment evaluating strategic team leadership, executive communication, cross-functional management, and performance calibration coaching.",
  competencyCode: "comp-leadership",
  durationMinutes: 20,
  totalQuestions: 16,
  topics: ["Strategic Leadership", "Executive Communication", "Team Management", "Performance Coaching"],
  questions: [
    // Strategic Leadership (4)
    {
      id: "ldr-strat-1",
      topic: "Strategic Leadership",
      difficulty: "EASY",
      question: "What is the primary role of a technical leader when establishing team OKRs (Objectives and Key Results)?",
      options: [
        { id: "A", text: "Aligning team execution goals with organizational strategy while setting measurable, outcome-focused Key Results." },
        { id: "B", text: "Assigning daily task checklists to every individual engineer." },
        { id: "C", text: "Eliminating code reviews." },
        { id: "D", text: "Setting unrealistic goals to enforce overtime." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-strat-2",
      topic: "Strategic Leadership",
      difficulty: "MEDIUM",
      question: "What does 'Decentralized Decision Making' achieve in high-performing engineering organizations?",
      options: [
        { id: "A", text: "Empowers autonomous teams to make localized technical decisions rapidly within clear architectural guardrails." },
        { id: "B", text: "Removes all accountability from managers." },
        { id: "C", text: "Allows engineers to ignore security policies." },
        { id: "D", text: "Requires executive approval for every git commit." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-strat-3",
      topic: "Strategic Leadership",
      difficulty: "MEDIUM",
      question: "When managing major architectural transformations, what is the key principle of Kotter's Change Management model?",
      options: [
        { id: "A", text: "Creating a sense of urgency, building a guiding coalition, and securing short-term wins to sustain momentum." },
        { id: "B", text: "Enforcing immediate changes without consulting stakeholders." },
        { id: "C", text: "Keeping transformation plans secret from developers." },
        { id: "D", text: "Delaying all decisions until complete consensus is reached." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-strat-4",
      topic: "Strategic Leadership",
      difficulty: "HARD",
      question: "How should an engineering leader balance technical debt remediation with business feature delivery?",
      options: [
        { id: "A", text: "Quantify tech debt impact on developer velocity, reliability, and business risk, and dedicate an agreed recurring percentage (e.g. 15-20%) of sprint capacity to debt retirement." },
        { id: "B", text: "Ignore technical debt completely until systems crash." },
        { id: "C", text: "Halt all feature development for 6 months." },
        { id: "D", text: "Outsource technical debt to junior interns without guidance." },
      ],
      correctAnswer: "A",
    },

    // Executive Communication (4)
    {
      id: "ldr-com-1",
      topic: "Executive Communication",
      difficulty: "EASY",
      question: "When presenting technical architecture proposals to C-level executives, what communication approach is most effective?",
      options: [
        { id: "A", text: "Lead with business impact, ROI, risk mitigation, and strategic trade-offs using the Pyramid Principle (top-down messaging)." },
        { id: "B", text: "Present raw compiler logs and 50 slides of assembly code." },
        { id: "C", text: "Use unexplained technical jargon to sound authoritative." },
        { id: "D", text: "Avoid mentioning project costs or timelines." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-com-2",
      topic: "Executive Communication",
      difficulty: "MEDIUM",
      question: "What is the core objective of active listening during high-stakes cross-functional negotiations?",
      options: [
        { id: "A", text: "Understanding the underlying motivations, constraints, and emotions of other stakeholders before responding." },
        { id: "B", text: "Waiting silently for an opportunity to interrupt." },
        { id: "C", text: "Pretending to agree with all demands." },
        { id: "D", text: "Recording conversations without permission." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-com-3",
      topic: "Executive Communication",
      difficulty: "MEDIUM",
      question: "In technical storytelling, why is framing a challenge through 'Situation, Complication, Resolution' (SCR) powerful?",
      options: [
        { id: "A", text: "It creates narrative clarity, emphasizes the urgency of the problem, and clearly justifies the chosen architectural path." },
        { id: "B", text: "It eliminates the need for data analysis." },
        { id: "C", text: "It ensures presentations take over 2 hours." },
        { id: "D", text: "It hides project risks." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-com-4",
      topic: "Executive Communication",
      difficulty: "HARD",
      question: "How should critical production incidents (e.g. Sev-1 outages) be communicated to internal and external stakeholders?",
      options: [
        { id: "A", text: "Timely, transparent status updates detailing impact scope, containment actions, expected cadence of next updates, and a blameless post-mortem." },
        { id: "B", text: "Blaming external cloud providers publicly." },
        { id: "C", text: "Maintaining total silence until the root cause is fully resolved days later." },
        { id: "D", text: "Minimizing the reported downtime." },
      ],
      correctAnswer: "A",
    },

    // Team Management (4)
    {
      id: "ldr-tm-1",
      topic: "Team Management",
      difficulty: "EASY",
      question: "According to Google's Project Aristotle research, what is the single most critical dynamic of high-performing teams?",
      options: [
        { id: "A", text: "Psychological Safety — team members feel safe to take risks, ask questions, and admit mistakes without fear of punishment." },
        { id: "B", text: "Having the highest number of senior staff engineers." },
        { id: "C", text: "Co-location in the exact same physical room." },
        { id: "D", text: "Enforcing a strict top-down hierarchy." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-tm-2",
      topic: "Team Management",
      difficulty: "MEDIUM",
      question: "When resolving interpersonal conflict between two senior engineers with opposing technical views, what is the best leadership intervention?",
      options: [
        { id: "A", text: "Facilitate a structured objective discussion evaluating trade-offs against established architectural principles, user impact, and data." },
        { id: "B", text: "Pick the engineer with more seniority regardless of arguments." },
        { id: "C", text: "Flip a coin to decide." },
        { id: "D", text: "Reassign one engineer to a different department immediately." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-tm-3",
      topic: "Team Management",
      difficulty: "MEDIUM",
      question: "What is the purpose of a blameless post-mortem culture following technical outages?",
      options: [
        { id: "A", text: "To investigate systemic failure modes, improve automated guardrails, and enhance resilience without scapegoating individuals." },
        { id: "B", text: "To identify which engineer to penalize in annual reviews." },
        { id: "C", text: "To avoid writing incident documentation." },
        { id: "D", text: "To bypass compliance audits." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-tm-4",
      topic: "Team Management",
      difficulty: "HARD",
      question: "In engineering capacity planning, why does Brooks' Law state that 'adding manpower to a late software project makes it later'?",
      options: [
        { id: "A", text: "Ramp-up overhead and combinatorial communication channel complexity O(N²) consume existing team productivity." },
        { id: "B", text: "New engineers refuse to write documentation." },
        { id: "C", text: "Git does not allow more than 5 concurrent contributors." },
        { id: "D", text: "Software licenses expire when new people join." },
      ],
      correctAnswer: "A",
    },

    // Performance Coaching (4)
    {
      id: "ldr-pc-1",
      topic: "Performance Coaching",
      difficulty: "EASY",
      question: "In the GROW coaching model used for employee 1-on-1 development, what do the letters stand for?",
      options: [
        { id: "A", text: "Goal, Reality, Options, Will (or Way Forward)" },
        { id: "B", text: "Group, Reward, Output, Workload" },
        { id: "C", text: "Growth, Revenue, Operations, Wealth" },
        { id: "D", text: "Governance, Risk, Oversight, Warranty" },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-pc-2",
      topic: "Performance Coaching",
      difficulty: "MEDIUM",
      question: "What differentiates effective continuous performance calibration from traditional annual reviews?",
      options: [
        { id: "A", text: "Frequent, contextual feedback with clear actionable competency baselines, avoiding unexpected year-end surprises." },
        { id: "B", text: "Eliminating performance standards completely." },
        { id: "C", text: "Only providing feedback when an employee fails a task." },
        { id: "D", text: "Replacing 1-on-1s with automated email bots." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-pc-3",
      topic: "Performance Coaching",
      difficulty: "MEDIUM",
      question: "How should a manager handle an employee whose competency assessment reveals a significant skill gap (e.g. gap = 2)?",
      options: [
        { id: "A", text: "Collaboratively establish a structured development roadmap with targeted capacity building courses, assigned mentor, and milestone reassessments." },
        { id: "B", text: "Issue an immediate termination notice." },
        { id: "C", text: "Ignore the gap and hope it resolves itself." },
        { id: "D", text: "Publicly shame the employee in team meetings." },
      ],
      correctAnswer: "A",
    },
    {
      id: "ldr-pc-4",
      topic: "Performance Coaching",
      difficulty: "HARD",
      question: "When mentoring high-potential engineers for leadership succession, what skill transition is typically the most challenging?",
      options: [
        { id: "A", text: "Transitioning from individual technical output ('how I do it') to multiplied team influence, delegation, and coaching ('how I empower others to do it')." },
        { id: "B", text: "Learning how to write more unit tests." },
        { id: "C", text: "Switching from Linux to Windows." },
        { id: "D", text: "Memorizing keyboard shortcuts." },
      ],
      correctAnswer: "A",
    },
  ],
};

// =============================================================================
// Exam Registry & Helpers
// =============================================================================

export const ALL_EXAMS: DiagnosticExam[] = [
  PYTHON_ADVANCED_EXAM,
  ML_ENGINEER_EXAM,
  JAVA_DEVELOPER_EXAM,
  LEADERSHIP_EXAM,
];

export const EXAM_REGISTRY: Record<string, DiagnosticExam> = {
  "exam-python-advanced": PYTHON_ADVANCED_EXAM,
  "exam-python-fullstack": PYTHON_ADVANCED_EXAM,
  "exam-ml-engineer": ML_ENGINEER_EXAM,
  "exam-data-science": ML_ENGINEER_EXAM,
  "exam-java-developer": JAVA_DEVELOPER_EXAM,
  "exam-leadership": LEADERSHIP_EXAM,
};

/**
 * Resolves the appropriate diagnostic exam ID given a role/designation code or title.
 */
export function getExamIdForRole(roleCodeOrTitle?: string | null, roleTitle?: string | null): string {
  const code = (roleCodeOrTitle || "").toUpperCase().trim();
  const title = (roleTitle ? roleTitle : roleCodeOrTitle || "").toLowerCase().trim();

  if (
    code === "MLE" ||
    code === "DS" ||
    title.includes("ml engineer") ||
    title.includes("machine learning") ||
    title.includes("data scientist") ||
    title.includes("data science")
  ) {
    return "exam-ml-engineer";
  }

  if (
    code === "JVD" ||
    title.includes("java developer") ||
    title.includes("java")
  ) {
    return "exam-java-developer";
  }

  if (
    code === "PM" ||
    code === "HRM" ||
    code === "LDR" ||
    title.includes("project manager") ||
    title.includes("hr manager") ||
    title.includes("leadership") ||
    title.includes("manager")
  ) {
    return "exam-leadership";
  }

  // Default to Python Full Stack / Software Engineer exam
  return "exam-python-advanced";
}

/**
 * Return client-sanitized exam questions (WITHOUT correctAnswer).
 */
export function getClientExam(examIdOrRole: string = "exam-python-advanced") {
  const exam = EXAM_REGISTRY[examIdOrRole] || PYTHON_ADVANCED_EXAM;
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
  const exam = EXAM_REGISTRY[examId] || PYTHON_ADVANCED_EXAM;
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
