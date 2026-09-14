import { CourseCurriculum } from "./types";

export const courseJv401: CourseCurriculum = {
  courseId: "course-jv-401",
  totalDurationMinutes: 1680,
  modules: [
    {
      id: "jv-mod-1",
      order: 1,
      title: "Module 1 — JVM Internals, Memory Regions & Garbage Collection",
      durationMinutes: 210,
      summary: "JVM architecture, Eden/Survivor/Tenured heap generations, Metaspace, JIT compilation (C1/C2), and Garbage First (G1) / ZGC collector tuning.",
      learningObjectives: [
        "Trace object allocation lifecycles across Young (Eden, S0, S1) and Old generations.",
        "Configure JVM tuning flags for high-throughput enterprise microservices.",
        "Diagnose OutOfMemoryError scenarios using heap dump analysis tools (Eclipse MAT, VisualVM).",
        "Compare throughput and latency characteristics of G1GC vs ZGC."
      ],
      resources: [
        {
          title: "Oracle Java SE Documentation: HotSpot JVM Memory Management",
          url: "https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html",
          description: "Official guide on JVM memory layout, heap spaces, and generational garbage collection.",
          type: "documentation",
          provider: "Oracle Java Documentation"
        },
        {
          title: "Baeldung: Understanding the Java Virtual Machine (JVM) Architecture",
          url: "https://www.baeldung.com/jvm-vs-jre-vs-jdk",
          description: "Class loaders, bytecode execution engine, JIT compilation, and execution regions.",
          type: "article",
          provider: "Baeldung"
        }
      ],
      content: {
        overview: "The Java Virtual Machine (JVM) abstracts operating system execution through bytecode interpretation and runtime JIT compilation. Understanding memory partitioning (Heap, Metaspace, Stack, Code Cache) and garbage collector mechanics allows Java engineers to tune enterprise applications for sub-millisecond tail latencies.",
        keyConcepts: [
          {
            section: "Section 1 — JVM Memory Architecture",
            topic: "Heap Generations & Metaspace",
            title: "Lesson 1 — Memory Layout: Young Gen, Old Gen, and Off-Heap Metaspace",
            prerequisites: "Solid Java fundamentals and OOP principles.",
            description: "Deep dive into HotSpot JVM memory regions: Eden, Survivor (S0/S1), Tenured (Old Generation), JVM Stack frames, and native Metaspace.",
            whyItMatters: "Mismatched heap sizing and improper generational ratios cause frequent Full GC pauses, spiking API latency in production microservices.",
            howItWorks: "New objects allocate in Eden. Minor GCs copy surviving objects between S0 and S1, incrementing an age counter. Once age exceeds MaxTenuringThreshold, objects promote to the Old Generation.",
            stepByStep: [
              "Step 1: Size Heap explicitly using -Xms (initial) and -Xmx (maximum) to prevent runtime OS page reallocation.",
              "Step 2: Balance NewRatio (-XX:NewRatio=2 means Old is 2x Young).",
              "Step 3: Monitor Metaspace consumption via -XX:MaxMetaspaceSize to prevent classloader leaks.",
              "Step 4: Analyze memory allocations programmatically using java.lang.management.ManagementFactory."
            ],
            workedExample: "Garbage Collection Diagnostics Scenario:\nAn e-commerce service experiences 400ms P99 latency spikes during flash sales.\nAnalysis: Heap dump reveals millions of short-lived DTOs prematurely promoting to Old Gen due to small Survivor spaces.\nFix: Tune `-XX:SurvivorRatio=6 -XX:MaxTenuringThreshold=15` so transient DTOs die in Young Gen.",
            realWorldUsage: "High-throughput financial trading systems, banking settlement APIs, and enterprise Spring Boot microservices.",
            codeSnippet: "package com.enterprise.jvm;\n\nimport java.lang.management.ManagementFactory;\nimport java.lang.management.MemoryMXBean;\nimport java.lang.management.MemoryUsage;\n\npublic class MemoryDiagnostics {\n    public static void printMemoryStatistics() {\n        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();\n        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();\n        MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();\n\n        System.out.printf(\"Heap Init: %d MB, Used: %d MB, Max: %d MB%n\",\n            heapUsage.getInit() / (1024 * 1024),\n            heapUsage.getUsed() / (1024 * 1024),\n            heapUsage.getMax() / (1024 * 1024));\n\n        System.out.printf(\"Metaspace/Non-Heap Used: %d MB, Max: %d MB%n\",\n            nonHeapUsage.getUsed() / (1024 * 1024),\n            nonHeapUsage.getMax() / (1024 * 1024));\n    }\n}",
            codeExplanation: "1. Uses ManagementFactory.getMemoryMXBean() to inspect JVM memory pools at runtime.\n2. Computes heap and native metaspace allocations in megabytes.\n3. Provides programmatic metrics for health check probes.",
            expectedOutput: "Heap Init: 512 MB, Used: 124 MB, Max: 2048 MB\nMetaspace/Non-Heap Used: 48 MB, Max: 512 MB",
            commonMistakes: "Setting -Xms much smaller than -Xmx, causing costly memory resize pauses during traffic spikes.",
            bestPractices: "Set -Xms equal to -Xmx in production container environments (Kubernetes) and enable -XX:+UseContainerSupport.",
            practiceTask: "Write a diagnostic class that registers a NotificationListener on GarbageCollectorMXBean to log GC pause durations exceeding 50ms.",
            keyTakeaway: "Generational memory management ensures that short-lived objects are collected rapidly in Young Gen without triggering costly Old Gen sweeps."
          },
          {
            section: "Section 2 — Modern Garbage Collectors",
            topic: "G1GC vs ZGC Tuning",
            title: "Lesson 2 — Low-Latency Garbage Collection: G1GC and Generational ZGC",
            prerequisites: "Lesson 1 (JVM Memory Layout).",
            description: "Comparing region-based Garbage-First (G1) collector with concurrent ultra-low latency ZGC (-XX:+UseZGC) designed for sub-millisecond pauses.",
            whyItMatters: "Traditional collectors stop application threads (STW) for hundreds of milliseconds; modern collectors perform marking and relocation concurrently.",
            howItWorks: "G1 partitions the heap into equal 1MB-32MB regions and collects the highest-garbage regions first. ZGC uses colored pointers and load barriers to relocate objects while application threads continue executing.",
            stepByStep: [
              "Step 1: Select collector: -XX:+UseG1GC (general purpose) or -XX:+UseZGC (ultra-low latency).",
              "Step 2: For G1GC, set target pause time: -XX:MaxGCPauseMillis=200.",
              "Step 3: Enable GC logging: -Xlog:gc*,gc+phases=debug:file=/var/log/jvm/gc.log:time,uptime,pid:filecount=5,filesize=50m.",
              "Step 4: Monitor allocation stall rates and heap fragmentation."
            ],
            workedExample: "Production JVM Flag Configuration for a 4GB Container:\n`java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseZGC -XX:+ZGenerational -Xlog:gc*:file=gc.log:time -jar app.jar`",
            realWorldUsage: "Mission-critical payment gateways requiring 99.99th percentile response times below 5 milliseconds.",
            codeSnippet: "package com.enterprise.jvm;\n\nimport java.util.ArrayList;\nimport java.util.List;\n\npublic class AllocationBenchmark {\n    private static final int BATCH_SIZE = 50_000;\n\n    public static void runWorkload() {\n        List<byte[]> memoryHolder = new ArrayList<>();\n        for (int i = 0; i < BATCH_SIZE; i++) {\n            // Allocate 1KB payload per iteration\n            byte[] payload = new byte[1024];\n            if (i % 10 == 0) {\n                memoryHolder.add(payload); // 10% survivorship\n            }\n        }\n        System.out.printf(\"Retained %d long-lived objects in Tenured%n\", memoryHolder.size());\n    }\n}",
            codeExplanation: "1. Simulates realistic enterprise allocation where 90% of objects die immediately in Eden.\n2. Retains 10% in a collection to test Old Gen promotion behavior.\n3. Allows profiling GC throughput and allocation rate under controlled load.",
            expectedOutput: "Retained 5000 long-lived objects in Tenured",
            commonMistakes: "Setting -XX:MaxGCPauseMillis unrealistically low with G1GC, forcing the JVM to collect tiny batches and decreasing overall application throughput.",
            bestPractices: "Upgrade to Java 21+ and evaluate Generational ZGC (-XX:+UseZGC -XX:+ZGenerational) for workloads sensitive to tail latencies.",
            practiceTask: "Run the allocation benchmark with GC logging enabled and identify Young GC frequency and pause durations.",
            keyTakeaway: "ZGC achieves sub-millisecond pauses by performing object relocation concurrently using colored pointers and load barriers."
          }
        ],
        practicalExercise: "Analyze a JVM GC log file exhibiting Stop-The-World pause spikes. Formulate a tuned JVM argument profile (G1GC vs ZGC) optimizing for sub-50ms tail latency in an 8GB RAM containerized Spring Boot service.",
        competencyVerification: "Proves mastery of JVM memory layout, garbage collection algorithms, and production JVM performance tuning at Level 4.",
        resources: [
          {
            title: "Oracle Java SE Documentation: HotSpot JVM Memory Management",
            url: "https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html",
            description: "Official guide on JVM memory layout, heap spaces, and generational garbage collection.",
            type: "documentation",
            provider: "Oracle Java Documentation"
          },
          {
            title: "Baeldung: Understanding the Java Virtual Machine (JVM) Architecture",
            url: "https://www.baeldung.com/jvm-vs-jre-vs-jdk",
            description: "Class loaders, bytecode execution engine, JIT compilation, and execution regions.",
            type: "article",
            provider: "Baeldung"
          }
        ]
      }
    },
    {
      id: "jv-mod-2",
      order: 2,
      title: "Module 2 — Java Concurrency, Virtual Threads (Project Loom) & Memory Model",
      durationMinutes: 210,
      summary: "Java Memory Model (JMM), happens-before semantics, synchronized, Locks, CompletableFuture, and Java 21 Virtual Threads (Project Loom) for high-throughput I/O.",
      learningObjectives: [
        "Explain the Java Memory Model (JMM), volatile visibility, and happens-before guarantees.",
        "Implement thread-safe synchronization using ReentrantLock, ReadWriteLock, and StampedLock.",
        "Compose asynchronous non-blocking pipelines with CompletableFuture.",
        "Migrate platform thread pools to Java 21 Virtual Threads (Project Loom) for massive I/O concurrency."
      ],
      resources: [
        {
          title: "Java 21 JEP 444: Virtual Threads Official Specification",
          url: "https://openjdk.org/jeps/444",
          description: "Virtual threads, carrier threads, continuation mechanics, and thread-per-request scaling.",
          type: "specification",
          provider: "OpenJDK"
        },
        {
          title: "Baeldung: Guide to Java 21 Virtual Threads",
          url: "https://www.baeldung.com/java-virtual-threads",
          description: "Creating virtual threads, structured concurrency, and performance comparisons with platform threads.",
          type: "guide",
          provider: "Baeldung"
        }
      ],
      content: {
        overview: "Java 21 revolutionizes concurrency with Virtual Threads (Project Loom), allowing millions of lightweight threads to run on a small pool of carrier OS threads. Combined with the Java Memory Model and CompletableFuture, modern Java provides unparalleled concurrency throughput.",
        keyConcepts: [
          {
            section: "Section 1 — Java 21 Virtual Threads",
            topic: "Project Loom & Thread-per-Request",
            title: "Lesson 1 — Virtual Threads Architecture: Scaling I/O-Bound Workloads",
            prerequisites: "Module 1 (JVM Internals) and standard Java Thread/Runnable usage.",
            description: "How Virtual Threads decouple Java threads from OS kernel threads using user-mode continuations mounted onto carrier ForkJoinPool workers.",
            whyItMatters: "Traditional platform threads consume ~1MB of stack memory each and are limited to ~2,000 threads per JVM. Virtual threads take a few hundred bytes, scaling to 1,000,000+ concurrent connections without reactive framework complexity.",
            howItWorks: "When a Virtual Thread blocks on network/file I/O (e.g., HTTP call, JDBC query), the JVM unmounts its stack frame to the heap and frees the carrier OS thread to execute other virtual threads.",
            stepByStep: [
              "Step 1: Create a virtual thread executor using Executors.newVirtualThreadPerTaskExecutor().",
              "Step 2: Submit blocking tasks without manual thread pooling.",
              "Step 3: Avoid thread pinning: replace synchronized blocks around I/O with java.util.concurrent.locks.ReentrantLock.",
              "Step 4: Enable Virtual Threads in Spring Boot 3 via `spring.threads.virtual.enabled=true`."
            ],
            workedExample: "Concurrency Benchmark:\nPlatform Thread Pool (200 threads): Handling 10,000 concurrent 100ms HTTP requests results in thread starvation and queue timeouts.\nVirtual Threads: 10,000 virtual threads run concurrently, completing in ~120ms with negligible CPU overhead.",
            realWorldUsage: "High-concurrency REST endpoints, downstream microservice aggregators, and database query processing.",
            codeSnippet: "package com.enterprise.concurrency;\n\nimport java.util.concurrent.ExecutorService;\nimport java.util.concurrent.Executors;\nimport java.util.stream.IntStream;\n\npublic class VirtualThreadServer {\n    public static void executeConcurrentWorkloads() {\n        // Java 21 AutoCloseable ExecutorService with Virtual Threads\n        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {\n            IntStream.range(0, 10_000).forEach(i -> {\n                executor.submit(() -> {\n                    // Simulating blocking microservice I/O call\n                    Thread.sleep(50);\n                    return \"Result-\" + i;\n                });\n            });\n        } // executor.close() implicitly awaits completion of all virtual threads\n        \n        System.out.println(\"Completed 10,000 concurrent blocking tasks with Virtual Threads.\");\n    }\n}",
            codeExplanation: "1. Uses Executors.newVirtualThreadPerTaskExecutor() introduced in Java 21.\n2. Spawns 10,000 independent virtual threads.\n3. Try-with-resources cleanly blocks until all tasks complete without manual CountDownLatch plumbing.",
            expectedOutput: "Completed 10,000 concurrent blocking tasks with Virtual Threads.",
            commonMistakes: "Pooling virtual threads with ThreadPoolExecutor (virtual threads should be created on demand and never pooled) or pinning carrier threads using synchronized blocks with I/O.",
            bestPractices: "Use ReentrantLock instead of synchronized when performing I/O operations inside virtual threads to prevent carrier thread pinning.",
            practiceTask: "Refactor a traditional fixed thread pool service into a virtual thread executor and benchmark memory consumption under 5,000 concurrent tasks.",
            keyTakeaway: "Virtual threads restore the simplicity of synchronous thread-per-request programming while delivering the scalability of asynchronous non-blocking architectures."
          },
          {
            section: "Section 2 — Asynchronous Pipelines",
            topic: "CompletableFuture & JMM",
            title: "Lesson 2 — CompletableFuture Composition & Happens-Before Guarantees",
            prerequisites: "Lesson 1 (Virtual Threads).",
            description: "Composing multi-stage asynchronous data pipelines with CompletableFuture, handling exceptions, and ensuring memory visibility across threads.",
            whyItMatters: "Modern microservices frequently need to fan out parallel requests to multiple downstream APIs and merge results safely.",
            howItWorks: "CompletableFuture provides monadic chaining (thenApply, thenCompose, thenCombine) with built-in exceptionally fallback handlers.",
            stepByStep: [
              "Step 1: Initiate asynchronous task with CompletableFuture.supplyAsync().",
              "Step 2: Chain dependent transformations with thenApply().",
              "Step 3: Combine multiple parallel futures using CompletableFuture.allOf().",
              "Step 4: Attach recovery fallbacks using exceptionally() or handle()."
            ],
            workedExample: "Parallel API Aggregator:\nFetch User Profile (40ms) and User Orders (60ms) concurrently -> combine in 65ms rather than 100ms serial execution.",
            realWorldUsage: "API gateway route handlers and order checkout orchestration.",
            codeSnippet: "package com.enterprise.concurrency;\n\nimport java.util.concurrent.CompletableFuture;\n\npublic class AsyncAggregator {\n    public static CompletableFuture<String> buildUserProfile(String userId) {\n        CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> \"User:\" + userId);\n        CompletableFuture<String> ordersFuture = CompletableFuture.supplyAsync(() -> \"Orders:[101, 102]\");\n\n        return userFuture.thenCombine(ordersFuture, (user, orders) -> user + \" | \" + orders)\n            .exceptionally(ex -> \"Fallback: Profile Unavailable\");\n    }\n}",
            codeExplanation: "1. supplyAsync executes fetch calls concurrently on ForkJoinPool.\n2. thenCombine merges both outputs when both complete.\n3. exceptionally provides graceful fallback if any dependency fails.",
            expectedOutput: "User:USR-1 | Orders:[101, 102]",
            commonMistakes: "Calling future.get() synchronously inside the pipeline, blocking carrier threads.",
            bestPractices: "Always pass a custom executor to supplyAsync and handle timeouts using future.orTimeout(500, TimeUnit.MILLISECONDS).",
            practiceTask: "Implement an async product details aggregator that fans out to pricing, inventory, and reviews services with timeout fallbacks.",
            keyTakeaway: "CompletableFuture allows declarative non-blocking pipeline composition with resilient fault-tolerant fallbacks."
          }
        ],
        practicalExercise: "Build a high-throughput Java 21 REST client using Virtual Threads and CompletableFuture that fans out 1,000 concurrent requests to simulate third-party payment gateways, measuring P95/P99 latency.",
        competencyVerification: "Demonstrates Java memory model understanding, Virtual Thread migration, and asynchronous pipeline design at Level 4.",
        resources: [
          {
            title: "Java 21 JEP 444: Virtual Threads Official Specification",
            url: "https://openjdk.org/jeps/444",
            description: "Virtual threads, carrier threads, continuation mechanics, and thread-per-request scaling.",
            type: "specification",
            provider: "OpenJDK"
          },
          {
            title: "Baeldung: Guide to Java 21 Virtual Threads",
            url: "https://www.baeldung.com/java-virtual-threads",
            description: "Creating virtual threads, structured concurrency, and performance comparisons with platform threads.",
            type: "guide",
            provider: "Baeldung"
          }
        ]
      }
    },
    {
      id: "jv-mod-3",
      order: 3,
      title: "Module 3 — Spring Boot 3 Core, Inversion of Control & Bean Lifecycle",
      durationMinutes: 210,
      summary: "Spring ApplicationContext, BeanFactory, Dependency Injection mechanics, Bean post-processors, @Conditional annotations, and Spring Boot 3 auto-configuration.",
      learningObjectives: [
        "Trace the complete Spring Bean lifecycle from instantiation to destruction.",
        "Implement custom BeanPostProcessors and conditional bean configurations (@ConditionalOnProperty).",
        "Author a production-grade custom Spring Boot 3 starter with auto-configuration.",
        "Enforce constructor-based dependency injection and immutability."
      ],
      resources: [
        {
          title: "Spring Framework Documentation: Core Technologies & IoC Container",
          url: "https://docs.spring.io/spring-framework/reference/core/beans.html",
          description: "Official reference on Inversion of Control, BeanFactory, ApplicationContext, and Bean scopes.",
          type: "documentation",
          provider: "Spring Framework Team"
        },
        {
          title: "Baeldung: Spring Bean Lifecycle Deep Dive",
          url: "https://www.baeldung.com/spring-bean-lifecycle",
          description: "Post-processors, InitializingBean, @PostConstruct, and destruction callbacks.",
          type: "article",
          provider: "Baeldung"
        }
      ],
      content: {
        overview: "Spring Boot 3 simplifies enterprise Java through Inversion of Control (IoC) and automated component scanning. Mastering the bean lifecycle and custom auto-configurations enables engineers to architect modular, extensible microservices.",
        keyConcepts: [
          {
            section: "Section 1 — IoC & Bean Lifecycle",
            topic: "Spring Bean Lifecycle",
            title: "Lesson 1 — The Complete Spring Bean Lifecycle: From Bytecode to Destruction",
            prerequisites: "Java reflection and Spring Boot basics.",
            description: "Detailed walkthrough of Spring container phases: BeanDefinition loading, instantiation, property population, Aware interfaces, BeanPostProcessor (before/after initialization), @PostConstruct, and DisposableBean.",
            whyItMatters: "Understanding bean creation order prevents circular dependency deadlocks and enables powerful cross-cutting instrumentation.",
            howItWorks: "ApplicationContext scans components, builds BeanDefinitions, calls constructors via reflection, injects dependencies, applies BeanPostProcessors (like AOP proxying), and caches singleton instances.",
            stepByStep: [
              "Step 1: Define Spring configuration class with @Configuration and @Bean.",
              "Step 2: Use constructor injection for required immutable dependencies.",
              "Step 3: Implement @PostConstruct for post-initialization validation.",
              "Step 4: Register custom BeanPostProcessor for audit logging and metric collection."
            ],
            workedExample: "Production Component with Constructor Injection and Lifecycle Hook:\n```java\n@Service\npublic class PaymentRoutingService {\n    private final PaymentGatewayClient client;\n    \n    public PaymentRoutingService(PaymentGatewayClient client) {\n        this.client = Objects.requireNonNull(client);\n    }\n    \n    @PostConstruct\n    public void validateConnectivity() {\n        client.verifyHealth();\n    }\n}\n```",
            realWorldUsage: "Core architecture for all Spring Boot 3 enterprise web services.",
            codeSnippet: "package com.enterprise.spring.core;\n\nimport jakarta.annotation.PostConstruct;\nimport jakarta.annotation.PreDestroy;\nimport org.springframework.stereotype.Service;\n\n@Service\npublic class EnterpriseNotificationService {\n    private final EmailProviderClient emailClient;\n    private boolean isOperational = false;\n\n    // Constructor-based Dependency Injection (Recommended Best Practice)\n    public EnterpriseNotificationService(EmailProviderClient emailClient) {\n        this.emailClient = emailClient;\n    }\n\n    @PostConstruct\n    public void initialize() {\n        this.isOperational = emailClient.checkHealth();\n        System.out.println(\"[Spring Bean Lifecycle] NotificationService initialized: operational=\" + isOperational);\n    }\n\n    public void sendNotification(String recipient, String message) {\n        if (!isOperational) throw new IllegalStateException(\"Service unavailable\");\n        emailClient.dispatch(recipient, message);\n    }\n\n    @PreDestroy\n    public void cleanup() {\n        System.out.println(\"[Spring Bean Lifecycle] Releasing external provider connections.\");\n    }\n}",
            codeExplanation: "1. Uses strict constructor injection for immutability.\n2. @PostConstruct executes health validation once dependencies are wired.\n3. @PreDestroy ensures clean connection teardown during graceful shutdown.",
            expectedOutput: "[Spring Bean Lifecycle] NotificationService initialized: operational=true",
            commonMistakes: "Using field injection (@Autowired on private fields), which hinders unit testing and hides circular dependency problems.",
            bestPractices: "Always use constructor injection with final fields and use @ConditionalOnProperty for feature toggle configurations.",
            practiceTask: "Create a custom BeanPostProcessor that measures and logs bean initialization duration for all @Service beans.",
            keyTakeaway: "Constructor injection guarantees complete object initialization before the bean is exposed to application traffic."
          }
        ],
        practicalExercise: "Create a custom Spring Boot Auto-Configuration library that registers a resilient RateLimitingFilter bean only when `enterprise.ratelimit.enabled=true` is set in application.properties.",
        competencyVerification: "Proves mastery of Spring Boot 3 IoC container, bean lifecycle phases, and modular auto-configuration design at Level 4.",
        resources: [
          {
            title: "Spring Framework Documentation: Core Technologies & IoC Container",
            url: "https://docs.spring.io/spring-framework/reference/core/beans.html",
            description: "Official reference on Inversion of Control, BeanFactory, ApplicationContext, and Bean scopes.",
            type: "documentation",
            provider: "Spring Framework Team"
          },
          {
            title: "Baeldung: Spring Bean Lifecycle Deep Dive",
            url: "https://www.baeldung.com/spring-bean-lifecycle",
            description: "Post-processors, InitializingBean, @PostConstruct, and destruction callbacks.",
            type: "article",
            provider: "Baeldung"
          }
        ]
      }
    },
    {
      id: "jv-mod-4",
      order: 4,
      title: "Module 4 — Spring Data JPA, Hibernate Internals & Query Optimization",
      durationMinutes: 210,
      summary: "JPA entity states, Hibernate first/second-level cache, resolving N+1 query problems with JOIN FETCH and EntityGraphs, pagination, and HikariCP connection pool tuning.",
      learningObjectives: [
        "Manage JPA entity lifecycle states: Transient, Managed, Detached, and Removed.",
        "Diagnose and eliminate N+1 select queries using JOIN FETCH and @EntityGraph.",
        "Implement high-performance keyset pagination for large database tables.",
        "Configure HikariCP connection pool parameters for production scale."
      ],
      resources: [
        {
          title: "Spring Data JPA Reference Documentation",
          url: "https://docs.spring.io/spring-data/jpa/reference/jpa.html",
          description: "Repository query methods, specifications, entity graphs, and pagination.",
          type: "documentation",
          provider: "Spring Data Team"
        },
        {
          title: "Vlad Mihalcea: The Best Way to Fix the Hibernate N+1 Query Problem",
          url: "https://vladmihalcea.com/n-plus-1-query-problem/",
          description: "High-performance data access, JOIN FETCH, and batch fetching strategies.",
          type: "article",
          provider: "Vlad Mihalcea (Java Champion)"
        }
      ],
      content: {
        overview: "Spring Data JPA abstracts SQL interactions, but unoptimized ORM usage is the #1 cause of database latency in enterprise applications. Understanding Hibernate persistence contexts, dirty checking, and JOIN FETCH queries ensures high-throughput database interactions.",
        keyConcepts: [
          {
            section: "Section 1 — N+1 Queries & Optimization",
            topic: "Solving N+1 Queries with EntityGraphs",
            title: "Lesson 1 — Eliminating the N+1 Select Problem with JOIN FETCH & @EntityGraph",
            prerequisites: "Module 3 (Spring Boot Core) and SQL fundamentals.",
            description: "How lazy loading triggers N+1 queries when loading parent entities with collections, and how to resolve it with JOIN FETCH and Named Entity Graphs in a single query.",
            whyItMatters: "Loading 1,000 orders with lazy-loaded items triggers 1,001 separate SQL queries, collapsing database performance.",
            howItWorks: "JOIN FETCH forces Hibernate to construct an SQL INNER/LEFT JOIN, populating the parent and child association simultaneously in one round-trip.",
            stepByStep: [
              "Step 1: Identify N+1 query behavior using Hibernate SQL logging (`spring.jpa.show-sql=true`).",
              "Step 2: Add @EntityGraph or JPQL `JOIN FETCH` to the repository method.",
              "Step 3: Add `default_batch_fetch_size: 25` in application.yml as an automated fallback.",
              "Step 4: Use DTO projections (records) when only partial fields are required."
            ],
            workedExample: "Query Optimization Comparison:\nBefore (N+1): `List<Department> deps = repo.findAll(); deps.forEach(d -> d.getEmployees().size());` -> Emits 1 query for departments + 10 queries for employees.\nAfter (@EntityGraph): Emits exactly 1 SQL query with `LEFT OUTER JOIN employee`.",
            realWorldUsage: "Enterprise ERP systems, financial ledger querying, and analytics portals.",
            codeSnippet: "package com.enterprise.spring.data;\n\nimport jakarta.persistence.*;\nimport org.springframework.data.jpa.repository.EntityGraph;\nimport org.springframework.data.jpa.repository.JpaRepository;\nimport org.springframework.data.jpa.repository.Query;\nimport org.springframework.data.repository.query.Param;\nimport org.springframework.stereotype.Repository;\nimport java.util.List;\n\n@Entity\n@Table(name = \"departments\")\npublic class Department {\n    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n    private String name;\n\n    @OneToMany(mappedBy = \"department\", fetch = FetchType.LAZY)\n    private List<Employee> employees;\n    // getters and setters\n}\n\n@Repository\npublic interface DepartmentRepository extends JpaRepository<Department, Long> {\n    // Solution 1: Explicit JOIN FETCH\n    @Query(\"SELECT d FROM Department d JOIN FETCH d.employees WHERE d.id = :id\")\n    Department findByIdWithEmployees(@Param(\"id\") Long id);\n\n    // Solution 2: Declarative EntityGraph\n    @EntityGraph(attributePaths = {\"employees\"})\n    List<Department> findAll();\n}",
            codeExplanation: "1. Sets @OneToMany to FetchType.LAZY to prevent accidental eager loading.\n2. Uses JOIN FETCH in @Query for specific eager load paths.\n3. Applies @EntityGraph to findAll() to fetch departments and employees in a single SQL query.",
            expectedOutput: "Single SQL Query: select d1_0.id,d1_0.name,e1_0.department_id,e1_0.id,e1_0.name from departments d1_0 left join employees e1_0 on d1_0.id=e1_0.department_id",
            commonMistakes: "Using FetchType.EAGER on entity relationships, which permanently locks queries into eager fetching and worsens performance across unrelated use cases.",
            bestPractices: "Always keep relationships FetchType.LAZY and use @EntityGraph or DTO projections tailored to specific API query requirements.",
            practiceTask: "Convert an entity with multiple child relationships into a Spring Data JPA interface with dynamic EntityGraphs.",
            keyTakeaway: "JOIN FETCH and @EntityGraph eliminate N+1 roundtrips by retrieving parent and child collections in a single optimized SQL statement."
          }
        ],
        practicalExercise: "Audit a Spring Boot order processing service exhibiting 2,000 queries per request. Rewrite repository queries using @EntityGraph and DTO record projections, reducing database queries to 1.",
        competencyVerification: "Demonstrates Spring Data JPA mastery, Hibernate lifecycle management, and SQL query optimization at Level 4.",
        resources: [
          {
            title: "Spring Data JPA Reference Documentation",
            url: "https://docs.spring.io/spring-data/jpa/reference/jpa.html",
            description: "Repository query methods, specifications, entity graphs, and pagination.",
            type: "documentation",
            provider: "Spring Data Team"
          },
          {
            title: "Vlad Mihalcea: The Best Way to Fix the Hibernate N+1 Query Problem",
            url: "https://vladmihalcea.com/n-plus-1-query-problem/",
            description: "High-performance data access, JOIN FETCH, and batch fetching strategies.",
            type: "article",
            provider: "Vlad Mihalcea (Java Champion)"
          }
        ]
      }
    },
    {
      id: "jv-mod-5",
      order: 5,
      title: "Module 5 — Spring Security 6, OAuth2 & JWT Stateless Architecture",
      durationMinutes: 210,
      summary: "SecurityFilterChain architecture, JWT authentication filters, Spring Security 6 authorization rules, method-level security (@PreAuthorize), and OAuth2 Resource Server.",
      learningObjectives: [
        "Configure Spring Security 6 using lambda DSL SecurityFilterChain beans.",
        "Implement stateless JWT validation with OncePerRequestFilter and Nimbus JOSE.",
        "Enforce fine-grained RBAC with @PreAuthorize and SpEL expressions.",
        "Harden microservices against CSRF, CORS, and clickjacking vulnerabilities."
      ],
      resources: [
        {
          title: "Spring Security 6 Reference Documentation",
          url: "https://docs.spring.io/spring-security/reference/index.html",
          description: "SecurityFilterChain, OAuth2 Resource Server, JWT validation, and authorization filters.",
          type: "documentation",
          provider: "Spring Security Team"
        },
        {
          title: "Baeldung: Spring Security with JWT for REST APIs",
          url: "https://www.baeldung.com/spring-security-jwt",
          description: "Building stateless authentication filters, token extraction, and security contexts.",
          type: "guide",
          provider: "Baeldung"
        }
      ],
      content: {
        overview: "Spring Security 6 transitions to component-based SecurityFilterChain configuration, deprecating legacy adapter classes. Securing modern cloud APIs requires stateless JWT validation, OAuth2 resource server tokens, and method-level access controls.",
        keyConcepts: [
          {
            section: "Section 1 — SecurityFilterChain & JWT",
            topic: "Stateless Security Configuration",
            title: "Lesson 1 — Spring Security 6 SecurityFilterChain & JWT Filter Pipeline",
            prerequisites: "Module 3 (Spring Boot Core) and HTTP security fundamentals.",
            description: "Configuring a stateless SecurityFilterChain bean with disabled sessions, custom JWT authentication filter, and role-based endpoint authorization.",
            whyItMatters: "Stateful session replication breaks horizontal microservice scaling. Stateless JWTs allow any pod in a cluster to verify user credentials instantly.",
            howItWorks: "Requests traverse the SecurityFilterChain. The JwtAuthenticationFilter parses the Authorization header, verifies signature, extracts claims, and populates the SecurityContextHolder with an Authentication token.",
            stepByStep: [
              "Step 1: Declare @Configuration and publish a SecurityFilterChain @Bean.",
              "Step 2: Set sessionCreationPolicy(SessionCreationPolicy.STATELESS).",
              "Step 3: Add JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter.",
              "Step 4: Enable method security with @EnableMethodSecurity."
            ],
            workedExample: "Production Security Filter Chain:\n```java\n@Bean\npublic SecurityFilterChain filterChain(HttpSecurity http) throws Exception {\n    return http\n        .csrf(AbstractHttpConfigurer::disable)\n        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n        .authorizeHttpRequests(auth -> auth\n            .requestMatchers(\"/api/auth/**\").permitAll()\n            .requestMatchers(\"/api/admin/**\").hasRole(\"ADMIN\")\n            .anyRequest().authenticated())\n        .build();\n}\n```",
            realWorldUsage: "Standard enterprise security architecture across modern Spring Boot microservices.",
            codeSnippet: "package com.enterprise.spring.security;\n\nimport org.springframework.context.annotation.Bean;\nimport org.springframework.context.annotation.Configuration;\nimport org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;\nimport org.springframework.security.config.annotation.web.builders.HttpSecurity;\nimport org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;\nimport org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;\nimport org.springframework.security.config.http.SessionCreationPolicy;\nimport org.springframework.security.web.SecurityFilterChain;\nimport org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;\n\n@Configuration\n@EnableWebSecurity\n@EnableMethodSecurity\npublic class EnterpriseSecurityConfig {\n    private final JwtAuthenticationFilter jwtFilter;\n\n    public EnterpriseSecurityConfig(JwtAuthenticationFilter jwtFilter) {\n        this.jwtFilter = jwtFilter;\n    }\n\n    @Bean\n    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {\n        return http\n            .csrf(AbstractHttpConfigurer::disable)\n            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n            .authorizeHttpRequests(auth -> auth\n                .requestMatchers(\"/api/v1/auth/**\", \"/actuator/health\").permitAll()\n                .requestMatchers(\"/api/v1/admin/**\").hasRole(\"ADMIN\")\n                .anyRequest().authenticated()\n            )\n            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)\n            .build();\n    }\n}",
            codeExplanation: "1. Disables CSRF for stateless REST APIs.\n2. Configures STATELESS session policy for horizontal pod scaling.\n3. Inserts custom JwtAuthenticationFilter into the Spring Security filter chain.",
            expectedOutput: "SecurityFilterChain initialized with 15 default filters and custom JwtAuthenticationFilter.",
            commonMistakes: "Forgetting to permit actuator health check endpoints, causing Kubernetes liveness/readiness probes to fail with 401 Unauthorized.",
            bestPractices: "Always use @EnableMethodSecurity with `@PreAuthorize(\"hasRole('ADMIN')\")` to protect service-layer methods defensively.",
            practiceTask: "Implement a OncePerRequestFilter that parses Bearer JWT tokens, validates expiration, and populates SecurityContextHolder.",
            keyTakeaway: "Spring Security 6 uses modular SecurityFilterChain beans and stateless session policies to deliver cloud-native API security."
          }
        ],
        practicalExercise: "Build a complete Spring Security 6 stateless authentication module with JWT extraction, RSA signature validation, and @PreAuthorize method-level RBAC.",
        competencyVerification: "Demonstrates Spring Security 6 architecture, stateless JWT filter design, and role-based authorization at Level 4.",
        resources: [
          {
            title: "Spring Security 6 Reference Documentation",
            url: "https://docs.spring.io/spring-security/reference/index.html",
            description: "SecurityFilterChain, OAuth2 Resource Server, JWT validation, and authorization filters.",
            type: "documentation",
            provider: "Spring Security Team"
          },
          {
            title: "Baeldung: Spring Security with JWT for REST APIs",
            url: "https://www.baeldung.com/spring-security-jwt",
            description: "Building stateless authentication filters, token extraction, and security contexts.",
            type: "guide",
            provider: "Baeldung"
          }
        ]
      }
    },
    {
      id: "jv-mod-6",
      order: 6,
      title: "Module 6 — Reactive Programming with Spring WebFlux & Project Reactor",
      durationMinutes: 210,
      summary: "Reactive Streams specification, Mono and Flux operators, non-blocking Netty runtime, backpressure handling, and Spring WebClient.",
      learningObjectives: [
        "Explain Reactive Streams fundamentals: Publisher, Subscriber, Subscription, and Processor.",
        "Compose complex reactive streams using Mono, Flux, flatMap, zip, and retry.",
        "Implement non-blocking HTTP integrations using Spring WebClient.",
        "Manage backpressure and reactive error handling."
      ],
      resources: [
        {
          title: "Project Reactor Reference Documentation",
          url: "https://projectreactor.io/docs/core/release/reference/",
          description: "Mono, Flux, Schedulers, backpressure, and reactive stream operator references.",
          type: "documentation",
          provider: "VMware / Project Reactor"
        },
        {
          title: "Spring WebFlux Documentation",
          url: "https://docs.spring.io/spring-framework/reference/web/webflux.html",
          description: "Reactive web stack, Netty event loops, WebClient, and functional endpoints.",
          type: "documentation",
          provider: "Spring Framework Team"
        }
      ],
      content: {
        overview: "Spring WebFlux provides a fully asynchronous, non-blocking web framework built on Project Reactor and Netty. Mastering Mono and Flux operators enables reactive event-driven streaming and high-density microservice gateways.",
        keyConcepts: [
          {
            section: "Section 1 — Project Reactor Fundamentals",
            topic: "Mono, Flux & WebClient",
            title: "Lesson 1 — Asynchronous Streams with Mono, Flux & Spring WebClient",
            prerequisites: "Module 2 (Java Concurrency) and functional programming basics.",
            description: "Core reactive concepts: Publisher-Subscriber models, cold vs hot streams, backpressure, and building non-blocking HTTP clients with WebClient.",
            whyItMatters: "Traditional blocking I/O holds threads while waiting for network responses; WebFlux event loops switch contexts instantly, maximizing server utilization.",
            howItWorks: "Mono represents 0..1 items; Flux represents 0..N items. Nothing happens until a subscriber requests data (.subscribe()). WebClient delegates I/O to Netty's epoll event loops.",
            stepByStep: [
              "Step 1: Instantiate WebClient with connection pool and timeout configurations.",
              "Step 2: Chain reactive operators: map(), flatMap(), filter(), zipWith().",
              "Step 3: Handle error scenarios with onErrorResume() and retryWhen().",
              "Step 4: Expose reactive endpoints returning Flux<T> for Server-Sent Events (SSE)."
            ],
            workedExample: "Non-blocking WebClient Request:\n```java\nWebClient client = WebClient.create(\"https://api.inventory.com\");\nFlux<Item> items = client.get()\n    .uri(\"/items\")\n    .retrieve()\n    .bodyToFlux(Item.class)\n    .timeout(Duration.ofMillis(500))\n    .onErrorResume(e -> Flux.empty());\n```",
            realWorldUsage: "Real-time stock ticker updates, live telemetry ingest gateways, and chat applications.",
            codeSnippet: "package com.enterprise.spring.reactive;\n\nimport org.springframework.stereotype.Service;\nimport org.springframework.web.reactive.function.client.WebClient;\nimport reactor.core.publisher.Flux;\nimport reactor.core.publisher.Mono;\nimport java.time.Duration;\n\n@Service\npublic class ReactiveStockService {\n    private final WebClient webClient;\n\n    public ReactiveStockService(WebClient.Builder builder) {\n        this.webClient = builder.baseUrl(\"https://api.marketdata.com\").build();\n    }\n\n    public Flux<Double> fetchStockPriceStream(String ticker) {\n        return webClient.get()\n            .uri(\"/v1/quotes/{ticker}\", ticker)\n            .retrieve()\n            .bodyToFlux(Double.class)\n            .timeout(Duration.ofSeconds(2))\n            .retry(2)\n            .onErrorResume(ex -> Flux.just(0.0));\n    }\n}",
            codeExplanation: "1. Uses Spring WebClient for non-blocking HTTP transport.\n2. bodyToFlux converts the stream into a reactive Flux<Double>.\n3. Applies timeout, retry, and onErrorResume fallback resilience.",
            expectedOutput: "Reactive stream successfully created with backpressure support and fallback resilience.",
            commonMistakes: "Calling `.block()` on a Mono/Flux inside a WebFlux request handler, freezing the Netty event loop thread.",
            bestPractices: "Never block the event loop. Always propagate reactive types all the way from controller to database repository.",
            practiceTask: "Construct a reactive fan-out service that merges two WebClient Flux streams using Flux.zip and computes aggregate metrics.",
            keyTakeaway: "Reactive programming with Mono and Flux allows handling tens of thousands of concurrent connections on minimal CPU resources."
          }
        ],
        practicalExercise: "Build an asynchronous telemetry streaming gateway in Spring WebFlux that aggregates metrics from 5 microservices using WebClient and streams results over Server-Sent Events (SSE).",
        competencyVerification: "Demonstrates reactive stream mastery, non-blocking WebClient architecture, and backpressure management at Level 4.",
        resources: [
          {
            title: "Project Reactor Reference Documentation",
            url: "https://projectreactor.io/docs/core/release/reference/",
            description: "Mono, Flux, Schedulers, backpressure, and reactive stream operator references.",
            type: "documentation",
            provider: "VMware / Project Reactor"
          },
          {
            title: "Spring WebFlux Documentation",
            url: "https://docs.spring.io/spring-framework/reference/web/webflux.html",
            description: "Reactive web stack, Netty event loops, WebClient, and functional endpoints.",
            type: "documentation",
            provider: "Spring Framework Team"
          }
        ]
      }
    },
    {
      id: "jv-mod-7",
      order: 7,
      title: "Module 7 — Spring Boot Testing Architecture (JUnit 5, Mockito, Testcontainers)",
      durationMinutes: 210,
      summary: "Testing pyramid, Unit testing with JUnit 5 and Mockito, slice testing (@WebMvcTest, @DataJpaTest), and integration testing with real Docker containers via Testcontainers.",
      learningObjectives: [
        "Structure a multi-layered testing pyramid for enterprise Spring Boot services.",
        "Implement isolated unit tests using Mockito BDD syntax (@Mock, @InjectMocks).",
        "Perform fast slice testing with @WebMvcTest and MockMvc.",
        "Execute production-grade integration tests using Testcontainers and PostgreSQL Docker containers."
      ],
      resources: [
        {
          title: "Testcontainers for Java: Official Getting Started Guide",
          url: "https://java.testcontainers.org/",
          description: "Spinning up real PostgreSQL, Kafka, and Redis containers inside JUnit 5 tests.",
          type: "documentation",
          provider: "Testcontainers / AtomicJar"
        },
        {
          title: "Spring Boot Testing Documentation",
          url: "https://docs.spring.io/spring-boot/reference/testing/index.html",
          description: "@SpringBootTest, @WebMvcTest, @DataJpaTest, and test slice configurations.",
          type: "documentation",
          provider: "Spring Boot Team"
        }
      ],
      content: {
        overview: "Reliable enterprise systems require automated test suites spanning unit, slice, and integration tests. Using Testcontainers eliminates H2 in-memory database discrepancies by running real PostgreSQL and Kafka Docker containers inside CI/CD pipelines.",
        keyConcepts: [
          {
            section: "Section 1 — Testcontainers & Integration Testing",
            topic: "Testcontainers with JUnit 5",
            title: "Lesson 1 — Real Integration Testing with Testcontainers & PostgreSQL",
            prerequisites: "Module 4 (Spring Data JPA) and Docker fundamentals.",
            description: "How to use @Testcontainers and PostgreSQLContainer in JUnit 5 tests to validate database migrations, complex SQL queries, and transactional rollbacks against real database engines.",
            whyItMatters: "In-memory test databases like H2 lack PostgreSQL-specific functions (JSONB, window functions, locking semantics), masking critical production bugs.",
            howItWorks: "Testcontainers starts a lightweight PostgreSQL container before tests run and binds its dynamic port to Spring Data datasource properties using @DynamicPropertySource.",
            stepByStep: [
              "Step 1: Add testcontainers and postgresql test dependencies.",
              "Step 2: Declare @Container static PostgreSQLContainer in the test class.",
              "Step 3: Register dynamic datasource properties via @DynamicPropertySource.",
              "Step 4: Execute repository tests with real database constraints and triggers."
            ],
            workedExample: "PostgreSQL Container Test:\n```java\n@SpringBootTest\n@Testcontainers\nclass OrderIntegrationTest {\n    @Container\n    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(\"postgres:16-alpine\");\n    \n    @DynamicPropertySource\n    static void configureProperties(DynamicPropertyRegistry registry) {\n        registry.add(\"spring.datasource.url\", postgres::getJdbcUrl);\n        registry.add(\"spring.datasource.username\", postgres::getUsername);\n        registry.add(\"spring.datasource.password\", postgres::getPassword);\n    }\n}\n```",
            realWorldUsage: "Continuous Integration (CI) test verification across enterprise delivery pipelines.",
            codeSnippet: "package com.enterprise.spring.testing;\n\nimport org.junit.jupiter.api.Test;\nimport org.springframework.beans.factory.annotation.Autowired;\nimport org.springframework.boot.test.context.SpringBootTest;\nimport org.springframework.test.context.DynamicPropertyRegistry;\nimport org.springframework.test.context.DynamicPropertySource;\nimport org.testcontainers.containers.PostgreSQLContainer;\nimport org.testcontainers.junit.jupiter.Container;\nimport org.testcontainers.junit.jupiter.Testcontainers;\nimport static org.junit.jupiter.api.Assertions.*;\n\n@SpringBootTest\n@Testcontainers\npublic class DatabaseIntegrationTest {\n    @Container\n    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(\"postgres:16-alpine\");\n\n    @DynamicPropertySource\n    static void configureProperties(DynamicPropertyRegistry registry) {\n        registry.add(\"spring.datasource.url\", postgres::getJdbcUrl);\n        registry.add(\"spring.datasource.username\", postgres::getUsername);\n        registry.add(\"spring.datasource.password\", postgres::getPassword);\n    }\n\n    @Test\n    void shouldVerifyPostgreSQLContainerRunning() {\n        assertTrue(postgres.isRunning(), \"PostgreSQL container must be healthy and active\");\n    }\n}",
            codeExplanation: "1. Spawns an isolated Docker PostgreSQL 16 container for the test suite.\n2. @DynamicPropertySource injects dynamic JDBC credentials into Spring environment.\n3. Guarantees 100% parity between local test runs and production database engines.",
            expectedOutput: "Test passed: PostgreSQL container started in 1.4s, migrations applied, assertion verified.",
            commonMistakes: "Starting and stopping new Docker containers for every individual test method rather than reusing a static container across the test class.",
            bestPractices: "Use static container declarations or the Singleton Container Pattern to amortize container startup overhead across the entire test suite.",
            practiceTask: "Write an end-to-end integration test that verifies Liquibase/Flyway schema migrations against a Testcontainers PostgreSQL instance.",
            keyTakeaway: "Testcontainers provides true environment parity by validating application behavior against real containerized infrastructure."
          }
        ],
        practicalExercise: "Build an end-to-end integration test suite using JUnit 5 and Testcontainers that verifies transactional payment processing, Flyway migrations, and constraint violations against PostgreSQL.",
        competencyVerification: "Proves enterprise testing mastery, test slice design, and Testcontainers integration at Level 4.",
        resources: [
          {
            title: "Testcontainers for Java: Official Getting Started Guide",
            url: "https://java.testcontainers.org/",
            description: "Spinning up real PostgreSQL, Kafka, and Redis containers inside JUnit 5 tests.",
            type: "documentation",
            provider: "Testcontainers / AtomicJar"
          },
          {
            title: "Spring Boot Testing Documentation",
            url: "https://docs.spring.io/spring-boot/reference/testing/index.html",
            description: "@SpringBootTest, @WebMvcTest, @DataJpaTest, and test slice configurations.",
            type: "documentation",
            provider: "Spring Boot Team"
          }
        ]
      }
    },
    {
      id: "jv-mod-8",
      order: 8,
      title: "Module 8 — Microservices Resilience, Distributed Tracing & Spring Cloud",
      durationMinutes: 210,
      summary: "Fault tolerance with Resilience4j (CircuitBreaker, RateLimiter, Retry), distributed tracing with Micrometer & OpenTelemetry, and Spring Cloud Gateway.",
      learningObjectives: [
        "Implement Circuit Breaker, Rate Limiter, and Retry patterns using Resilience4j.",
        "Instrument distributed tracing using Micrometer Tracing, OpenTelemetry, and Zipkin.",
        "Configure dynamic API routing, rate limiting, and filtering in Spring Cloud Gateway.",
        "Build resilient fallback mechanisms for degraded downstream dependencies."
      ],
      resources: [
        {
          title: "Resilience4j Official Documentation",
          url: "https://resilience4j.readme.io/docs/getting-started",
          description: "CircuitBreaker, RateLimiter, Bulkhead, and Retry patterns for Spring Boot.",
          type: "documentation",
          provider: "Resilience4j"
        },
        {
          title: "Micrometer Tracing Documentation",
          url: "https://micrometer.io/docs/tracing",
          description: "Distributed tracing spans, trace IDs, OpenTelemetry bridge, and observation handlers.",
          type: "documentation",
          provider: "Micrometer / VMware"
        }
      ],
      content: {
        overview: "In distributed microservice architectures, network failures are inevitable. Applying Resilience4j circuit breakers prevents cascading failures, while OpenTelemetry distributed tracing provides end-to-end visibility into cross-service latency.",
        keyConcepts: [
          {
            section: "Section 1 — Circuit Breakers & Resilience4j",
            topic: "Fault Tolerance Patterns",
            title: "Lesson 1 — Resilience4j Circuit Breaker, Retry & Fallback Architecture",
            prerequisites: "Module 3 (Spring Boot Core) and microservice architecture basics.",
            description: "How CircuitBreaker transitions across CLOSED, OPEN, and HALF_OPEN states based on sliding window failure rates, isolating unhealthy downstream dependencies.",
            whyItMatters: "Without a circuit breaker, a failing downstream service consumes all calling threads, triggering cascading outages across the entire ecosystem.",
            howItWorks: "Resilience4j tracks calls in a count-based or time-based sliding window. When error rate exceeds the threshold (e.g., 50%), the circuit trips to OPEN, instantly routing calls to a fallback method without network overhead.",
            stepByStep: [
              "Step 1: Add resilience4j-spring-boot3 dependency.",
              "Step 2: Configure failureRateThreshold, waitDurationInOpenState, and slidingWindowSize in application.yml.",
              "Step 3: Annotate vulnerable service methods with `@CircuitBreaker(name = \"paymentService\", fallbackMethod = \"paymentFallback\")`.",
              "Step 4: Implement fallback method with identical signature plus Throwable parameter."
            ],
            workedExample: "Circuit Breaker Protection:\nDownstream Payment API fails with HTTP 500.\nFirst 10 calls record 100% failure -> Circuit trips to OPEN.\nNext 1,000 calls immediately execute `paymentFallback()` in <1ms, shielding thread pools from exhaustion.",
            realWorldUsage: "Mission-critical payment processors, travel booking gateways, and cloud microservices.",
            codeSnippet: "package com.enterprise.spring.resilience;\n\nimport io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;\nimport io.github.resilience4j.retry.annotation.Retry;\nimport org.springframework.stereotype.Service;\n\n@Service\npublic class ResilientPaymentClient {\n    \n    @CircuitBreaker(name = \"paymentGateway\", fallbackMethod = \"processPaymentFallback\")\n    @Retry(name = \"paymentGateway\")\n    public String processPayment(String transactionId, double amount) {\n        // Simulating external HTTP call to payment vendor\n        if (amount > 10_000) {\n            throw new RuntimeException(\"Downstream gateway timeout\");\n        }\n        return \"TRANSACTION_PROCESSED: \" + transactionId;\n    }\n\n    // Fallback executed when circuit is OPEN or retries exhausted\n    public String processPaymentFallback(String transactionId, double amount, Throwable t) {\n        System.out.println(\"[Fallback Triggered] Queuing transaction for offline processing: \" + transactionId);\n        return \"TRANSACTION_QUEUED_OFFLINE: \" + transactionId;\n    }\n}",
            codeExplanation: "1. @CircuitBreaker monitors execution metrics against configured thresholds.\n2. @Retry retries transient network faults with exponential backoff.\n3. processPaymentFallback gracefully handles outages without propagating exceptions to callers.",
            expectedOutput: "[Fallback Triggered] Queuing transaction for offline processing: TX-9918\nReturned: TRANSACTION_QUEUED_OFFLINE: TX-9918",
            commonMistakes: "Making fallback methods throw exceptions or perform blocking operations, defeating the purpose of graceful degradation.",
            bestPractices: "Combine CircuitBreaker with TimeLimiter and Bulkhead to isolate both thread pools and latency bottlenecks.",
            practiceTask: "Configure a Resilience4j circuit breaker with a 50% failure rate threshold and verify state transition to OPEN via Actuator metrics.",
            keyTakeaway: "Resilience4j prevents cascading microservice failures by isolating failing components and serving immediate fallback responses."
          }
        ],
        practicalExercise: "Implement a fault-tolerant microservice cluster featuring Resilience4j circuit breakers, automated exponential backoff retries, and Micrometer OpenTelemetry distributed tracing spans.",
        competencyVerification: "Demonstrates microservice resilience patterns, distributed tracing instrumentation, and Spring Cloud fault tolerance at Level 4.",
        resources: [
          {
            title: "Resilience4j Official Documentation",
            url: "https://resilience4j.readme.io/docs/getting-started",
            description: "CircuitBreaker, RateLimiter, Bulkhead, and Retry patterns for Spring Boot.",
            type: "documentation",
            provider: "Resilience4j"
          },
          {
            title: "Micrometer Tracing Documentation",
            url: "https://micrometer.io/docs/tracing",
            description: "Distributed tracing spans, trace IDs, OpenTelemetry bridge, and observation handlers.",
            type: "documentation",
            provider: "Micrometer / VMware"
          }
        ]
      }
    }
  ]
};
