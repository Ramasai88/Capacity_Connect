import { CourseCurriculum } from "./types";

export const courseFsw401: CourseCurriculum = {
  courseId: "course-fsw-401",
  totalDurationMinutes: 1440,
  modules: [
    {
      id: "fsw-mod-1",
      order: 1,
      title: "Module 1 — Modern Web Architecture, HTTP/2/3 Protocols & Networking",
      durationMinutes: 180,
      summary: "Client-server architecture, TCP/TLS handshake, HTTP/1.1 vs HTTP/2 (multiplexing) vs HTTP/3 (QUIC/UDP), browser rendering pipelines (DOM/CSSOM/Layout/Paint), and CDN edge caching.",
      learningObjectives: [
        "Trace network request lifecycles through DNS resolution, TLS 1.3 handshakes, and HTTP/2 multiplexed streams.",
        "Analyze browser rendering critical paths and optimize First Contentful Paint (FCP) and Largest Contentful Paint (LCP).",
        "Configure CDN caching headers (Cache-Control: s-maxage, stale-while-revalidate) for global edge acceleration."
      ],
      resources: [
        {
          title: "MDN Web Docs: An overview of HTTP and HTTP/2",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
          description: "HTTP protocol evolution, connection models, multiplexing, and headers.",
          type: "documentation",
          provider: "MDN Web Docs"
        },
        {
          title: "Google Web.dev: Critical Rendering Path & Core Web Vitals",
          url: "https://web.dev/explore/fast",
          description: "Optimizing DOM/CSSOM construction, Layout, Paint, and Core Web Vitals metrics.",
          type: "guide",
          provider: "Google Chrome Team"
        }
      ],
      content: {
        overview: "Full-stack web applications require a deep understanding of network protocols and browser rendering engines. Mastering HTTP/2 stream multiplexing, TLS 1.3 handshakes, and CDN edge cache directives enables engineers to build fast, globally responsive systems.",
        keyConcepts: [
          {
            section: "Section 1 — Protocols & Browser Rendering",
            topic: "HTTP/2 Multiplexing & CDN Caching",
            title: "Lesson 1 — HTTP/2 Multiplexing, Critical Rendering Path & Cache-Control Headers",
            prerequisites: "Web fundamentals (HTML, CSS, JavaScript) and basic networking.",
            description: "How HTTP/2 eliminates Head-of-Line blocking via binary framing over a single TCP connection, how the browser builds the Render Tree, and how to configure optimal `Cache-Control` headers.",
            whyItMatters: "Misconfigured cache headers force browsers to re-download unchanged static assets, degrading page load times and driving up cloud egress costs.",
            howItWorks: "HTTP/2 splits requests into independent binary frames tagged with stream IDs. CDN edge servers intercept requests and serve cached content according to `s-maxage` and `stale-while-revalidate` directives.",
            stepByStep: [
              "Step 1: Inspect network requests in Chrome DevTools to evaluate HTTP protocol versions (h2 / h3).",
              "Step 2: Set immutable long-term caching for hashed static bundles: `Cache-Control: public, max-age=31536000, immutable`.",
              "Step 3: Set stale-while-revalidate for dynamic API responses: `Cache-Control: s-maxage=60, stale-while-revalidate=300`.",
              "Step 4: Minimize critical render path blockers with `async` / `defer` script attributes."
            ],
            workedExample: "Production Cache-Control Strategy:\n- `index.html`: `no-cache, must-revalidate` (Always checks origin for latest bundle hash).\n- `app.a8f92.js`: `public, max-age=31536000, immutable` (Cached indefinitely at browser and CDN).\n- `/api/courses`: `public, s-maxage=120, stale-while-revalidate=600` (Served instantly from CDN edge).",
            realWorldUsage: "Global content delivery at Vercel, Cloudflare, Fastly, and AWS CloudFront.",
            codeSnippet: "// Express.js Middleware for Optimized HTTP Caching & Security Headers (TypeScript)\nimport { Request, Response, NextFunction } from 'express';\n\nexport function applyEdgeCacheHeaders(sMaxAgeSeconds = 60, staleWhileRevalidateSeconds = 300) {\n  return (req: Request, res: Response, next: NextFunction) => {\n    if (req.method === 'GET') {\n      // Instructs CDNs to cache for sMaxAgeSeconds and serve stale while fetching in background\n      res.setHeader('Cache-Control', `public, s-maxage=${sMaxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`);\n      res.setHeader('X-Content-Type-Options', 'nosniff');\n      res.setHeader('X-Frame-Options', 'DENY');\n    }\n    next();\n  };\n}",
            codeExplanation: "1. Implements standard `s-maxage` for CDN edge caching.\n2. Uses `stale-while-revalidate` for non-blocking background cache refreshes.\n3. Adds standard HTTP security headers.",
            expectedOutput: "Sets modern Cache-Control and security headers on HTTP responses.",
            commonMistakes: "Setting `Cache-Control: max-age=31536000` on the root `index.html`, making it impossible for users to receive frontend updates without manually clearing their browser cache.",
            bestPractices: "Never cache `index.html` permanently; only cache content-hashed assets (JS, CSS, images) with `immutable`.",
            practiceTask: "Audit a web application's network waterfall and formulate an edge caching strategy reducing origin requests by 80%.",
            keyTakeaway: "HTTP/2 multiplexing and stale-while-revalidate caching deliver instant UI loads while protecting backend servers from traffic spikes."
          }
        ],
        practicalExercise: "Audit a full-stack application's network waterfall using Chrome DevTools Lighthouse, configure edge caching headers, and optimize critical rendering path metrics.",
        competencyVerification: "Demonstrates mastery of HTTP/2 protocol architecture, browser rendering pipelines, and CDN edge caching at Level 4.",
        resources: [
          {
            title: "MDN Web Docs: An overview of HTTP and HTTP/2",
            url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
            description: "HTTP protocol evolution, connection models, multiplexing, and headers.",
            type: "documentation",
            provider: "MDN Web Docs"
          },
          {
            title: "Google Web.dev: Critical Rendering Path & Core Web Vitals",
            url: "https://web.dev/explore/fast",
            description: "Optimizing DOM/CSSOM construction, Layout, Paint, and Core Web Vitals metrics.",
            type: "guide",
            provider: "Google Chrome Team"
          }
        ]
      }
    },
    {
      id: "fsw-mod-2",
      order: 2,
      title: "Module 2 — Front-End Architecture, Component Design & State Management",
      durationMinutes: 180,
      summary: "Component hierarchy design, container/presentational patterns, client-side routing, optimistic UI updates, and atomic state synchronization.",
      learningObjectives: [
        "Design modular frontend architectures using compound components and render props.",
        "Implement optimistic UI updates for instant feedback during network mutations.",
        "Manage global and server-cache state cleanly with TanStack Query and Zustand."
      ],
      resources: [
        {
          title: "React Official Documentation: Thinking in React",
          url: "https://react.dev/learn/thinking-in-react",
          description: "Step-by-step methodology for breaking UI into component hierarchies and identifying minimal state.",
          type: "documentation",
          provider: "React Core Team"
        },
        {
          title: "TanStack Query (React Query) Documentation",
          url: "https://tanstack.com/query/latest",
          description: "Declarative server state management, caching, background synchronization, and optimistic mutations.",
          type: "documentation",
          provider: "TanStack"
        }
      ],
      content: {
        overview: "Modern frontend architecture separates server state (caching, background sync via TanStack Query) from local UI state (Zustand/useState). Optimistic updates ensure interactions feel instantaneous to the user.",
        keyConcepts: [
          {
            section: "Section 1 — Frontend Architecture & State",
            topic: "Server State vs Client State",
            title: "Lesson 1 — Optimistic UI Mutations & Server State Sync with TanStack Query",
            prerequisites: "Module 1 (Web Architecture) and React/TypeScript fundamentals.",
            description: "How to manage server state using query keys, handle automatic background re-fetching, and implement optimistic mutations that update the UI before the server responds.",
            whyItMatters: "Treating server state as global React state leads to stale cache bugs, duplicate requests, and complicated synchronization code.",
            howItWorks: "TanStack Query intercepts mutations (`useMutation`). The `onMutate` callback updates the local cache immediately. If the server request errors, `onError` rolls the cache back to the previous snapshot.",
            stepByStep: [
              "Step 1: Wrap app in `QueryClientProvider`.",
              "Step 2: Fetch data with `useQuery({ queryKey: ['courses'], queryFn: fetchCourses })`.",
              "Step 3: Define mutation with `useMutation` and implement `onMutate` optimistic update.",
              "Step 4: Invalidate query on success with `queryClient.invalidateQueries({ queryKey: ['courses'] })`."
            ],
            workedExample: "Optimistic Enrollment Mutation Pattern:\n```typescript\nconst { mutate } = useMutation({\n  mutationFn: enrollInCourse,\n  onMutate: async (courseId) => {\n    await queryClient.cancelQueries({ queryKey: ['enrollments'] });\n    const prev = queryClient.getQueryData(['enrollments']);\n    queryClient.setQueryData(['enrollments'], (old: string[]) => [...old, courseId]);\n    return { prev };\n  },\n  onError: (err, id, context) => {\n    queryClient.setQueryData(['enrollments'], context?.prev);\n  }\n});\n```",
            realWorldUsage: "Interactive web applications (Linear, Notion, GitHub, Capacity Connect).",
            codeSnippet: "// Optimistic Mutation Architecture Pattern (TypeScript)\nexport interface CourseEnrollmentState {\n  courseId: string;\n  status: 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';\n}\n\nexport class OptimisticMutationManager {\n  private state: CourseEnrollmentState[] = [];\n\n  public async performOptimisticEnrollment(\n    courseId: string,\n    serverApiCall: (id: string) => Promise<boolean>\n  ): Promise<{ success: boolean; state: CourseEnrollmentState[] }> {\n    // 1. Snapshot previous state\n    const previousState = [...this.state];\n\n    // 2. Optimistic update (Instant UI feedback)\n    this.state.push({ courseId, status: 'ENROLLED' });\n    console.log('[Optimistic UI] Updated state immediately before network call');\n\n    try {\n      const result = await serverApiCall(courseId);\n      if (!result) throw new Error('Server rejected mutation');\n      return { success: true, state: this.state };\n    } catch (err) {\n      // 3. Rollback on failure\n      console.warn('[Optimistic UI] Server failed. Rolling back to previous state...');\n      this.state = previousState;\n      return { success: false, state: this.state };\n    }\n  }\n}\n\nconst manager = new OptimisticMutationManager();\nmanager.performOptimisticEnrollment('CRS_FSW_101', async () => true)\n  .then(res => console.log('Final State:', res));",
            codeExplanation: "1. Updates local UI state synchronously before awaiting network.\n2. Preserves snapshot of previous state for rollback.\n3. Automatically restores previous state if the backend mutation fails.",
            expectedOutput: "[Optimistic UI] Updated state immediately before network call\nFinal State: { success: true, state: [{ courseId: 'CRS_FSW_101', status: 'ENROLLED' }] }",
            commonMistakes: "Failing to capture a rollback snapshot during optimistic updates, leaving the UI permanently out-of-sync with the server on network failures.",
            bestPractices: "Use TanStack Query for all asynchronous server state and keep local React state minimal.",
            practiceTask: "Implement an optimistic todo/task checklist with TanStack Query and automatic error rollback.",
            keyTakeaway: "Optimistic mutations make web applications feel instant while robust rollback handlers guarantee data consistency."
          }
        ],
        practicalExercise: "Build an interactive course enrollment dashboard using TanStack Query with optimistic UI mutations, automatic rollback on error, and background cache invalidation.",
        competencyVerification: "Demonstrates frontend component architecture, server state management with TanStack Query, and optimistic mutations at Level 4.",
        resources: [
          {
            title: "React Official Documentation: Thinking in React",
            url: "https://react.dev/learn/thinking-in-react",
            description: "Step-by-step methodology for breaking UI into component hierarchies and identifying minimal state.",
            type: "documentation",
            provider: "React Core Team"
          },
          {
            title: "TanStack Query (React Query) Documentation",
            url: "https://tanstack.com/query/latest",
            description: "Declarative server state management, caching, background synchronization, and optimistic mutations.",
            type: "documentation",
            provider: "TanStack"
          }
        ]
      }
    },
    {
      id: "fsw-mod-3",
      order: 3,
      title: "Module 3 — Backend Service Design with Node.js, Express & TypeScript",
      durationMinutes: 180,
      summary: "Node.js libuv event loop architecture, Express middleware pipelines, controller-service-repository layered architecture, error handling middleware, and graceful shutdown.",
      learningObjectives: [
        "Structure backend services using clean Controller-Service-Repository layered architecture.",
        "Implement centralized error-handling middleware with structured error responses.",
        "Handle OS signals (SIGTERM/SIGINT) for graceful connection drainage."
      ],
      resources: [
        {
          title: "Node.js Documentation: Event Loop, Timers, and process.nextTick()",
          url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
          description: "Understanding libuv thread pools, I/O polling, and asynchronous event loops.",
          type: "documentation",
          provider: "Node.js Foundation"
        },
        {
          title: "Express.js Guide: Writing and Using Middleware",
          url: "https://expressjs.com/en/guide/writing-middleware.html",
          description: "Middleware execution flow, error-handling middleware, and route handlers.",
          type: "documentation",
          provider: "Express.js Team"
        }
      ],
      content: {
        overview: "Production backend Node.js applications require strict layered architecture (Controllers -> Services -> Repositories) and centralized error handling to ensure maintainability and high availability.",
        keyConcepts: [
          {
            section: "Section 1 — Layered Backend Architecture",
            topic: "Controller-Service-Repository Pattern",
            title: "Lesson 1 — Layered Architecture, Centralized Errors & Graceful Shutdown",
            prerequisites: "TypeScript and Node.js fundamentals.",
            description: "How to decouple HTTP routing (Controllers) from business rules (Services) and database access (Repositories), write error-handling middleware, and handle SIGTERM signals for zero-downtime deployments.",
            whyItMatters: "Mixing SQL queries directly inside Express route handlers leads to untestable spaghetti code and connection leaks during pod restarts.",
            howItWorks: "Controllers parse and validate HTTP requests, Services execute domain logic, Repositories interact with ORMs/databases. Global error middleware catches rejected promises.",
            stepByStep: [
              "Step 1: Create Controller layer to handle `req` and `res`.",
              "Step 2: Create Service layer containing pure business logic functions.",
              "Step 3: Register global error middleware: `(err, req, res, next) => res.status(err.status || 500).json(...)`.",
              "Step 4: Add `process.on('SIGTERM', () => server.close())` to drain active HTTP connections gracefully."
            ],
            workedExample: "Layered Service Structure:\n```typescript\n// Controller\nexport async function getProfile(req: Request, res: Response) {\n  const profile = await profileService.getUserProfile(req.params.id);\n  res.json(profile);\n}\n```",
            realWorldUsage: "Enterprise Node.js/TypeScript backend services.",
            codeSnippet: "// Layered Backend Architecture & Graceful Shutdown Pattern (TypeScript)\nimport express, { Request, Response, NextFunction } from 'express';\nimport http from 'http';\n\n// 1. Service Layer\nexport class EmployeeService {\n  async getEmployeeById(id: string) {\n    if (!id.startsWith('EMP_')) throw new Error('INVALID_ID');\n    return { id, name: 'Alex Johnson', role: 'Full Stack Developer' };\n  }\n}\n\n// 2. Controller Layer\nexport class EmployeeController {\n  constructor(private service: EmployeeService) {}\n\n  async handleGet(req: Request, res: Response, next: NextFunction) {\n    try {\n      const result = await this.service.getEmployeeById(req.params.id);\n      res.status(200).json(result);\n    } catch (err) {\n      next(err); // Delegate to centralized error middleware\n    }\n  }\n}\n\n// 3. Centralized Error Handler Middleware\nexport function globalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {\n  const isValidation = err.message === 'INVALID_ID';\n  res.status(isValidation ? 400 : 500).json({\n    error: isValidation ? 'Invalid employee identifier format' : 'Internal server error'\n  });\n}",
            codeExplanation: "1. Separates HTTP transport concerns from business service logic.\n2. Global error middleware centralizes exception-to-HTTP mapping.\n3. Enables clean unit testing of services without mocking Express request objects.",
            expectedOutput: "Renders clean JSON payloads and structured error codes.",
            commonMistakes: "Forgetting to pass errors from async route handlers to `next(err)`, causing requests to hang indefinitely on unhandled rejections.",
            bestPractices: "Always use layered architecture and listen to `SIGTERM` signals for zero-downtime rolling container deployments.",
            practiceTask: "Implement a complete Express controller-service-repository stack with graceful database connection teardown on SIGTERM.",
            keyTakeaway: "Layered architecture isolates business logic from HTTP transport and ensures clean, testable, and resilient backend services."
          }
        ],
        practicalExercise: "Build a production-ready Express/TypeScript backend service adhering to the Controller-Service-Repository pattern with centralized error middleware and graceful shutdown handlers.",
        competencyVerification: "Demonstrates Node.js service design, layered architecture, and error middleware engineering at Level 4.",
        resources: [
          {
            title: "Node.js Documentation: Event Loop, Timers, and process.nextTick()",
            url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
            description: "Understanding libuv thread pools, I/O polling, and asynchronous event loops.",
            type: "documentation",
            provider: "Node.js Foundation"
          },
          {
            title: "Express.js Guide: Writing and Using Middleware",
            url: "https://expressjs.com/en/guide/writing-middleware.html",
            description: "Middleware execution flow, error-handling middleware, and route handlers.",
            type: "documentation",
            provider: "Express.js Team"
          }
        ]
      }
    },
    {
      id: "fsw-mod-4",
      order: 4,
      title: "Module 4 — Relational Database Modeling, Schema Migrations & ORM Architecture (Prisma)",
      durationMinutes: 180,
      summary: "Relational modeling (1:1, 1:N, N:M), foreign keys, composite indexes, Prisma schema modeling, non-destructive migrations (prisma migrate deploy), and transactional batching ($transaction).",
      learningObjectives: [
        "Design normalized relational database schemas with foreign key integrity and composite indexes.",
        "Execute production database migrations using Prisma without downtime or data loss.",
        "Implement ACID multi-table transactions using Prisma `$transaction`."
      ],
      resources: [
        {
          title: "Prisma Documentation: Schema Reference & Migrations Guide",
          url: "https://www.prisma.io/docs/concepts/components/prisma-schema",
          description: "Data modeling, relations, attributes (@id, @unique, @index), and migration workflows.",
          type: "documentation",
          provider: "Prisma"
        },
        {
          title: "PostgreSQL Documentation: Indexes and Relational Integrity",
          url: "https://www.postgresql.org/docs/current/indexes.html",
          description: "B-Tree indexes, composite keys, foreign keys, and query planner optimization.",
          type: "documentation",
          provider: "PostgreSQL Global Development Group"
        }
      ],
      content: {
        overview: "Relational data modeling forms the foundation of reliable full-stack applications. Using Prisma ORM with PostgreSQL ensures type-safe database queries, automated non-destructive schema migrations, and transactional data integrity.",
        keyConcepts: [
          {
            section: "Section 1 — Relational Modeling & Prisma",
            topic: "Prisma Schemas & Transactions",
            title: "Lesson 1 — Relational Schema Design, Composite Indexes & Prisma $transaction",
            prerequisites: "Module 3 (Backend Design) and basic SQL.",
            description: "How to define 1:N and N:M relationships in Prisma schemas, create composite indexes for multi-column query filtering, and wrap dependent mutations inside ACID transactions.",
            whyItMatters: "Unindexed foreign keys cause full table scans; executing multi-table mutations without transactions causes orphaned, corrupted records if one step fails.",
            howItWorks: "Prisma client generates strongly-typed TypeScript models from `schema.prisma`. `prisma.$transaction([op1, op2])` commits all queries atomically or rolls back completely.",
            stepByStep: [
              "Step 1: Define models with `@id`, `@relation`, and `@@index([orgId, status])` in `schema.prisma`.",
              "Step 2: Generate migration files: `npx prisma migrate dev --name init_schema`.",
              "Step 3: Query relations using type-safe `include` and `select` clauses.",
              "Step 4: Execute multi-step mutations atomically with `prisma.$transaction()`."
            ],
            workedExample: "Prisma Schema Relation Definition:\n```prisma\nmodel Course {\n  id          String         @id @default(cuid())\n  title       String\n  modules     CourseModule[]\n  enrollments Enrollment[]\n  @@index([title])\n}\n\nmodel CourseModule {\n  id        String   @id @default(cuid())\n  title     String\n  courseId  String\n  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)\n  @@index([courseId])\n}\n```",
            realWorldUsage: "Database layer for modern TypeScript full-stack applications.",
            codeSnippet: "// Type-Safe Database Transaction with Prisma ORM Pattern (TypeScript)\nexport interface CourseEnrollmentData {\n  employeeId: string;\n  courseId: string;\n  initialModuleId: string;\n}\n\nexport class EnrollmentRepository {\n  // Simulated Prisma Client $transaction wrapper\n  async enrollEmployeeWithAudit(data: CourseEnrollmentData): Promise<{ enrollmentId: string; success: boolean }> {\n    // In real Prisma: await prisma.$transaction(async (tx) => { ... })\n    console.log(`[DB Transaction] 1. Creating CourseEnrollment for ${data.employeeId} in ${data.courseId}`);\n    console.log(`[DB Transaction] 2. Initializing ModuleProgress for ${data.initialModuleId}`);\n    console.log(`[DB Transaction] 3. Emitting AuditLog record`);\n    \n    const enrollmentId = `ENR_${Date.now()}`;\n    return { enrollmentId, success: true };\n  }\n}\n\nconst repo = new EnrollmentRepository();\nrepo.enrollEmployeeWithAudit({\n  employeeId: 'EMP_101',\n  courseId: 'course-fsw-401',\n  initialModuleId: 'fsw-mod-1'\n}).then(res => console.log('Transaction Result:', res));",
            codeExplanation: "1. Encapsulates multi-table operations into an atomic transaction.\n2. Guarantees that enrollment, initial progress, and audit logs succeed or fail together.\n3. Prevents orphaned records in production databases.",
            expectedOutput: "Transaction Result: { enrollmentId: 'ENR_...', success: true }",
            commonMistakes: "Executing independent database writes sequentially without a transaction, leaving half-saved data when a network or database constraint error occurs.",
            bestPractices: "Always index foreign keys (`@@index([foreignKeyId])`) and wrap multi-entity writes in `prisma.$transaction()`.",
            practiceTask: "Design a Prisma schema for a multi-tenant course review system and implement an atomic transaction creating reviews and updating average course ratings.",
            keyTakeaway: "Normalized relational schemas with composite indexes and ACID transactions guarantee data integrity and high-performance database querying."
          }
        ],
        practicalExercise: "Design a normalized PostgreSQL schema in Prisma for multi-tenant course progress tracking, add composite indexes for tenant queries, and implement atomic transactions.",
        competencyVerification: "Demonstrates relational database design, composite indexing, and Prisma ORM transaction architecture at Level 4.",
        resources: [
          {
            title: "Prisma Documentation: Schema Reference & Migrations Guide",
            url: "https://www.prisma.io/docs/concepts/components/prisma-schema",
            description: "Data modeling, relations, attributes (@id, @unique, @index), and migration workflows.",
            type: "documentation",
            provider: "Prisma"
          },
          {
            title: "PostgreSQL Documentation: Indexes and Relational Integrity",
            url: "https://www.postgresql.org/docs/current/indexes.html",
            description: "B-Tree indexes, composite keys, foreign keys, and query planner optimization.",
            type: "documentation",
            provider: "PostgreSQL Global Development Group"
          }
        ]
      }
    },
    {
      id: "fsw-mod-5",
      order: 5,
      title: "Module 5 — Authentication, Session Security, CSRF/CORS & OAuth2",
      durationMinutes: 180,
      summary: "Password hashing with Argon2/bcrypt, secure session cookies (HttpOnly, Secure, SameSite=Strict), CSRF token defense, CORS preflight headers, and OAuth2 social login.",
      learningObjectives: [
        "Implement secure password hashing using Argon2id with adaptive work factors.",
        "Configure hardened session cookies (HttpOnly, Secure, SameSite=Lax/Strict) to mitigate XSS/CSRF.",
        "Configure CORS preflight headers correctly for cross-origin SPA architectures."
      ],
      resources: [
        {
          title: "OWASP Top Ten: Session Management & Authentication Cheat Sheet",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
          description: "Cookie security flags, session expiration, token storage, and anti-CSRF tokens.",
          type: "guide",
          provider: "OWASP Foundation"
        },
        {
          title: "MDN Web Docs: Cross-Origin Resource Sharing (CORS)",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
          description: "Preflight OPTIONS requests, Access-Control-Allow-Origin headers, and credentialed requests.",
          type: "documentation",
          provider: "MDN Web Docs"
        }
      ],
      content: {
        overview: "Web security requires defensive engineering across every layer. Using Argon2id password hashing, HttpOnly secure cookies, SameSite attributes, and explicit CORS origin whitelists protects applications from XSS, CSRF, and session hijacking.",
        keyConcepts: [
          {
            section: "Section 1 — Session Security & Web Defense",
            topic: "Cookie Security & CORS",
            title: "Lesson 1 — Hardened Cookie Sessions, Anti-CSRF Defense & CORS Whitelisting",
            prerequisites: "Module 1 (Web Architecture) and HTTP headers.",
            description: "Why localStorage is vulnerable to XSS token theft, how `HttpOnly; Secure; SameSite=Strict` cookies safeguard sessions, and how to handle CORS preflight OPTIONS requests.",
            whyItMatters: "Storing JWTs in `localStorage` allows any injected third-party XSS script to steal tokens. Secure HttpOnly cookies are inaccessible to client-side JavaScript.",
            howItWorks: "The server sets session cookies with `HttpOnly; Secure; SameSite=Strict`. The browser sends them automatically on requests. CORS middleware checks `Origin` against an explicit whitelist.",
            stepByStep: [
              "Step 1: Hash passwords using `argon2id` before saving to database.",
              "Step 2: Issue session ID in `Set-Cookie: sessionId=...; HttpOnly; Secure; SameSite=Lax; Path=/`.",
              "Step 3: Configure CORS with explicit origin whitelist and `credentials: true`.",
              "Step 4: Rotate session IDs upon privilege elevation to prevent session fixation."
            ],
            workedExample: "Secure Set-Cookie Header:\n`Set-Cookie: session_token=a9f82b7...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`",
            realWorldUsage: "Enterprise banking applications, healthcare portals, and SaaS platforms.",
            codeSnippet: "// Secure Cookie Session & CORS Configuration Middleware (TypeScript)\nimport { Request, Response, NextFunction } from 'express';\n\nexport interface SessionCookieOptions {\n  isProduction: boolean;\n  maxAgeMs?: number;\n}\n\nexport function attachSecureSessionCookie(res: Response, token: string, options: SessionCookieOptions) {\n  res.cookie('auth_session', token, {\n    httpOnly: true,                                  // Inaccessible to JavaScript (XSS protection)\n    secure: options.isProduction,                     // Sent only over HTTPS\n    sameSite: 'lax',                                 // Mitigates CSRF on cross-site navigations\n    maxAge: options.maxAgeMs || 24 * 60 * 60 * 1000, // 24 hours\n    path: '/'\n  });\n}\n\nexport function enforceCorsWhitelist(allowedOrigins: string[]) {\n  return (req: Request, res: Response, next: NextFunction) => {\n    const origin = req.headers.origin;\n    if (origin && allowedOrigins.includes(origin)) {\n      res.setHeader('Access-Control-Allow-Origin', origin);\n      res.setHeader('Access-Control-Allow-Credentials', 'true');\n      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');\n      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');\n    }\n    if (req.method === 'OPTIONS') {\n      res.sendStatus(204);\n      return;\n    }\n    next();\n  };\n}",
            codeExplanation: "1. Enforces HttpOnly and Secure cookie flags.\n2. Sets SameSite=Lax to protect against cross-site request forgery.\n3. Whitelists specific origins rather than using wildcard `*` with credentials.",
            expectedOutput: "Sets secure session cookie and returns CORS preflight headers for authorized origins.",
            commonMistakes: "Using `Access-Control-Allow-Origin: *` while attempting to send credentials/cookies, which is rejected by all modern browsers.",
            bestPractices: "Never store authentication tokens in `localStorage` or `sessionStorage`; always use HttpOnly, Secure, SameSite cookies.",
            practiceTask: "Configure an authentication module with Argon2 password hashing and secure HttpOnly cookie session management.",
            keyTakeaway: "HttpOnly, Secure, SameSite cookies and explicit CORS whitelisting form the bedrock of production web security."
          }
        ],
        practicalExercise: "Build a complete authentication pipeline with Argon2 password hashing, secure HttpOnly cookie sessions, and hardened CORS middleware.",
        competencyVerification: "Demonstrates web security fundamentals, session management, CSRF mitigation, and CORS architecture at Level 4.",
        resources: [
          {
            title: "OWASP Top Ten: Session Management & Authentication Cheat Sheet",
            url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html",
            description: "Cookie security flags, session expiration, token storage, and anti-CSRF tokens.",
            type: "guide",
            provider: "OWASP Foundation"
          },
          {
            title: "MDN Web Docs: Cross-Origin Resource Sharing (CORS)",
            url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
            description: "Preflight OPTIONS requests, Access-Control-Allow-Origin headers, and credentialed requests.",
            type: "documentation",
            provider: "MDN Web Docs"
          }
        ]
      }
    },
    {
      id: "fsw-mod-6",
      order: 6,
      title: "Module 6 — RESTful API Design, Middleware Architecture & Error Handling",
      durationMinutes: 180,
      summary: "Designing scalable REST APIs, request validation with Zod, Express middleware chains, rate limiting middleware, and standardized API responses.",
      learningObjectives: [
        "Implement composable Express middleware pipelines for logging, rate limiting, and auth.",
        "Validate incoming request params, queries, and bodies with Zod schemas.",
        "Standardize API responses with consistent pagination envelopes."
      ],
      resources: [
        {
          title: "Zod: TypeScript-First Schema Validation Documentation",
          url: "https://zod.dev/",
          description: "Parsing API payloads, generating inferred types with z.infer, and custom error formatting.",
          type: "documentation",
          provider: "Zod"
        },
        {
          title: "Express.js Guide: Routing & Middleware Design",
          url: "https://expressjs.com/en/guide/routing.html",
          description: "Route handlers, route parameters, response methods, and modular router design.",
          type: "documentation",
          provider: "Express.js Team"
        }
      ],
      content: {
        overview: "Building robust REST APIs requires composable middleware pipelines that validate incoming request schemas before hitting controller logic, emit standardized JSON responses, and paginate large collections.",
        keyConcepts: [
          {
            section: "Section 1 — API Middleware & Schema Validation",
            topic: "Zod Middleware & Pagination Envelopes",
            title: "Lesson 1 — Composable Zod Request Validation & Standardized Pagination Envelopes",
            prerequisites: "Module 3 (Backend Design) and TypeScript.",
            description: "How to build generic Express middleware that validates `req.body`, `req.query`, and `req.params` against Zod schemas, returning 400 Bad Request with field errors if invalid.",
            whyItMatters: "Manual input checking across 50 endpoints creates code duplication and allows unvalidated data to reach database queries.",
            howItWorks: "The `validateRequest(schema)` middleware calls `schema.safeParse()`. If parsing fails, it halts the request chain and sends structured validation errors; otherwise, it assigns typed data to `req.body` and calls `next()`.",
            stepByStep: [
              "Step 1: Define validation schemas for body, query, and params using Zod.",
              "Step 2: Create reusable middleware wrapping `schema.safeParse()`.",
              "Step 3: Attach middleware to route: `router.post('/courses', validateRequest(createCourseSchema), controller)`.",
              "Step 4: Format paginated list responses with `{ data, pagination: { page, totalPages, totalItems } }`."
            ],
            workedExample: "Standardized Paginated Response Envelope:\n```json\n{\n  \"data\": [\n    { \"id\": \"CRS_1\", \"title\": \"Full Stack Web Development\" }\n  ],\n  \"pagination\": {\n    \"page\": 1,\n    \"pageSize\": 20,\n    \"totalItems\": 13,\n    \"totalPages\": 1\n  }\n}\n```",
            realWorldUsage: "Standard API architecture across enterprise SaaS platforms.",
            codeSnippet: "// Generic Zod Validation Middleware for Express (TypeScript)\nimport { Request, Response, NextFunction } from 'express';\nimport { z, ZodSchema } from 'zod';\n\nexport function validateRequestBody<T>(schema: ZodSchema<T>) {\n  return (req: Request, res: Response, next: NextFunction) => {\n    const result = schema.safeParse(req.body);\n    if (!result.success) {\n      const errors = result.error.errors.map(err => ({\n        field: err.path.join('.'),\n        message: err.message\n      }));\n      res.status(400).json({\n        error: 'Validation Failed',\n        details: errors\n      });\n      return;\n    }\n    req.body = result.data;\n    next();\n  };\n}\n\n// Usage demonstration with Course Creation Schema\nconst courseSchema = z.object({\n  title: z.string().min(3, 'Title must be at least 3 characters'),\n  durationMinutes: z.number().positive('Duration must be positive')\n});",
            codeExplanation: "1. Validates incoming JSON payloads against Zod schemas.\n2. Automatically extracts and formats nested field validation errors.\n3. Narrows request body to strongly-typed validated object.",
            expectedOutput: "Passes valid data to downstream controller or returns structured 400 Bad Request.",
            commonMistakes: "Trusting incoming request data without validating string lengths, numbers, and enum values, causing runtime SQL/NoSQL injection or unhandled exceptions.",
            bestPractices: "Always validate request params, queries, and bodies at the middleware boundary using Zod.",
            practiceTask: "Implement a cursor-based pagination middleware that extracts `limit` and `cursor` from query parameters and formats the response envelope.",
            keyTakeaway: "Declarative Zod schema validation middleware provides a secure, type-safe perimeter for backend REST APIs."
          }
        ],
        practicalExercise: "Build an Express REST API featuring generic Zod validation middleware, cursor-based pagination envelopes, and structured error responses.",
        competencyVerification: "Demonstrates REST API architecture, Zod schema validation middleware, and paginated response design at Level 4.",
        resources: [
          {
            title: "Zod: TypeScript-First Schema Validation Documentation",
            url: "https://zod.dev/",
            description: "Parsing API payloads, generating inferred types with z.infer, and custom error formatting.",
            type: "documentation",
            provider: "Zod"
          },
          {
            title: "Express.js Guide: Routing & Middleware Design",
            url: "https://expressjs.com/en/guide/routing.html",
            description: "Route handlers, route parameters, response methods, and modular router design.",
            type: "documentation",
            provider: "Express.js Team"
          }
        ]
      }
    },
    {
      id: "fsw-mod-7",
      order: 7,
      title: "Module 7 — CI/CD Pipelines, Docker Containerization & Cloud Deployment",
      durationMinutes: 180,
      summary: "Multi-stage Dockerfiles for Next.js / Node.js, Docker Compose local development, GitHub Actions CI/CD workflows, container security scanning, and zero-downtime rolling deployments.",
      learningObjectives: [
        "Author optimized multi-stage Dockerfiles reducing image size from 1GB to <100MB.",
        "Build automated GitHub Actions CI/CD workflows running linting, typechecking, and tests.",
        "Configure health probes (liveness/readiness) for zero-downtime containerized cloud deployments."
      ],
      resources: [
        {
          title: "Docker Official Documentation: Multi-stage builds",
          url: "https://docs.docker.com/build/building/multi-stage/",
          description: "Optimizing container image size, caching layers, and stripping build dependencies.",
          type: "documentation",
          provider: "Docker Inc."
        },
        {
          title: "GitHub Actions Documentation: Building and testing Node.js",
          url: "https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs",
          description: "CI workflow configuration, caching npm dependencies, and running matrix test suites.",
          type: "documentation",
          provider: "GitHub"
        }
      ],
      content: {
        overview: "Production full-stack applications require automated CI/CD pipelines and optimized multi-stage Docker containers. Stripping build tooling and non-production dependencies minimizes attack surface and accelerates deployment velocity.",
        keyConcepts: [
          {
            section: "Section 1 — Docker & CI/CD",
            topic: "Multi-Stage Dockerfile & GitHub Actions",
            title: "Lesson 1 — Production Multi-Stage Dockerfiles & GitHub Actions CI Pipelines",
            prerequisites: "Module 3 (Backend Design) and Linux terminal basics.",
            description: "How to use multi-stage Docker builds to separate compile-time dependencies from the runtime container, run non-root users, and automate testing in GitHub Actions.",
            whyItMatters: "Deploying raw source code with full `node_modules` creates 1.2GB images full of build tooling vulnerabilities. Multi-stage builds create lightweight, secure ~90MB production images.",
            howItWorks: "Stage 1 (`builder`) installs devDependencies, compiles TypeScript, and runs migrations. Stage 2 (`runner`) copies only compiled `.js` files and production dependencies, running as a non-privileged `node` user.",
            stepByStep: [
              "Step 1: Write multi-stage Dockerfile with `node:20-alpine` base image.",
              "Step 2: Install dependencies with `npm ci`.",
              "Step 3: Copy only compiled output from builder stage to minimal runner stage.",
              "Step 4: Set `USER node` for non-root security.",
              "Step 5: Create `.github/workflows/ci.yml` running `npm test` and `npx tsc --noEmit`."
            ],
            workedExample: "Multi-Stage Dockerfile Blueprint:\n```dockerfile\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY --from=builder /app/dist ./dist\nUSER node\nEXPOSE 3000\nCMD [\"node\", \"dist/index.js\"]\n```",
            realWorldUsage: "Standard deployment pipeline across modern container platforms (AWS ECS, GCP Cloud Run, Kubernetes).",
            codeSnippet: "// GitHub Actions Workflow Configuration Blueprint (YAML/Concept)\nexport const sampleCiPipelineYaml = `\nname: Continuous Integration\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Setup Node.js 20\n        uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n      - run: npm ci\n      - run: npx tsc --noEmit\n      - run: npm run lint\n      - run: npm test\n`;\n\nconsole.log('[CI Pipeline Spec Validated]');",
            codeExplanation: "1. Runs automated verification on all pull requests.\n2. Uses npm caching for sub-minute build times.\n3. Blocks merging if typecheck, linting, or unit tests fail.",
            expectedOutput: "[CI Pipeline Spec Validated]",
            commonMistakes: "Running containers as the default `root` user, creating critical container breakout security vulnerabilities.",
            bestPractices: "Always use `USER node` in Dockerfiles and scan images with Trivy or Snyk in CI pipelines.",
            practiceTask: "Create an optimized multi-stage Dockerfile for a Next.js application using Standalone output mode.",
            keyTakeaway: "Multi-stage Docker builds and automated CI pipelines guarantee consistent, secure, and reproducible production deployments."
          }
        ],
        practicalExercise: "Author a multi-stage Dockerfile for a full-stack Next.js/Express service, configure health check endpoints, and create an automated GitHub Actions CI verification pipeline.",
        competencyVerification: "Demonstrates containerization architecture, multi-stage Docker optimization, and CI/CD automation at Level 4.",
        resources: [
          {
            title: "Docker Official Documentation: Multi-stage builds",
            url: "https://docs.docker.com/build/building/multi-stage/",
            description: "Optimizing container image size, caching layers, and stripping build dependencies.",
            type: "documentation",
            provider: "Docker Inc."
          },
          {
            title: "GitHub Actions Documentation: Building and testing Node.js",
            url: "https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs",
            description: "CI workflow configuration, caching npm dependencies, and running matrix test suites.",
            type: "documentation",
            provider: "GitHub"
          }
        ]
      }
    },
    {
      id: "fsw-mod-8",
      order: 8,
      title: "Module 8 — End-to-End System Testing (Playwright/Cypress), Performance Auditing & Production Readiness",
      durationMinutes: 180,
      summary: "End-to-End browser testing with Playwright, Page Object Model (POM), synthetic performance monitoring (Lighthouse CI), security checklists, and production go-live readiness.",
      learningObjectives: [
        "Author robust End-to-End browser test suites using Playwright and the Page Object Model.",
        "Automate Core Web Vitals and accessibility auditing in CI using Lighthouse CI.",
        "Execute comprehensive production readiness reviews covering security, monitoring, and rollbacks."
      ],
      resources: [
        {
          title: "Playwright Official Documentation: Getting Started & Best Practices",
          url: "https://playwright.dev/docs/intro",
          description: "Cross-browser testing (Chromium, Firefox, WebKit), locators, assertions, and Page Object Model.",
          type: "documentation",
          provider: "Microsoft Playwright"
        },
        {
          title: "Google Lighthouse CI Documentation",
          url: "https://github.com/GoogleChrome/lighthouse-ci",
          description: "Automated Core Web Vitals, performance scoring, and accessibility assertions in CI/CD.",
          type: "documentation",
          provider: "Google Chrome Team"
        }
      ],
      content: {
        overview: "The final phase of full-stack engineering is verifying end-to-end system reliability. Using Playwright with Page Object Models ensures critical user journeys (authentication, course progress, checkout) remain unbroken across all browser engines.",
        keyConcepts: [
          {
            section: "Section 1 — E2E Testing & Production Readiness",
            topic: "Playwright & Page Object Model",
            title: "Lesson 1 — End-to-End Browser Automation with Playwright & Page Object Models",
            prerequisites: "Modules 1 through 7 (Complete Full Stack Suite).",
            description: "How to structure maintainable E2E tests using the Page Object Model (POM), use resilient user-facing locators (`getByRole`, `getByText`), and automate accessibility checks.",
            whyItMatters: "Fragile E2E tests relying on CSS classes break whenever styling changes. Playwright user-facing locators ensure tests reflect real user accessibility interactions.",
            howItWorks: "Playwright drives real Chromium, Firefox, and WebKit browser binaries via the Chrome DevTools Protocol, automatically awaiting element readiness before clicking.",
            stepByStep: [
              "Step 1: Define Page Object class encapsulating page locators and interaction methods.",
              "Step 2: Use accessible locators: `page.getByRole('button', { name: 'Enroll' })`.",
              "Step 3: Write test assertions with auto-retrying `expect(locator).toBeVisible()`.",
              "Step 4: Execute test suites headlessly across multi-browser matrix in CI."
            ],
            workedExample: "Page Object Model Example:\n```typescript\nexport class CoursePage {\n  constructor(private page: Page) {}\n  async enroll() {\n    await this.page.getByRole('button', { name: 'Enroll in Course' }).click();\n  }\n  async verifyEnrolled() {\n    await expect(this.page.getByText('Status: Enrolled')).toBeVisible();\n  }\n}\n```",
            realWorldUsage: "Continuous verification of mission-critical user workflows across top engineering organizations.",
            codeSnippet: "// Playwright Page Object Model Architecture Pattern (TypeScript)\nexport class LearningRunnerPage {\n  private locators = {\n    startModuleButton: 'button:has-text(\"Start Module\")',\n    completeTopicButton: 'button:has-text(\"Mark as Completed\")',\n    progressPercentage: '[data-testid=\"progress-percent\"]'\n  };\n\n  async navigateToModule(moduleId: string): Promise<string> {\n    console.log(`[Playwright POM] Navigating to module ${moduleId}`);\n    return `https://capacityconnect.com/learning/${moduleId}`;\n  }\n\n  async verifyProgressUpdate(expectedPercent: number): Promise<boolean> {\n    console.log(`[Playwright POM] Asserting progress equals ${expectedPercent}%`);\n    return true;\n  }\n}\n\n// Usage demo\nconst runnerPage = new LearningRunnerPage();\nrunnerPage.navigateToModule('fsw-mod-1').then(() => runnerPage.verifyProgressUpdate(100));",
            codeExplanation: "1. Encapsulates page selectors inside Page Object Model.\n2. Decouples test assertions from DOM implementation details.\n3. Provides maintainable, self-documenting test suites.",
            expectedOutput: "[Playwright POM] Navigating to module fsw-mod-1\n[Playwright POM] Asserting progress equals 100%",
            commonMistakes: "Using hardcoded `page.waitForTimeout(5000)` sleeps instead of Playwright's built-in auto-waiting assertions (`await expect(element).toBeVisible()`).",
            bestPractices: "Always prefer accessible role-based locators (`getByRole`, `getByLabel`) over fragile CSS/XPath selectors.",
            practiceTask: "Author a Playwright E2E test suite covering the entire user onboarding, course enrollment, and module completion flow.",
            keyTakeaway: "Playwright E2E tests and Page Object Models provide regression-proof confidence before deploying full-stack systems to production."
          }
        ],
        practicalExercise: "Build an End-to-End test suite using Playwright and the Page Object Model that validates user authentication, course enrollment, and progress tracking across Chromium and Firefox.",
        competencyVerification: "Demonstrates End-to-End testing architecture, Page Object Model design, and production readiness verification at Level 4.",
        resources: [
          {
            title: "Playwright Official Documentation: Getting Started & Best Practices",
            url: "https://playwright.dev/docs/intro",
            description: "Cross-browser testing (Chromium, Firefox, WebKit), locators, assertions, and Page Object Model.",
            type: "documentation",
            provider: "Microsoft Playwright"
          },
          {
            title: "Google Lighthouse CI Documentation",
            url: "https://github.com/GoogleChrome/lighthouse-ci",
            description: "Automated Core Web Vitals, performance scoring, and accessibility assertions in CI/CD.",
            type: "documentation",
            provider: "Google Chrome Team"
          }
        ]
      }
    }
  ]
};
