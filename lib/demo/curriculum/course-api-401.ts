import { CourseCurriculum } from "./types";

export const courseApi401: CourseCurriculum = {
  courseId: "course-api-401",
  totalDurationMinutes: 1600,
  modules: [
    {
      id: "api-mod-1",
      order: 1,
      title: "Module 1 — RESTful API Design & OpenAPI / Swagger Specification",
      durationMinutes: 160,
      summary: "REST constraints, URI resource naming, HTTP status codes, Richardson Maturity Model, HATEOAS, and OpenAPI 3.1 contract-first development.",
      learningObjectives: [
        "Design clean RESTful resource hierarchies with proper HTTP method semantics.",
        "Author contract-first OpenAPI 3.1 specifications with reusable schemas.",
        "Implement RFC 7807 Problem Details for standardized HTTP error responses."
      ],
      resources: [
        {
          title: "OpenAPI Specification 3.1.0 Official Standard",
          url: "https://spec.openapis.org/oas/v3.1.0",
          description: "Official schema specification for defining RESTful APIs, security schemes, and payloads.",
          type: "specification",
          provider: "OpenAPI Initiative"
        },
        {
          title: "RFC 7807: Problem Details for HTTP APIs (IETF Standard)",
          url: "https://datatracker.ietf.org/doc/html/rfc7807",
          description: "Standardized JSON format for carrying machine-readable error details in HTTP responses.",
          type: "specification",
          provider: "IETF"
        }
      ],
      content: {
        overview: "Professional backend engineering begins with contract-first API design. Adhering to REST constraints, OpenAPI 3.1 standards, and RFC 7807 Problem Details ensures clear, evolvable contracts across frontend and backend engineering squads.",
        keyConcepts: [
          {
            section: "Section 1 — REST Architecture & OpenAPI",
            topic: "Contract-First API Design",
            title: "Lesson 1 — RESTful Resource Modeling & RFC 7807 Problem Details",
            prerequisites: "HTTP protocol fundamentals and JSON data modeling.",
            description: "How to structure noun-based URI resources, map CRUD operations to HTTP methods (GET, POST, PUT, PATCH, DELETE), and standardize error responses with RFC 7807 Problem Details.",
            whyItMatters: "Inconsistent API verbs and custom error schemas force frontend teams to write fragile, ad-hoc response parsers.",
            howItWorks: "Endpoints represent resource collections (`/api/v1/organizations/{orgId}/employees`). Successful mutations return standard status codes (201 Created with Location header, 204 No Content). Errors return `application/problem+json`.",
            stepByStep: [
              "Step 1: Model domain nouns as plural resource paths.",
              "Step 2: Use PATCH for partial updates and PUT for complete replacements.",
              "Step 3: Return appropriate HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 500).",
              "Step 4: Format all error payloads according to RFC 7807 specification."
            ],
            workedExample: "RFC 7807 Error Payload:\n```json\n{\n  \"type\": \"https://api.enterprise.com/errors/insufficient-capacity\",\n  \"title\": \"Insufficient Team Capacity\",\n  \"status\": 422,\n  \"detail\": \"Organization ORG_10 has exceeded its active employee allocation quota (100/100).\",\n  \"instance\": \"/api/v1/employees/provision\"\n}\n```",
            realWorldUsage: "Enterprise microservices at Stripe, GitHub, Twilio, and AWS.",
            codeSnippet: "// RFC 7807 Standardized Problem Details Factory (TypeScript)\nexport interface ProblemDetails {\n  type: string;\n  title: string;\n  status: number;\n  detail: string;\n  instance: string;\n  invalidParams?: Array<{ name: string; reason: string }>;\n}\n\nexport class ApiHttpError extends Error {\n  public readonly problem: ProblemDetails;\n\n  constructor(status: number, title: string, detail: string, instance: string, invalidParams?: Array<{ name: string; reason: string }>) {\n    super(detail);\n    this.problem = {\n      type: `https://api.capacityconnect.com/errors/${title.toLowerCase().replace(/\\s+/g, '-')}`,\n      title,\n      status,\n      detail,\n      instance,\n      invalidParams\n    };\n  }\n}\n\nexport function createValidationError(instance: string, field: string, reason: string): ApiHttpError {\n  return new ApiHttpError(\n    422,\n    'Unprocessable Entity',\n    'The request payload failed validation constraints.',\n    instance,\n    [{ name: field, reason }]\n  );\n}",
            codeExplanation: "1. Encapsulates RFC 7807 standard error structure.\n2. Provides machine-readable error `type` URIs and human-readable `detail`.\n3. Enables consistent automated client SDK error handling.",
            expectedOutput: "Emits application/problem+json conforming error payload.",
            commonMistakes: "Using verbs in URIs (e.g., `/api/getEmployees` or `/api/deleteUser`) rather than standard HTTP method semantics on plural nouns.",
            bestPractices: "Always version APIs via URI (`/v1/`) and provide machine-readable OpenAPI specs generated during build.",
            practiceTask: "Author an OpenAPI 3.1 YAML document describing a complete CRUD resource endpoint for employee skill assessments.",
            keyTakeaway: "Contract-first API design with OpenAPI and RFC 7807 ensures predictable, self-documenting, and robust backend integrations."
          }
        ],
        practicalExercise: "Author a complete OpenAPI 3.1 specification for a multi-tenant course enrollment service and implement the corresponding TypeScript Express/Fastify route handler with RFC 7807 error formatting.",
        competencyVerification: "Demonstrates RESTful API modeling, OpenAPI 3.1 contract authoring, and RFC 7807 error standardization at Level 4.",
        resources: [
          {
            title: "OpenAPI Specification 3.1.0 Official Standard",
            url: "https://spec.openapis.org/oas/v3.1.0",
            description: "Official schema specification for defining RESTful APIs, security schemes, and payloads.",
            type: "specification",
            provider: "OpenAPI Initiative"
          },
          {
            title: "RFC 7807: Problem Details for HTTP APIs (IETF Standard)",
            url: "https://datatracker.ietf.org/doc/html/rfc7807",
            description: "Standardized JSON format for carrying machine-readable error details in HTTP responses.",
            type: "specification",
            provider: "IETF"
          }
        ]
      }
    },
    {
      id: "api-mod-2",
      order: 2,
      title: "Module 2 — Authentication & Authorization: OAuth2, OpenID Connect & RBAC",
      durationMinutes: 160,
      summary: "OAuth 2.0 grant types (Authorization Code with PKCE, Client Credentials), OIDC ID tokens vs Access tokens, JWT signature verification, and hierarchical RBAC / ABAC policies.",
      learningObjectives: [
        "Select and configure appropriate OAuth 2.0 flows (PKCE for SPAs, Client Credentials for machine-to-machine).",
        "Verify asymmetric RS256/ES256 JWT signatures using JWKS endpoints.",
        "Implement fine-grained Role-Based and Attribute-Based Access Control (RBAC/ABAC) middleware."
      ],
      resources: [
        {
          title: "OAuth 2.0 Authorization Framework (RFC 6749) & PKCE (RFC 7636)",
          url: "https://oauth.net/2/",
          description: "Official OAuth 2.0 core concepts, grant types, and PKCE security for public clients.",
          type: "specification",
          provider: "OAuth.net / IETF"
        },
        {
          title: "Auth0: JSON Web Key Sets (JWKS) and JWT Verification Guide",
          url: "https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets",
          description: "Validating JWT signatures against remote JWKS endpoints with public key rotation.",
          type: "guide",
          provider: "Auth0 by Okta"
        }
      ],
      content: {
        overview: "Securing backend microservices requires separating authentication (who you are via OIDC) from authorization (what you are allowed to do via OAuth2 access tokens and RBAC policies). Asymmetric JWT verification guarantees integrity without contacting identity servers on every request.",
        keyConcepts: [
          {
            section: "Section 1 — OAuth2 & RBAC Middleware",
            topic: "JWT Verification & Authorization",
            title: "Lesson 1 — Asymmetric JWT Verification & Hierarchical RBAC Middleware",
            prerequisites: "Module 1 (REST APIs) and cryptography basics.",
            description: "How to extract Bearer tokens from incoming HTTP headers, verify RS256 signatures against remote JWKS endpoints, and enforce hierarchical role permissions.",
            whyItMatters: "Using symmetric secrets (HS256) shared across all microservices risks total compromise if one service leaks the key. Asymmetric keys (RS256) let microservices verify tokens with public keys only.",
            howItWorks: "Identity Provider (IdP) signs JWTs with its private key. Microservice fetches public keys from `/.well-known/jwks.json`, caches them, verifies token signatures, and inspects `scope` and `roles` claims.",
            stepByStep: [
              "Step 1: Extract `Authorization: Bearer <token>` header.",
              "Step 2: Parse JWT unverified header to locate key ID (`kid`).",
              "Step 3: Retrieve matching public key from cached JWKS set.",
              "Step 4: Verify cryptographic signature, expiry (`exp`), and issuer (`iss`).",
              "Step 5: Enforce required role permissions in middleware."
            ],
            workedExample: "RBAC Guard Pattern:\n```typescript\nexport function requirePermission(permission: string) {\n  return (req: Request, res: Response, next: NextFunction) => {\n    if (!req.user?.permissions.includes(permission)) {\n      return res.status(403).json({ error: 'Forbidden' });\n    }\n    next();\n  };\n}\n```",
            realWorldUsage: "API gateway authentication, enterprise SaaS authorization, and microservice mesh security.",
            codeSnippet: "// Asymmetric JWT Claims & Role-Based Access Guard (TypeScript)\nexport interface JwtPayload {\n  sub: string;       // User ID\n  iss: string;       // Issuer\n  aud: string;       // Audience\n  exp: number;       // Expiration timestamp\n  roles: string[];   // Assigned RBAC roles\n  orgId: string;     // Multi-tenant organization ID\n}\n\nexport class AuthorizationGuard {\n  public static checkAccess(\n    tokenClaims: JwtPayload,\n    requiredRole: string,\n    targetOrgId?: string\n  ): boolean {\n    const now = Math.floor(Date.now() / 1000);\n    if (tokenClaims.exp < now) {\n      throw new Error('Token expired');\n    }\n\n    if (targetOrgId && tokenClaims.orgId !== targetOrgId && !tokenClaims.roles.includes('SUPER_ADMIN')) {\n      return false; // Multi-tenant isolation violation\n    }\n\n    return tokenClaims.roles.includes(requiredRole) || tokenClaims.roles.includes('SUPER_ADMIN');\n  }\n}\n\n// Usage demonstration\nconst claims: JwtPayload = {\n  sub: 'USR-101',\n  iss: 'https://auth.capacityconnect.com',\n  aud: 'api.capacityconnect.com',\n  exp: Math.floor(Date.now() / 1000) + 3600,\n  roles: ['MANAGER', 'EMPLOYEE'],\n  orgId: 'ORG_ACME'\n};\n\nconst isAuthorized = AuthorizationGuard.checkAccess(claims, 'MANAGER', 'ORG_ACME');\nconsole.log(`Access Granted: ${isAuthorized}`);",
            codeExplanation: "1. Validates token expiration timestamp defensively.\n2. Enforces multi-tenant organizational boundary isolation.\n3. Evaluates hierarchical role permissions before allowing downstream execution.",
            expectedOutput: "Access Granted: true",
            commonMistakes: "Trusting claims in the JWT payload without cryptographically verifying the signature against the JWKS public key.",
            bestPractices: "Set short access token lifetimes (15-60 minutes) and use secure HTTP-only refresh tokens with rotation.",
            practiceTask: "Implement an Express/Fastify middleware that verifies RS256 JWT tokens and attaches authenticated user context to request objects.",
            keyTakeaway: "Asymmetric OAuth2 tokens enable decentralized, high-speed authorization across distributed microservices."
          }
        ],
        practicalExercise: "Build an enterprise multi-tenant authorization middleware that verifies RS256 JWT tokens, validates organizational tenancy, and enforces role hierarchies.",
        competencyVerification: "Demonstrates OAuth2 architecture, JWT signature validation, and multi-tenant RBAC enforcement at Level 4.",
        resources: [
          {
            title: "OAuth 2.0 Authorization Framework (RFC 6749) & PKCE (RFC 7636)",
            url: "https://oauth.net/2/",
            description: "Official OAuth 2.0 core concepts, grant types, and PKCE security for public clients.",
            type: "specification",
            provider: "OAuth.net / IETF"
          },
          {
            title: "Auth0: JSON Web Key Sets (JWKS) and JWT Verification Guide",
            url: "https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets",
            description: "Validating JWT signatures against remote JWKS endpoints with public key rotation.",
            type: "guide",
            provider: "Auth0 by Okta"
          }
        ]
      }
    },
    {
      id: "api-mod-3",
      order: 3,
      title: "Module 3 — API Rate Limiting, Throttling & DDoS Mitigation (Token Bucket, Leaky Bucket, Redis)",
      durationMinutes: 160,
      summary: "Rate limiting algorithms (Token Bucket, Leaky Bucket, Sliding Window Counter), distributed rate limiting with Redis Lua scripts, HTTP 429 Retry-After headers, and DDoS defense.",
      learningObjectives: [
        "Compare Token Bucket, Leaky Bucket, and Sliding Window Counter algorithms.",
        "Implement atomic distributed rate limiting using Redis and Lua scripting.",
        "Emit standard rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)."
      ],
      resources: [
        {
          title: "IETF Draft: RateLimit Header Fields for HTTP",
          url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers-07",
          description: "Standard HTTP headers for communicating rate limits, remaining quota, and reset windows.",
          type: "specification",
          provider: "IETF HTTPAPI Working Group"
        },
        {
          title: "Redis Documentation: Programmability with Lua Scripts",
          url: "https://redis.io/docs/latest/develop/interact/programmability/eval-intro/",
          description: "Atomic command execution in Redis using EVAL and Lua scripts to prevent race conditions.",
          type: "documentation",
          provider: "Redis Ltd."
        }
      ],
      content: {
        overview: "Rate limiting protects backend APIs from noisy neighbors, resource exhaustion, and brute-force DDoS attacks. Using distributed Redis sliding-window counters ensures consistent limit enforcement across horizontally scaled API gateway instances.",
        keyConcepts: [
          {
            section: "Section 1 — Distributed Rate Limiting",
            topic: "Redis Sliding Window Limiter",
            title: "Lesson 1 — Atomic Sliding Window Counter with Redis & Lua Scripting",
            prerequisites: "Module 1 (REST APIs) and Redis fundamentals.",
            description: "How the sliding window counter algorithm prevents burst attacks at window boundaries and how to execute it atomically in Redis using Lua scripts.",
            whyItMatters: "Fixed window counters allow double the allowed request rate at window transition boundaries (e.g., 100 requests at 11:59:59 and 100 at 12:00:00). Sliding window smooths traffic completely.",
            howItWorks: "Redis sorted sets (ZSET) store timestamped request entries. A Lua script prunes expired entries (`ZREMRANGEBYSCORE`), counts active requests (`ZCARD`), and conditionally appends new requests (`ZADD`) atomically.",
            stepByStep: [
              "Step 1: Compute current epoch timestamp in milliseconds.",
              "Step 2: Remove elements older than `now - windowMs`.",
              "Step 3: Check count: if `< maxRequests`, add `now` to ZSET and allow request.",
              "Step 4: If exceeded, return `429 Too Many Requests` with `Retry-After` header."
            ],
            workedExample: "Redis Lua Sliding Window Script:\n```lua\nlocal key = KEYS[1]\nlocal now = tonumber(ARGV[1])\nlocal window = tonumber(ARGV[2])\nlocal limit = tonumber(ARGV[3])\nlocal clearBefore = now - window\nredis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)\nlocal current = redis.call('ZCARD', key)\nif current < limit then\n  redis.call('ZADD', key, now, now)\n  redis.call('EXPIRE', key, math.ceil(window / 1000))\n  return 1\nelse\n  return 0\nend\n```",
            realWorldUsage: "Public API gateways (Stripe, GitHub, Cloudflare).",
            codeSnippet: "// Sliding Window In-Memory / Distributed Limiter Algorithm (TypeScript)\nexport class SlidingWindowRateLimiter {\n  private requestTimestamps = new Map<string, number[]>();\n\n  public isAllowed(clientId: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetMs: number } {\n    const now = Date.now();\n    const windowStart = now - windowMs;\n\n    const timestamps = this.requestTimestamps.get(clientId) || [];\n    // Filter out expired timestamps outside current window\n    const validTimestamps = timestamps.filter(t => t > windowStart);\n\n    if (validTimestamps.length < limit) {\n      validTimestamps.push(now);\n      this.requestTimestamps.set(clientId, validTimestamps);\n      return {\n        allowed: true,\n        remaining: limit - validTimestamps.length,\n        resetMs: windowMs\n      };\n    }\n\n    const oldestTimestamp = validTimestamps[0];\n    const retryAfterMs = oldestTimestamp + windowMs - now;\n\n    return {\n      allowed: false,\n      remaining: 0,\n      resetMs: Math.max(0, retryAfterMs)\n    };\n  }\n}\n\nconst limiter = new SlidingWindowRateLimiter();\nconsole.log(limiter.isAllowed('API_KEY_882', 5, 60000));",
            codeExplanation: "1. Implements sliding window counter algorithm.\n2. Prunes timestamps older than `windowMs`.\n3. Calculates exact `resetMs` for HTTP `Retry-After` header.",
            expectedOutput: "{ allowed: true, remaining: 4, resetMs: 60000 }",
            commonMistakes: "Executing multi-step rate limiting in application code with separate Redis GET and SET commands, causing race conditions under concurrent traffic.",
            bestPractices: "Always execute multi-command rate limiting logic inside atomic Redis Lua scripts.",
            practiceTask: "Implement a tiered rate limiting middleware where authenticated users get 1,000 req/min and anonymous users get 60 req/min.",
            keyTakeaway: "Sliding window rate limiting with atomic Lua scripts eliminates boundary burst vulnerabilities and guarantees fair API capacity allocation."
          }
        ],
        practicalExercise: "Build an atomic distributed rate limiting middleware in Node.js/TypeScript using Redis and Lua scripting that enforces sliding-window quotas with standardized HTTP 429 headers.",
        competencyVerification: "Demonstrates distributed rate limiting algorithms, Redis Lua scripting, and API throttling architecture at Level 4.",
        resources: [
          {
            title: "IETF Draft: RateLimit Header Fields for HTTP",
            url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers-07",
            description: "Standard HTTP headers for communicating rate limits, remaining quota, and reset windows.",
            type: "specification",
            provider: "IETF HTTPAPI Working Group"
          },
          {
            title: "Redis Documentation: Programmability with Lua Scripts",
            url: "https://redis.io/docs/latest/develop/interact/programmability/eval-intro/",
            description: "Atomic command execution in Redis using EVAL and Lua scripts to prevent race conditions.",
            type: "documentation",
            provider: "Redis Ltd."
          }
        ]
      }
    },
    {
      id: "api-mod-4",
      order: 4,
      title: "Module 4 — Idempotency, Request De-duplication & Distributed Transactions (Saga Pattern)",
      durationMinutes: 160,
      summary: "Idempotency keys (Idempotency-Key header), deduplication caches, distributed transactions across microservices, and Choreography vs Orchestration Sagas.",
      learningObjectives: [
        "Implement end-to-end idempotent API endpoints using Idempotency-Key headers and Redis locks.",
        "Architect distributed transactions using the Saga pattern with compensating transactions.",
        "Compare Orchestrated Sagas (Temporal/Camunda) with Choreographed Sagas (Kafka)."
      ],
      resources: [
        {
          title: "IETF Draft: The Idempotency-Key HTTP Header Field",
          url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-04",
          description: "Standard HTTP header for safely retrying mutating requests without duplicate side effects.",
          type: "specification",
          provider: "IETF HTTPAPI Working Group"
        },
        {
          title: "Microservices.io: Pattern: Saga (Distributed Transactions)",
          url: "https://microservices.io/patterns/data/saga.html",
          description: "Chris Richardson's definitive guide on Choreography and Orchestration Sagas with compensating actions.",
          type: "guide",
          provider: "Chris Richardson"
        }
      ],
      content: {
        overview: "In distributed cloud environments, network retries can result in duplicate payments or double bookings. Implementing idempotency keys guarantees that retried requests produce identical results, while Saga patterns manage distributed transactions across microservices.",
        keyConcepts: [
          {
            section: "Section 1 — Idempotency & Sagas",
            topic: "Idempotency Keys & Sagas",
            title: "Lesson 1 — Idempotent API Execution & Compensating Saga Transactions",
            prerequisites: "Modules 1 and 3 (REST APIs & Redis).",
            description: "How to use `Idempotency-Key` headers to cache mutating request outputs, acquire distributed locks during processing, and coordinate multi-service rollbacks with compensating actions.",
            whyItMatters: "If an API client times out on a payment POST request, retrying without idempotency keys charges the customer twice.",
            howItWorks: "1. Server checks if `Idempotency-Key` exists. 2. If cached, immediately return saved response. 3. If in-flight, reject concurrent duplicate (`409 Conflict`). 4. Otherwise, execute transaction, save result in Redis with 24h TTL, and return response.",
            stepByStep: [
              "Step 1: Require `Idempotency-Key: <UUID>` header on non-idempotent POST routes.",
              "Step 2: Acquire distributed lock in Redis (`SET key 'IN_PROGRESS' NX EX 30`).",
              "Step 3: Execute core business logic and database transaction.",
              "Step 4: Store serialized HTTP response payload in Redis (`SET key payload EX 86400`).",
              "Step 5: Release lock and return response."
            ],
            workedExample: "Idempotent Payment Request Flow:\nFirst POST: Executes card charge -> Returns 201 Created -> Caches response in Redis.\nClient Network Timeout -> Client retries identical POST.\nSecond POST: Finds cached response in Redis -> Returns exact 201 response instantly without re-charging card.",
            realWorldUsage: "Stripe Charges API, PayPal Order Checkout, AWS EC2 RunInstances.",
            codeSnippet: "// Idempotency Key Middleware Architecture (TypeScript)\nexport interface CachedApiResponse {\n  statusCode: number;\n  body: Record<string, unknown>;\n  cachedAt: number;\n}\n\nexport class IdempotencyManager {\n  private store = new Map<string, CachedApiResponse | 'IN_PROGRESS'>();\n\n  public async executeIdempotent<T extends Record<string, unknown>>(\n    idempotencyKey: string,\n    operation: () => Promise<{ statusCode: number; body: T }>\n  ): Promise<{ statusCode: number; body: T; fromCache: boolean }> {\n    const existing = this.store.get(idempotencyKey);\n    \n    if (existing === 'IN_PROGRESS') {\n      throw new Error('Concurrent request in progress for this idempotency key');\n    }\n    \n    if (existing && typeof existing === 'object') {\n      return { statusCode: existing.statusCode, body: existing.body as T, fromCache: true };\n    }\n\n    // Lock key\n    this.store.set(idempotencyKey, 'IN_PROGRESS');\n    try {\n      const result = await operation();\n      this.store.set(idempotencyKey, {\n        statusCode: result.statusCode,\n        body: result.body,\n        cachedAt: Date.now()\n      });\n      return { ...result, fromCache: false };\n    } catch (err) {\n      this.store.delete(idempotencyKey); // Release lock on error\n      throw err;\n    }\n  }\n}\n\n// Usage demo\nconst manager = new IdempotencyManager();\nmanager.executeIdempotent('KEY_TX_9901', async () => ({\n  statusCode: 201,\n  body: { transactionId: 'TX-1', amount: 500 }\n})).then(res => console.log(res));",
            codeExplanation: "1. Prevents duplicate execution by acquiring an in-progress lock.\n2. Caches final HTTP status and payload for instantaneous replay on network retry.\n3. Cleans up lock on failure to allow safe subsequent retry.",
            expectedOutput: "{ statusCode: 201, body: { transactionId: 'TX-1', amount: 500 }, fromCache: false }",
            commonMistakes: "Caching idempotency keys before the transaction commits, returning successful cached responses even if database transactions roll back.",
            bestPractices: "Set a 24-hour TTL on idempotency records and tie idempotency keys to authenticated user IDs to prevent key hijacking.",
            practiceTask: "Implement an orchestrated Saga with 3 steps (Reserve Inventory, Charge Card, Ship Item) with automated compensating rollbacks.",
            keyTakeaway: "Idempotency keys ensure safe network retries, while Saga patterns maintain eventual consistency across distributed microservices."
          }
        ],
        practicalExercise: "Build an idempotent financial ledger transaction endpoint with distributed locking, response caching, and a 3-step compensating Saga for order fulfillment.",
        competencyVerification: "Demonstrates idempotency key design, distributed locking, and Saga transaction orchestration at Level 4.",
        resources: [
          {
            title: "IETF Draft: The Idempotency-Key HTTP Header Field",
            url: "https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header-04",
            description: "Standard HTTP header for safely retrying mutating requests without duplicate side effects.",
            type: "specification",
            provider: "IETF HTTPAPI Working Group"
          },
          {
            title: "Microservices.io: Pattern: Saga (Distributed Transactions)",
            url: "https://microservices.io/patterns/data/saga.html",
            description: "Chris Richardson's definitive guide on Choreography and Orchestration Sagas with compensating actions.",
            type: "guide",
            provider: "Chris Richardson"
          }
        ]
      }
    },
    {
      id: "api-mod-5",
      order: 5,
      title: "Module 5 — gRPC & Protocol Buffers for High-Throughput Microservice IPC",
      durationMinutes: 160,
      summary: "Protocol Buffers (proto3) schema design, HTTP/2 multiplexing, unary vs streaming RPCs (server, client, bi-directional), and gRPC interceptors for metadata propagation.",
      learningObjectives: [
        "Author backward-compatible Protocol Buffers (proto3) service contracts.",
        "Implement high-throughput unary and streaming gRPC microservices.",
        "Configure gRPC interceptors for distributed tracing and authentication propagation."
      ],
      resources: [
        {
          title: "gRPC Official Documentation: Core Concepts and Architecture",
          url: "https://grpc.io/docs/what-is-grpc/core-concepts/",
          description: "HTTP/2 transport, Protocol Buffers compilation, unary and streaming RPC lifecycles.",
          type: "documentation",
          provider: "gRPC Authors / CNCF"
        },
        {
          title: "Google Protocol Buffers Language Guide (proto3)",
          url: "https://protobuf.dev/programming-guides/proto3/",
          description: "Field rules, reserved tags, scalar types, enum versioning, and binary serialization.",
          type: "documentation",
          provider: "Google"
        }
      ],
      content: {
        overview: "gRPC uses binary Protocol Buffers and HTTP/2 multiplexing to deliver 7-10x higher throughput and 50% lower serialization latency compared to JSON over HTTP/1.1, making it the industry standard for internal microservice communication.",
        keyConcepts: [
          {
            section: "Section 1 — gRPC & Protocol Buffers",
            topic: "Proto3 & HTTP/2 Streaming",
            title: "Lesson 1 — Proto3 Contract Design, Binary Serialization & Bi-directional Streaming",
            prerequisites: "Module 1 (REST APIs) and binary data structures.",
            description: "How Protocol Buffers serialize typed binary wire payloads using field tags, how HTTP/2 multiplexes multiple RPC streams over a single TCP connection, and how to implement gRPC interceptors.",
            whyItMatters: "JSON text parsing consumes heavy CPU cycles in high-throughput internal microservice meshes. Protobuf binary parsing is virtually instantaneous.",
            howItWorks: "Protobuf compiler (`protoc`) generates strongly-typed client stubs and server interfaces. Binary messages pack field numbers and varint wire types without redundant field names.",
            stepByStep: [
              "Step 1: Define service and message schemas in `.proto` file with explicit field numbers.",
              "Step 2: Never change existing field numbers to ensure backward compatibility.",
              "Step 3: Compile proto schemas to target languages (TypeScript, Go, Java).",
              "Step 4: Implement gRPC service handlers on HTTP/2 server."
            ],
            workedExample: "Proto3 Service Definition:\n```protobuf\nsyntax = \"proto3\";\npackage enterprise.capacity;\n\nmessage EvaluateSkillRequest {\n  string employee_id = 1;\n  string competency_code = 2;\n  int32 target_proficiency = 3;\n}\n\nmessage EvaluationResponse {\n  bool is_qualified = 1;\n  int32 score = 2;\n  string rationale = 3;\n}\n\nservice CompetencyEvaluator {\n  rpc EvaluateSkill (EvaluateSkillRequest) returns (EvaluationResponse);\n}\n```",
            realWorldUsage: "Internal service-to-service communication at Netflix, Uber, Google, and Kubernetes.",
            codeSnippet: "// gRPC Client Stub Invocation Pattern (TypeScript)\nexport interface SkillEvaluationRequest {\n  employeeId: string;\n  competencyCode: string;\n  targetProficiency: number;\n}\n\nexport interface SkillEvaluationResponse {\n  isQualified: boolean;\n  score: number;\n  rationale: string;\n}\n\nexport class CompetencyEvaluationGrpcClient {\n  async evaluateSkill(req: SkillEvaluationRequest): Promise<SkillEvaluationResponse> {\n    // In real gRPC: client.evaluateSkill(req, metadata, callback);\n    const isQualified = req.targetProficiency <= 4;\n    return {\n      isQualified,\n      score: isQualified ? 88 : 62,\n      rationale: isQualified ? 'Meets competency baseline' : 'Additional upskilling required'\n    };\n  }\n}\n\nconst client = new CompetencyEvaluationGrpcClient();\nclient.evaluateSkill({ employeeId: 'EMP_101', competencyCode: 'COMP_API_01', targetProficiency: 4 })\n  .then(res => console.log(res));",
            codeExplanation: "1. Encapsulates strongly-typed RPC interface generated from Protobuf.\n2. Serializes data into compact binary format over HTTP/2.\n3. Eliminates JSON parsing overhead across internal microservices.",
            expectedOutput: "{ isQualified: true, score: 88, rationale: 'Meets competency baseline' }",
            commonMistakes: "Reordering or reusing deleted field numbers in `.proto` files, corrupting binary deserialization across older running client versions.",
            bestPractices: "Use `reserved` tags when deprecating fields in `.proto` files to prevent future developers from reusing the same tag numbers.",
            practiceTask: "Author a Protocol Buffer schema supporting bi-directional telemetry streaming and compile it into TypeScript interfaces.",
            keyTakeaway: "gRPC and Protobuf provide high-performance binary serialization and contract-driven IPC for enterprise microservice networks."
          }
        ],
        practicalExercise: "Design a proto3 service definition for an employee skill evaluation service, compile it to TypeScript stubs, and implement both unary and streaming gRPC service handlers.",
        competencyVerification: "Demonstrates Protocol Buffers schema design, gRPC service implementation, and HTTP/2 multiplexed IPC at Level 4.",
        resources: [
          {
            title: "gRPC Official Documentation: Core Concepts and Architecture",
            url: "https://grpc.io/docs/what-is-grpc/core-concepts/",
            description: "HTTP/2 transport, Protocol Buffers compilation, unary and streaming RPC lifecycles.",
            type: "documentation",
            provider: "gRPC Authors / CNCF"
          },
          {
            title: "Google Protocol Buffers Language Guide (proto3)",
            url: "https://protobuf.dev/programming-guides/proto3/",
            description: "Field rules, reserved tags, scalar types, enum versioning, and binary serialization.",
            type: "documentation",
            provider: "Google"
          }
        ]
      }
    },
    {
      id: "api-mod-6",
      order: 6,
      title: "Module 6 — Event-Driven Architecture with Apache Kafka & Message Queues",
      durationMinutes: 160,
      summary: "Kafka topics, partitions, consumer groups, offset management, delivery semantics (at-least-once, exactly-once), schema registry (Avro), and dead letter queues (DLQ).",
      learningObjectives: [
        "Design scalable Kafka topic partitioning strategies and consumer groups.",
        "Implement resilient consumer offset management with Dead Letter Queues (DLQ).",
        "Enforce Schema Registry compatibility rules (Avro/Protobuf) for evolving event streams."
      ],
      resources: [
        {
          title: "Apache Kafka Documentation: Core Concepts and Architecture",
          url: "https://kafka.apache.org/documentation/#intro_concepts_and_architecture",
          description: "Topics, partitions, distributed commit logs, consumer groups, and replication.",
          type: "documentation",
          provider: "Apache Software Foundation"
        },
        {
          title: "Confluent: Schema Registry and Event-Driven Microservices Guide",
          url: "https://docs.confluent.io/platform/current/schema-registry/index.html",
          description: "Avro schemas, backward/forward compatibility, and topic governance.",
          type: "guide",
          provider: "Confluent"
        }
      ],
      content: {
        overview: "Event-driven architecture decouples microservices asynchronously using immutable distributed append-only logs. Apache Kafka provides high-throughput event streaming, replayability, and horizontal consumer scaling.",
        keyConcepts: [
          {
            section: "Section 1 — Kafka Partitioning & Consumer Groups",
            topic: "Kafka Event Streaming",
            title: "Lesson 1 — Partition Keys, Consumer Groups & Dead Letter Queues (DLQ)",
            prerequisites: "Module 1 (REST APIs) and asynchronous messaging concepts.",
            description: "How partition keys ensure total ordering for specific entity streams, how consumer groups scale parallel processing, and how to route poison pill events to a Dead Letter Queue (DLQ).",
            whyItMatters: "Uncaught serialization errors in event consumers block the entire partition log. DLQs isolate failing events so processing continues uninterrupted.",
            howItWorks: "Producers hash partition keys (e.g., `employeeId`) to assign events to specific partitions. Consumers in a group read from assigned partitions, committing offsets after processing.",
            stepByStep: [
              "Step 1: Choose meaningful partition key (e.g., `organizationId` or `userId`) to guarantee ordering.",
              "Step 2: Produce event with structured schema envelope (event name, timestamp, payload).",
              "Step 3: Consume in consumer group with manual offset commits (`enable.auto.commit=false`).",
              "Step 4: If processing fails after 3 retries, publish to `.DLQ` topic and commit offset."
            ],
            workedExample: "Kafka Event Envelope:\n```json\n{\n  \"eventId\": \"EVT_88291\",\n  \"eventType\": \"EMPLOYEE_ASSESSMENT_COMPLETED\",\n  \"occurredAt\": \"2026-09-14T10:00:00Z\",\n  \"partitionKey\": \"ORG_ACME\",\n  \"payload\": { \"employeeId\": \"USR-101\", \"competencyCode\": \"COMP_API_01\", \"score\": 94 }\n}\n```",
            realWorldUsage: "Activity feeds, real-time analytics pipelines, order fulfillment workflows.",
            codeSnippet: "// Resilient Kafka Consumer Dispatcher with Dead Letter Queue (TypeScript)\nexport interface CloudEvent<T> {\n  id: string;\n  topic: string;\n  key: string;\n  payload: T;\n}\n\nexport class ResilientEventProcessor {\n  async processWithDlq<T>(\n    event: CloudEvent<T>,\n    handler: (payload: T) => Promise<void>,\n    dlqProducer: (event: CloudEvent<T>, error: Error) => Promise<void>\n  ): Promise<void> {\n    try {\n      await handler(event.payload);\n      console.log(`[Kafka] Successfully processed event ${event.id} from topic ${event.topic}`);\n    } catch (err) {\n      const error = err instanceof Error ? err : new Error(String(err));\n      console.error(`[Kafka Error] Processing failed for ${event.id}. Routing to DLQ...`);\n      await dlqProducer(event, error);\n    }\n  }\n}",
            codeExplanation: "1. Processes event payloads with structured error containment.\n2. Automatically captures unhandled exceptions.\n3. Routes unprocessable poison pills to DLQ topic without blocking partition log.",
            expectedOutput: "[Kafka] Successfully processed event EVT_88291 from topic employee-assessments",
            commonMistakes: "Using a random partition key when order matters, causing concurrent consumers to process out-of-order state transitions.",
            bestPractices: "Always use entity IDs (e.g., `userId`) as partition keys when sequential ordering is required.",
            practiceTask: "Implement a Kafka producer that publishes transactional events using the Outbox Pattern.",
            keyTakeaway: "Kafka enables loosely coupled, event-driven microservices with strict ordering guarantees and horizontal consumer scaling."
          }
        ],
        practicalExercise: "Build an event-driven skill assessment ingestion pipeline using Apache Kafka with partition key hashing, manual offset management, and an automated Dead Letter Queue (DLQ).",
        competencyVerification: "Demonstrates event-driven architecture, Kafka partitioning strategies, and consumer error containment at Level 4.",
        resources: [
          {
            title: "Apache Kafka Documentation: Core Concepts and Architecture",
            url: "https://kafka.apache.org/documentation/#intro_concepts_and_architecture",
            description: "Topics, partitions, distributed commit logs, consumer groups, and replication.",
            type: "documentation",
            provider: "Apache Software Foundation"
          },
          {
            title: "Confluent: Schema Registry and Event-Driven Microservices Guide",
            url: "https://docs.confluent.io/platform/current/schema-registry/index.html",
            description: "Avro schemas, backward/forward compatibility, and topic governance.",
            type: "guide",
            provider: "Confluent"
          }
        ]
      }
    },
    {
      id: "api-mod-7",
      order: 7,
      title: "Module 7 — API Gateway Architecture, Routing & Reverse Proxies (Kong, Envoy)",
      durationMinutes: 160,
      summary: "API Gateway pattern, Envoy Proxy architecture, Kong plugin ecosystem, path-based routing, SSL termination, request transformations, and edge authentication.",
      learningObjectives: [
        "Architect unified API gateway topologies using Envoy Proxy and Kong.",
        "Configure dynamic path and header-based routing rules.",
        "Offload cross-cutting concerns (SSL termination, rate limiting, authentication) to the gateway layer."
      ],
      resources: [
        {
          title: "Envoy Proxy Architecture & Configuration Documentation",
          url: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/arch_overview",
          description: "Listeners, clusters, routes, filters, and service mesh data plane architecture.",
          type: "documentation",
          provider: "Envoy Project / CNCF"
        },
        {
          title: "Kong Gateway Official Documentation",
          url: "https://docs.konghq.com/gateway/latest/",
          description: "Plugins, services, routes, consumers, and declarative gateway configuration.",
          type: "documentation",
          provider: "Kong Inc."
        }
      ],
      content: {
        overview: "An API Gateway acts as the single entry point for external clients, orchestrating routing to internal microservices, enforcing security policies, and terminating SSL connections at the network edge.",
        keyConcepts: [
          {
            section: "Section 1 — API Gateway Topology",
            topic: "Gateway Routing & Edge Filters",
            title: "Lesson 1 — Gateway Routing, SSL Termination & Filter Pipelines with Envoy / Kong",
            prerequisites: "Modules 1 through 3 (REST, OAuth2, Rate Limiting).",
            description: "How API gateways route external requests based on URI prefixes (`/api/v1/auth` -> Auth Service, `/api/v1/courses` -> Course Service) and execute pre/post filters.",
            whyItMatters: "Implementing authentication, CORS, and rate limiting in every individual microservice causes duplicated code and security inconsistencies. Gateways centralize policy enforcement.",
            howItWorks: "The Gateway listener accepts external TLS traffic, terminates SSL, applies rate limit and auth plugins, and proxies clean HTTP/2 or gRPC traffic to backend upstream clusters.",
            stepByStep: [
              "Step 1: Define Gateway Routes mapping URI patterns to Upstream Services.",
              "Step 2: Attach global authentication filter to validate JWTs at the edge.",
              "Step 3: Strip internal headers (`X-Internal-*`) before forwarding downstream.",
              "Step 4: Inject verified user context headers (`X-User-Id`, `X-User-Roles`) to upstream pods."
            ],
            workedExample: "Declarative Gateway Route Configuration:\n```yaml\nroutes:\n  - name: competency-route\n    paths: [\"/api/v1/competencies\"]\n    service: competency-service-upstream\n    plugins:\n      - name: jwt-auth\n      - name: rate-limiting\n        config: { minute: 500 }\n```",
            realWorldUsage: "Enterprise cloud platforms managing hundreds of microservices behind a unified domain.",
            codeSnippet: "// Programmatic Gateway Router & Filter Pipeline Concept (TypeScript)\nexport interface GatewayRoute {\n  pathPrefix: string;\n  targetCluster: string;\n  requiresAuth: boolean;\n}\n\nexport class ApiGatewayRouter {\n  private routes: GatewayRoute[] = [\n    { pathPrefix: '/api/v1/auth', targetCluster: 'http://auth-service:8080', requiresAuth: false },\n    { pathPrefix: '/api/v1/competencies', targetCluster: 'http://competency-service:8081', requiresAuth: true },\n    { pathPrefix: '/api/v1/learning', targetCluster: 'http://learning-service:8082', requiresAuth: true }\n  ];\n\n  public routeRequest(path: string, hasValidAuth: boolean): { status: number; targetUrl?: string; error?: string } {\n    const matchedRoute = this.routes.find(r => path.startsWith(r.pathPrefix));\n    if (!matchedRoute) {\n      return { status: 404, error: 'Route not found' };\n    }\n    if (matchedRoute.requiresAuth && !hasValidAuth) {\n      return { status: 401, error: 'Unauthorized at gateway edge' };\n    }\n    return {\n      status: 200,\n      targetUrl: `${matchedRoute.targetCluster}${path}`\n    };\n  }\n}\n\nconst gateway = new ApiGatewayRouter();\nconsole.log(gateway.routeRequest('/api/v1/competencies/list', true));",
            codeExplanation: "1. Evaluates incoming URI path prefixes against configured routes.\n2. Enforces edge authentication before proxying to internal clusters.\n3. Prevents unauthorized traffic from entering internal microservice network.",
            expectedOutput: "{ status: 200, targetUrl: 'http://competency-service:8081/api/v1/competencies/list' }",
            commonMistakes: "Allowing external clients to pass spoofed `X-User-Id` headers directly through the gateway to internal services.",
            bestPractices: "Always sanitize and overwrite identity headers (`X-User-Id`) at the gateway layer based on verified JWT claims.",
            practiceTask: "Configure an Envoy Proxy YAML specification routing traffic between two backend services with JWT validation filter.",
            keyTakeaway: "API Gateways centralize edge security, SSL termination, and routing, shielding internal microservices from public network threats."
          }
        ],
        practicalExercise: "Design a declarative API Gateway configuration using Envoy/Kong routing rules, edge JWT validation, and upstream header injection.",
        competencyVerification: "Demonstrates API gateway design, reverse proxy routing, and edge filter pipeline engineering at Level 4.",
        resources: [
          {
            title: "Envoy Proxy Architecture & Configuration Documentation",
            url: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/arch_overview",
            description: "Listeners, clusters, routes, filters, and service mesh data plane architecture.",
            type: "documentation",
            provider: "Envoy Project / CNCF"
          },
          {
            title: "Kong Gateway Official Documentation",
            url: "https://docs.konghq.com/gateway/latest/",
            description: "Plugins, services, routes, consumers, and declarative gateway configuration.",
            type: "documentation",
            provider: "Kong Inc."
          }
        ]
      }
    },
    {
      id: "api-mod-8",
      order: 8,
      title: "Module 8 — Distributed Caching with Redis & Cache Invalidation Strategies",
      durationMinutes: 160,
      summary: "Cache-Aside, Read-Through, Write-Through, and Write-Behind patterns, Cache Stampede prevention (Probabilistic Early Expiration / XFetch), and Redis Cluster topology.",
      learningObjectives: [
        "Select and implement caching patterns (Cache-Aside vs Write-Through) based on access patterns.",
        "Prevent Cache Stampedes (Thundering Herd) using Probabilistic Early Expiration (XFetch algorithm).",
        "Implement reliable cache invalidation strategies using event-driven pub/sub."
      ],
      resources: [
        {
          title: "Redis Documentation: Caching Architecture & Best Practices",
          url: "https://redis.io/solutions/caching/",
          description: "Cache patterns, TTL expiration, eviction policies (LRU/LFU), and clustering.",
          type: "documentation",
          provider: "Redis Ltd."
        },
        {
          title: "ACM: Optimal Probabilistic Cache Invalidation (XFetch Algorithm)",
          url: "https://vldb.org/pvldb/vol8/p886-vldb2015-vazirgiannis.pdf",
          description: "Mathematical modeling of the XFetch algorithm for eliminating cache stampedes under high concurrency.",
          type: "specification",
          provider: "VLDB / ACM"
        }
      ],
      content: {
        overview: "Caching is essential for sub-millisecond API read latencies, but poor cache management causes stale data and cache stampedes. Implementing the Cache-Aside pattern with the XFetch probabilistic early expiration algorithm prevents database collapse.",
        keyConcepts: [
          {
            section: "Section 1 — Caching Patterns & Stampede Prevention",
            topic: "Cache-Aside & XFetch Algorithm",
            title: "Lesson 1 — Cache-Aside Architecture & Probabilistic Stampede Prevention (XFetch)",
            prerequisites: "Module 3 (Redis) and database query optimization.",
            description: "How Cache-Aside works, why TTL expirations trigger thundering herd database stampedes, and how the XFetch algorithm recalculates cache entries asynchronously before expiration.",
            whyItMatters: "When a hot cached key expires under 5,000 req/sec traffic, all 5,000 requests hit the database simultaneously, causing an outage.",
            howItWorks: "XFetch calculates: `now - (computeTime * beta * ln(rand())) > expiry`. As expiry approaches, the probability of early background refresh increases to 100%, ensuring the key never expires cold.",
            stepByStep: [
              "Step 1: Check Redis cache for requested key.",
              "Step 2: If hit, evaluate XFetch probabilistic expiration condition.",
              "Step 3: If XFetch triggers, spawn background worker to refresh cache from database while returning current value immediately.",
              "Step 4: If cache miss, fetch from database, store in Redis with TTL, and return."
            ],
            workedExample: "Cache Stampede Scenario:\nHot key `competency:COMP_API_01` expires at 12:00:00.\nWithout XFetch: 1,000 concurrent requests query Postgres simultaneously -> Database CPU hits 100%.\nWith XFetch: At 11:59:58, one request probabilistically recalculates the cache in the background -> Zero cache misses occur.",
            realWorldUsage: "High-traffic read-heavy platforms (Wikipedia, Reddit, Twitter, Capacity Connect).",
            codeSnippet: "// XFetch Probabilistic Cache Stampede Prevention (TypeScript)\nexport interface CachedEntry<T> {\n  value: T;\n  ttlMs: number;\n  deltaMs: number; // Duration taken to compute value\n  createdAt: number;\n}\n\nexport class XFetchCache {\n  private store = new Map<string, CachedEntry<unknown>>();\n\n  public async getOrCompute<T>(\n    key: string,\n    ttlMs: number,\n    computeFn: () => Promise<T>,\n    beta: number = 1.0\n  ): Promise<T> {\n    const entry = this.store.get(key) as CachedEntry<T> | undefined;\n    const now = Date.now();\n\n    // XFetch algorithm evaluation\n    if (entry) {\n      const timeToLiveRemaining = (entry.createdAt + entry.ttlMs) - now;\n      const shouldRecomputeEarly = -(entry.deltaMs * beta * Math.log(Math.random())) > timeToLiveRemaining;\n\n      if (!shouldRecomputeEarly && timeToLiveRemaining > 0) {\n        return entry.value; // Cache hit: return immediately\n      }\n    }\n\n    // Recompute value\n    const start = Date.now();\n    const value = await computeFn();\n    const deltaMs = Date.now() - start;\n\n    this.store.set(key, {\n      value,\n      ttlMs,\n      deltaMs: Math.max(1, deltaMs),\n      createdAt: now\n    });\n\n    return value;\n  }\n}\n\nconst cache = new XFetchCache();\ncache.getOrCompute('catalog_courses', 60000, async () => ['Course 1', 'Course 2'])\n  .then(res => console.log('Cached:', res));",
            codeExplanation: "1. Tracks computation duration `deltaMs` for each cached entity.\n2. Uses probabilistic logarithm calculation to trigger background recomputation before hard expiration.\n3. Completely eliminates thundering herd cache stampedes under high load.",
            expectedOutput: "Cached: ['Course 1', 'Course 2']",
            commonMistakes: "Setting identical fixed TTLs for thousands of database entities, causing all keys to expire at the exact same second (synchronized expiration).",
            bestPractices: "Add randomized jitter (+/- 10%) to cache TTLs and use the XFetch algorithm for hot items.",
            practiceTask: "Implement a Cache-Aside service wrapper with Redis pub/sub for instant cross-node cache invalidation.",
            keyTakeaway: "Cache-Aside paired with the XFetch algorithm provides lightning-fast read performance while protecting database infrastructure from stampedes."
          }
        ],
        practicalExercise: "Build a high-concurrency Redis caching layer implementing the Cache-Aside pattern, TTL jitter, and the XFetch probabilistic early expiration algorithm.",
        competencyVerification: "Demonstrates distributed caching patterns, cache stampede prevention, and Redis cluster optimization at Level 4.",
        resources: [
          {
            title: "Redis Documentation: Caching Architecture & Best Practices",
            url: "https://redis.io/solutions/caching/",
            description: "Cache patterns, TTL expiration, eviction policies (LRU/LFU), and clustering.",
            type: "documentation",
            provider: "Redis Ltd."
          },
          {
            title: "ACM: Optimal Probabilistic Cache Invalidation (XFetch Algorithm)",
            url: "https://vldb.org/pvldb/vol8/p886-vldb2015-vazirgiannis.pdf",
            description: "Mathematical modeling of the XFetch algorithm for eliminating cache stampedes under high concurrency.",
            type: "specification",
            provider: "VLDB / ACM"
          }
        ]
      }
    },
    {
      id: "api-mod-9",
      order: 9,
      title: "Module 9 — Database Sharding, Replication & Connection Pooling (PgBouncer, Read Replicas)",
      durationMinutes: 160,
      summary: "Database connection scaling, PgBouncer transaction-mode pooling, Primary-Replica read/write splitting, consistent hashing for database sharding, and replication lag handling.",
      learningObjectives: [
        "Configure PgBouncer connection pooling to support 10,000+ client connections on limited database instances.",
        "Implement read/write splitting across PostgreSQL primary and streaming read replicas.",
        "Design horizontal database sharding architectures using Consistent Hashing."
      ],
      resources: [
        {
          title: "PgBouncer Official Documentation & Connection Pooling Guide",
          url: "https://www.pgbouncer.org/usage.html",
          description: "Session, transaction, and statement pooling modes for PostgreSQL.",
          type: "documentation",
          provider: "PgBouncer Project"
        },
        {
          title: "PostgreSQL High Availability & Replication Documentation",
          url: "https://www.postgresql.org/docs/current/high-availability.html",
          description: "Streaming replication, hot standbys, failover management, and replication slots.",
          type: "documentation",
          provider: "PostgreSQL Global Development Group"
        }
      ],
      content: {
        overview: "Relational database connections consume significant RAM and OS process overhead. Using PgBouncer transaction-level pooling and read/write replication splitting allows PostgreSQL to serve tens of thousands of concurrent microservice requests.",
        keyConcepts: [
          {
            section: "Section 1 — Connection Pooling & Read Replicas",
            topic: "PgBouncer & Read/Write Splitting",
            title: "Lesson 1 — Transaction-Level Connection Pooling & Read-Replica Routing",
            prerequisites: "Module 1 (REST APIs) and PostgreSQL database fundamentals.",
            description: "How PgBouncer multiplexes thousands of frontend connections over a small pool of database server connections, and how to route SELECT queries to read replicas while sending mutations to the primary.",
            whyItMatters: "PostgreSQL forks a new OS process per connection (~10MB RAM each). At 2,000 connections, context switching and RAM consumption bring the server down.",
            howItWorks: "PgBouncer in `pool_mode = transaction` holds database connections only for the duration of an active transaction. The application database router directs write queries to Primary and reads to Replica.",
            stepByStep: [
              "Step 1: Deploy PgBouncer between microservices and PostgreSQL.",
              "Step 2: Set `pool_mode = transaction` and `default_pool_size = 25`.",
              "Step 3: Implement dynamic datasource router in application code.",
              "Step 4: Handle replication lag: if user just modified data, route subsequent read to Primary for 2 seconds (Read-Your-Own-Writes consistency)."
            ],
            workedExample: "Datasource Routing Logic:\n`const targetDb = isMutation || isWithinLagWindow(userId) ? primaryDb : replicaPool.selectHealthyReplica();`",
            realWorldUsage: "Scaling multi-tenant PostgreSQL databases at Supabase, Heroku, and enterprise SaaS.",
            codeSnippet: "// Read/Write Split Connection Router with Read-Your-Own-Writes Guarantee (TypeScript)\nexport class DatabaseConnectionRouter {\n  private recentWriters = new Map<string, number>(); // Tracks user write timestamps\n\n  public recordWrite(userId: string): void {\n    this.recentWriters.set(userId, Date.now());\n  }\n\n  public selectDataSource(userId: string, isReadOnlyQuery: boolean, lagWindowMs = 2000): 'PRIMARY' | 'REPLICA' {\n    if (!isReadOnlyQuery) {\n      this.recordWrite(userId);\n      return 'PRIMARY';\n    }\n\n    const lastWrite = this.recentWriters.get(userId);\n    if (lastWrite && (Date.now() - lastWrite) < lagWindowMs) {\n      // Route to primary to avoid stale read from replication lag\n      return 'PRIMARY';\n    }\n\n    return 'REPLICA';\n  }\n}\n\nconst router = new DatabaseConnectionRouter();\nrouter.recordWrite('USR-101');\nconsole.log('Immediate Read:', router.selectDataSource('USR-101', true));",
            codeExplanation: "1. Automatically sends all mutations to PostgreSQL Primary.\n2. Routes read queries to Read Replicas to offload database CPU.\n3. Guarantees Read-Your-Own-Writes consistency by routing recent writers to Primary for `lagWindowMs`.",
            expectedOutput: "Immediate Read: PRIMARY",
            commonMistakes: "Reading from a replica immediately after submitting a profile update, displaying old data due to 200ms asynchronous replication lag.",
            bestPractices: "Use transaction-mode pooling with PgBouncer and enforce Read-Your-Own-Writes consistency windows for user mutations.",
            practiceTask: "Implement a consistent hashing ring for sharding customer records across 4 database nodes.",
            keyTakeaway: "PgBouncer connection pooling and read/write splitting allow PostgreSQL databases to scale gracefully to tens of thousands of concurrent users."
          }
        ],
        practicalExercise: "Build an intelligent database datasource router supporting read/write splitting across primary and replica pools with automated Read-Your-Own-Writes lag mitigation.",
        competencyVerification: "Demonstrates database connection pooling, read-replica routing, and horizontal database scaling at Level 4.",
        resources: [
          {
            title: "PgBouncer Official Documentation & Connection Pooling Guide",
            url: "https://www.pgbouncer.org/usage.html",
            description: "Session, transaction, and statement pooling modes for PostgreSQL.",
            type: "documentation",
            provider: "PgBouncer Project"
          },
          {
            title: "PostgreSQL High Availability & Replication Documentation",
            url: "https://www.postgresql.org/docs/current/high-availability.html",
            description: "Streaming replication, hot standbys, failover management, and replication slots.",
            type: "documentation",
            provider: "PostgreSQL Global Development Group"
          }
        ]
      }
    },
    {
      id: "api-mod-10",
      order: 10,
      title: "Module 10 — Observability: Distributed Tracing, Structured Logging & Prometheus Metrics",
      durationMinutes: 160,
      summary: "Three pillars of observability (Logs, Metrics, Traces), OpenTelemetry (OTel) SDK instrumentation, Prometheus metric types (Counter, Gauge, Histogram), and Grafana dashboards.",
      learningObjectives: [
        "Instrument backend microservices with OpenTelemetry for distributed trace propagation (W3C Trace Context).",
        "Export RED metrics (Rate, Errors, Duration) using Prometheus client libraries.",
        "Implement high-performance JSON structured logging with contextual trace correlation IDs."
      ],
      resources: [
        {
          title: "OpenTelemetry Official Documentation & Instrumentation Guide",
          url: "https://opentelemetry.io/docs/concepts/what-is-opentelemetry/",
          description: "Traces, Metrics, Logs, W3C trace context propagation, and OpenTelemetry Collector.",
          type: "documentation",
          provider: "OpenTelemetry / CNCF"
        },
        {
          title: "Prometheus Monitoring: Metric Types & RED Method Guide",
          url: "https://prometheus.io/docs/concepts/metric_types/",
          description: "Counters, Gauges, Histograms, Summaries, and alerting rules.",
          type: "documentation",
          provider: "Prometheus Authors / CNCF"
        }
      ],
      content: {
        overview: "Observability enables engineering teams to understand the internal state of distributed systems by analyzing external telemetry (Logs, Metrics, Traces). Instrumenting OpenTelemetry provides end-to-end trace correlation across all microservice boundaries.",
        keyConcepts: [
          {
            section: "Section 1 — OpenTelemetry & Prometheus",
            topic: "Distributed Tracing & RED Metrics",
            title: "Lesson 1 — OpenTelemetry Spans, W3C Trace Context & RED Metrics",
            prerequisites: "Modules 1 through 9 (Complete Backend API Suite).",
            description: "How W3C `traceparent` headers propagate context across microservices, how Prometheus Histograms calculate P95/P99 latency, and how structured JSON logs correlate with Trace IDs.",
            whyItMatters: "When an API request fails across a chain of 10 microservices, distributed tracing pinpoints the exact service and database query responsible in seconds.",
            howItWorks: "OpenTelemetry instruments incoming HTTP/gRPC requests, generating a `trace_id` and `span_id`. Spans record timestamps and metadata, exporting to OpenTelemetry Collector and Jaeger/Zipkin.",
            stepByStep: [
              "Step 1: Instrument HTTP server middleware with OpenTelemetry SDK.",
              "Step 2: Propagate W3C `traceparent: 00-{trace_id}-{span_id}-01` header to downstream calls.",
              "Step 3: Track RED metrics: Request Rate (Counter), Error Count (Counter), and Request Duration (Histogram).",
              "Step 4: Include `trace_id` in every JSON log message for instant log-to-trace correlation."
            ],
            workedExample: "Structured JSON Log with Trace Correlation:\n```json\n{\n  \"timestamp\": \"2026-09-14T10:15:30.120Z\",\n  \"level\": \"ERROR\",\n  \"trace_id\": \"4bf92f3577b34da6a3ce929d0e0e4736\",\n  \"span_id\": \"00f067aa0ba902b7\",\n  \"service\": \"competency-service\",\n  \"message\": \"Database connection pool timeout after 5000ms\",\n  \"orgId\": \"ORG_ACME\"\n}\n```",
            realWorldUsage: "Mission-critical observability platforms at Google, Uber, Netflix, and Datadog.",
            codeSnippet: "// OpenTelemetry Tracing & RED Metrics Instrumentor (TypeScript)\nexport interface RequestMetrics {\n  method: string;\n  route: string;\n  statusCode: number;\n  durationMs: number;\n}\n\nexport class TelemetryObserver {\n  private requestCounter = new Map<string, number>();\n\n  public recordRequest(metric: RequestMetrics, traceId: string): void {\n    const metricKey = `${metric.method}_${metric.route}_${metric.statusCode}`;\n    const currentCount = this.requestCounter.get(metricKey) || 0;\n    this.requestCounter.set(metricKey, currentCount + 1);\n\n    // Structured JSON log with correlated trace ID\n    const logEntry = {\n      timestamp: new Date().toISOString(),\n      traceId,\n      method: metric.method,\n      route: metric.route,\n      status: metric.statusCode,\n      durationMs: metric.durationMs\n    };\n\n    console.log(`[OTEL METRICS] ${JSON.stringify(logEntry)}`);\n  }\n}\n\nconst observer = new TelemetryObserver();\nobserver.recordRequest(\n  { method: 'GET', route: '/api/v1/competencies', statusCode: 200, durationMs: 24.5 },\n  '4bf92f3577b34da6a3ce929d0e0e4736'\n);",
            codeExplanation: "1. Records RED metrics for Prometheus export.\n2. Formats structured JSON log entries.\n3. Correlates metrics and logs with OpenTelemetry `traceId`.",
            expectedOutput: "[OTEL METRICS] {\"timestamp\":\"...\",\"traceId\":\"4bf92f3577b34da6a3ce929d0e0e4736\",\"method\":\"GET\",\"route\":\"/api/v1/competencies\",\"status\":200,\"durationMs\":24.5}",
            commonMistakes: "Using unstructured plain text logs (`console.log('Error occurred: ' + err)`), making automated log aggregation and indexing impossible.",
            bestPractices: "Always emit structured JSON logs with correlated trace IDs and follow the RED method (Rate, Errors, Duration) for service metrics.",
            practiceTask: "Implement an Express/Fastify telemetry middleware that calculates P95 request duration histograms and exports them in Prometheus format.",
            keyTakeaway: "Correlating structured logs, Prometheus RED metrics, and OpenTelemetry distributed traces provides complete visibility into microservice health."
          }
        ],
        practicalExercise: "Build an observability module for a microservice cluster that instruments OpenTelemetry trace propagation, Prometheus RED metric histograms, and JSON structured log correlation.",
        competencyVerification: "Demonstrates distributed tracing instrumentation, Prometheus metrics modeling, and enterprise observability engineering at Level 4.",
        resources: [
          {
            title: "OpenTelemetry Official Documentation & Instrumentation Guide",
            url: "https://opentelemetry.io/docs/concepts/what-is-opentelemetry/",
            description: "Traces, Metrics, Logs, W3C trace context propagation, and OpenTelemetry Collector.",
            type: "documentation",
            provider: "OpenTelemetry / CNCF"
          },
          {
            title: "Prometheus Monitoring: Metric Types & RED Method Guide",
            url: "https://prometheus.io/docs/concepts/metric_types/",
            description: "Counters, Gauges, Histograms, Summaries, and alerting rules.",
            type: "documentation",
            provider: "Prometheus Authors / CNCF"
          }
        ]
      }
    }
  ]
};
