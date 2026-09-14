import { CourseCurriculum } from "./types";

export const courseTs301: CourseCurriculum = {
  courseId: "course-ts-301",
  totalDurationMinutes: 1440,
  modules: [
    {
      id: "ts-mod-1",
      order: 1,
      title: "Module 1 — Execution Context, Lexical Scope & Hoisting Mechanics",
      durationMinutes: 150,
      summary: "Understand the JavaScript runtime lifecycle, Global vs Function Execution Contexts, Call Stack mechanics, lexical environments, and variable hoisting rules (var vs let/const).",
      learningObjectives: [
        "Explain Creation Phase vs Execution Phase in the JavaScript V8 engine.",
        "Trace lexical scope chains and variable resolution across nested execution contexts.",
        "Differentiate Temporal Dead Zone (TDZ) behavior in let/const from var hoisting."
      ],
      resources: [
        {
          title: "MDN Web Docs: JavaScript Execution Context and Call Stack",
          url: "https://developer.mozilla.org/en-US/docs/Glossary/Call_stack",
          description: "How the JavaScript runtime executes functions, creates scope frames, and manages stack memory.",
          type: "documentation",
          provider: "MDN Web Docs"
        },
        {
          title: "JavaScript.info: Variable Scope, Closure and Hoisting",
          url: "https://javascript.info/closure",
          description: "Lexical environments, variable declarations (let/const vs var), and hoisting mechanics.",
          type: "guide",
          provider: "JavaScript.info"
        }
      ],
      content: {
        overview: "JavaScript executes code inside an Execution Context consisting of a Variable Object, Scope Chain, and 'this' binding. Understanding the difference between compile-time parsing (creation phase) and runtime execution (execution phase) prevents critical runtime reference errors.",
        keyConcepts: [
          {
            section: "Section 1 — V8 Execution Contexts",
            topic: "Call Stack & Scoping",
            title: "Lesson 1 — Execution Contexts, Lexical Environments & The Temporal Dead Zone",
            prerequisites: "Basic JavaScript syntax and function declarations.",
            description: "Deep dive into the two-phase execution lifecycle in JavaScript engines (Creation Phase and Execution Phase) and the mechanics of the Temporal Dead Zone (TDZ).",
            whyItMatters: "Understanding variable initialization lifecycle prevents silent undefined bugs from legacy `var` declarations and TDZ ReferenceErrors in modern ES6+ code.",
            howItWorks: "During the creation phase, function declarations and `var` bindings are hoisted into the Environment Record. Variables declared with `let` and `const` are registered in the scope but remain uninitialized until their declaration line executes.",
            stepByStep: [
              "Step 1: Global Execution Context is instantiated on engine initialization.",
              "Step 2: Creation Phase parses AST and allocates identifier memory.",
              "Step 3: Execution Phase executes statements sequentially on the Call Stack.",
              "Step 4: Function invocations push new Function Execution Context frames with their own LexicalEnvironment."
            ],
            workedExample: "Scope Resolution Demonstration:\n```typescript\nfunction outerScope() {\n  const serviceName = 'AuthService';\n  function innerScope() {\n    // Lexical lookup resolves serviceName from outer parent frame\n    return `Connecting to: ${serviceName}`;\n  }\n  return innerScope();\n}\n```",
            realWorldUsage: "Architecting modular, bug-free Node.js backend services and browser application runtimes.",
            codeSnippet: "// Execution Context & Scope Resolution Mechanics\nexport function demonstrateExecutionContext() {\n  const globalConfig = { env: 'production', timeoutMs: 5000 };\n\n  function createScopedHandler(handlerId: string) {\n    // Lexical closure over globalConfig and handlerId\n    return function execute(payload: Record<string, unknown>) {\n      const timestamp = Date.now();\n      return {\n        handlerId,\n        env: globalConfig.env,\n        processedAt: timestamp,\n        payload\n      };\n    };\n  }\n\n  const handler = createScopedHandler('AUTH_01');\n  return handler({ userId: 'USR-8821' });\n}\n\nconsole.log(demonstrateExecutionContext());",
            codeExplanation: "1. Evaluates scope chain across nested lexical environments.\n2. Captures globalConfig in the closure without leaking variables.\n3. Returns immutable execution record.",
            expectedOutput: "{ handlerId: 'AUTH_01', env: 'production', processedAt: 1718000000000, payload: { userId: 'USR-8821' } }",
            commonMistakes: "Accessing `let` or `const` variables before declaration, triggering a `ReferenceError: Cannot access variable before initialization`.",
            bestPractices: "Always declare variables at the top of their block scope and prefer `const` over `let` to enforce immutability.",
            practiceTask: "Write a function tracing lexical scope across three nested functions and verify variable shadowing behavior.",
            keyTakeaway: "Lexical scope is determined at compile-time by where functions and variables are declared in source code."
          }
        ],
        practicalExercise: "Implement a robust TypeScript scope analyzer that traces variable shadowing and prevents Temporal Dead Zone access across nested closures.",
        competencyVerification: "Demonstrates mastery of JavaScript execution contexts, lexical scope chains, and hoisting mechanics at Level 3.",
        resources: [
          {
            title: "MDN Web Docs: JavaScript Execution Context and Call Stack",
            url: "https://developer.mozilla.org/en-US/docs/Glossary/Call_stack",
            description: "How the JavaScript runtime executes functions, creates scope frames, and manages stack memory.",
            type: "documentation",
            provider: "MDN Web Docs"
          },
          {
            title: "JavaScript.info: Variable Scope, Closure and Hoisting",
            url: "https://javascript.info/closure",
            description: "Lexical environments, variable declarations (let/const vs var), and hoisting mechanics.",
            type: "guide",
            provider: "JavaScript.info"
          }
        ]
      }
    },
    {
      id: "ts-mod-2",
      order: 2,
      title: "Module 2 — Closures, Memory Heap Allocation & Garbage Collection",
      durationMinutes: 150,
      summary: "Lexical closures, memory retention in V8 heap, Mark-and-Sweep garbage collection, diagnosing memory leaks, and leveraging WeakMap / WeakSet.",
      learningObjectives: [
        "Implement data encapsulation and memoization patterns using closures.",
        "Diagnose memory leaks caused by detached DOM nodes and uncleared timer closures.",
        "Utilize WeakMap and WeakSet for garbage-collection-safe metadata caching."
      ],
      resources: [
        {
          title: "MDN Web Docs: Closures in JavaScript",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
          description: "Lexical scoping, private methods with closures, and common closure performance pitfalls.",
          type: "documentation",
          provider: "MDN Web Docs"
        },
        {
          title: "V8 Dev Blog: Trash Talk — The V8 Garbage Collector",
          url: "https://v8.dev/blog/trash-talk",
          description: "Scavenger collector, Orinoco, concurrent marking, and V8 heap memory layout.",
          type: "article",
          provider: "V8 Engine Team"
        }
      ],
      content: {
        overview: "A closure is the combination of a function bundled together with references to its surrounding lexical environment. Understanding closure lifecycles and V8 heap retention allows developers to build memory-efficient applications free from leaks.",
        keyConcepts: [
          {
            section: "Section 1 — Closures & Memory Management",
            topic: "Closures & Garbage Collection",
            title: "Lesson 1 — Encapsulation, Memoization & Leak Prevention with Closures",
            prerequisites: "Module 1 (Execution Context & Lexical Scope).",
            description: "How closures retain references to outer scope variables, how to build private state managers and memoized caches, and how to prevent memory leaks with WeakMap.",
            whyItMatters: "Holding unintended references inside long-lived closures prevents V8 Mark-and-Sweep GC from reclaiming heap memory, causing server OOM crashes.",
            howItWorks: "Functions hold an internal `[[Environment]]` slot pointing to the LexicalEnvironment where they were born. As long as the function is reachable, its environment remains allocated in the V8 heap.",
            stepByStep: [
              "Step 1: Create a factory function declaring private state variables.",
              "Step 2: Return an object containing closure methods referencing that private state.",
              "Step 3: Use WeakMap to store auxiliary metadata keyed by object references so GC can collect keys automatically.",
              "Step 4: Clean up event listeners and intervals when components unmount."
            ],
            workedExample: "Closure-Based Rate Limiter:\n```typescript\nfunction createRateLimiter(maxRequests: number, windowMs: number) {\n  let requestCount = 0;\n  let resetTime = Date.now() + windowMs;\n  return () => {\n    const now = Date.now();\n    if (now > resetTime) { requestCount = 0; resetTime = now + windowMs; }\n    if (requestCount >= maxRequests) return false;\n    requestCount++;\n    return true;\n  };\n}\n```",
            realWorldUsage: "State management, functional middleware, and high-performance caching layers.",
            codeSnippet: "// Memory-Safe Memoization Cache using Closures and WeakMap\nexport function createMemoizedService<T extends object, R>(\n  computeFn: (arg: T) => R\n) {\n  // WeakMap allows keys (objects) to be garbage-collected when no other references exist\n  const cache = new WeakMap<T, R>();\n\n  return function getOrCompute(entity: T): R {\n    if (cache.has(entity)) {\n      return cache.get(entity)!;\n    }\n    const result = computeFn(entity);\n    cache.set(entity, result);\n    return result;\n  };\n}\n\n// Usage demonstration\ninterface UserSession { id: string; role: string; }\nconst getPermissions = createMemoizedService((session: UserSession) => ({\n  isAdmin: session.role === 'admin',\n  checkedAt: new Date().toISOString()\n}));\n\nconst session1: UserSession = { id: 'SES_101', role: 'admin' };\nconsole.log(getPermissions(session1));",
            codeExplanation: "1. Uses WeakMap to prevent retaining objects indefinitely in memory.\n2. Encapsulates caching state inside the closure returned by createMemoizedService.\n3. Automatically reclaims cache entries when session objects are dereferenced.",
            expectedOutput: "{ isAdmin: true, checkedAt: '2026-09-14T10:30:00.000Z' }",
            commonMistakes: "Using a regular `Map` with object keys for caching without implementing eviction, leaking memory as new objects are created.",
            bestPractices: "Use `WeakMap` for object-keyed caches and explicitly nullify unneeded references in long-lived event handlers.",
            practiceTask: "Build a closure-based token bucket rate limiter with automatic time-based token replenishment.",
            keyTakeaway: "Closures enable robust private state encapsulation, while WeakMaps ensure objects remain eligible for garbage collection."
          }
        ],
        practicalExercise: "Build a memory-efficient memoization cache using closures and WeakMap, and verify that cached entries are reclaimed when source objects lose references.",
        competencyVerification: "Demonstrates mastery of lexical closures, V8 garbage collection behavior, and memory leak prevention at Level 3.",
        resources: [
          {
            title: "MDN Web Docs: Closures in JavaScript",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
            description: "Lexical scoping, private methods with closures, and common closure performance pitfalls.",
            type: "documentation",
            provider: "MDN Web Docs"
          },
          {
            title: "V8 Dev Blog: Trash Talk — The V8 Garbage Collector",
            url: "https://v8.dev/blog/trash-talk",
            description: "Scavenger collector, Orinoco, concurrent marking, and V8 heap memory layout.",
            type: "article",
            provider: "V8 Engine Team"
          }
        ]
      }
    },
    {
      id: "ts-mod-3",
      order: 3,
      title: "Module 3 — Prototypal Inheritance, Object Methods & ES6+ Classes",
      durationMinutes: 150,
      summary: "Prototype chains ([[Prototype]], Object.prototype), Object.create, constructor functions vs ES6 class syntax, method borrowing, and mixins.",
      learningObjectives: [
        "Explain prototype delegation and lookup mechanics across the prototype chain.",
        "Differentiate constructor prototypes (.prototype) from object instance prototypes (__proto__).",
        "Implement class inheritance with `super`, static members, and private fields (#field)."
      ],
      resources: [
        {
          title: "MDN Web Docs: Inheritance and the prototype chain",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",
          description: "Understanding prototype linkage, shadowing properties, and Object.create.",
          type: "documentation",
          provider: "MDN Web Docs"
        },
        {
          title: "JavaScript.info: Prototypes and Inheritance",
          url: "https://javascript.info/prototypes",
          description: "Prototypal inheritance, F.prototype, native prototypes, and class syntax.",
          type: "guide",
          provider: "JavaScript.info"
        }
      ],
      content: {
        overview: "JavaScript uses prototypal inheritance rather than classical inheritance. ES6 classes provide syntactic sugar over prototype chains. Mastering prototypes allows developers to optimize memory by sharing methods across thousands of object instances.",
        keyConcepts: [
          {
            section: "Section 1 — Prototypes & Classes",
            topic: "Prototype Delegation",
            title: "Lesson 1 — Prototype Chains, ES6 Classes & Private Fields",
            prerequisites: "Module 2 (Closures & Memory).",
            description: "Deep dive into property delegation via `[[Prototype]]`, method sharing on `.prototype`, ES6 `class` syntax, `super` resolution, and modern `#privateField` encapsulation.",
            whyItMatters: "Defining methods inside constructors duplicates function objects for every instance, wasting heap memory. Prototype methods share a single function reference.",
            howItWorks: "When accessing `obj.prop`, the engine checks `obj` own properties; if not found, it traverses `obj.__proto__` up to `Object.prototype` before returning `undefined`.",
            stepByStep: [
              "Step 1: Declare base class with shared prototype methods and `#private` fields.",
              "Step 2: Subclass with `extends` and invoke `super(args)` in constructor.",
              "Step 3: Leverage `Object.getPrototypeOf()` and `Object.setPrototypeOf()` for dynamic delegation.",
              "Step 4: Use `Object.freeze()` and `Object.seal()` to enforce object immutability."
            ],
            workedExample: "Class Inheritance with Private Fields:\n```typescript\nclass BaseRepository<T> {\n  #entities = new Map<string, T>();\n  save(id: string, entity: T): void { this.#entities.set(id, entity); }\n  findById(id: string): T | undefined { return this.#entities.get(id); }\n}\n```",
            realWorldUsage: "Domain-Driven Design (DDD) entity modeling, ORM frameworks, and custom data structures.",
            codeSnippet: "// Prototypal Inheritance & Modern ES Class Hierarchy\nexport abstract class BaseEventProducer {\n  #emitterId: string;\n\n  constructor(emitterId: string) {\n    this.#emitterId = emitterId;\n  }\n\n  get emitterId(): string {\n    return this.#emitterId;\n  }\n\n  abstract dispatch(event: string, payload: unknown): boolean;\n}\n\nexport class TelemetryProducer extends BaseEventProducer {\n  private eventLog: string[] = [];\n\n  constructor(sourceName: string) {\n    super(`SRC_${sourceName.toUpperCase()}`);\n  }\n\n  override dispatch(event: string, payload: unknown): boolean {\n    const entry = `[${this.emitterId}] Event: ${event} | Data: ${JSON.stringify(payload)}`;\n    this.eventLog.push(entry);\n    return true;\n  }\n\n  getRecentLogs(): readonly string[] {\n    return Object.freeze([...this.eventLog]);\n  }\n}\n\nconst producer = new TelemetryProducer('metrics');\nproducer.dispatch('CPU_SPIKE', { load: 0.94 });\nconsole.log(producer.getRecentLogs());",
            codeExplanation: "1. Uses modern `#emitterId` private field for true runtime privacy.\n2. Demonstrates abstract class inheritance and method overriding.\n3. Returns immutable frozen logs to prevent external mutation.",
            expectedOutput: "['[SRC_METRICS] Event: CPU_SPIKE | Data: {\"load\":0.94}']",
            commonMistakes: "Mutating `Object.prototype` directly (prototype pollution vulnerability), breaking third-party libraries.",
            bestPractices: "Use standard ES6 classes with TypeScript access modifiers and `#private` fields for sensitive state.",
            practiceTask: "Implement a pluggable mixin system using TypeScript class factories that adds timestamp logging to any base class.",
            keyTakeaway: "Prototypes provide efficient method sharing, while ES6 classes and private fields offer clean, maintainable OOP abstractions."
          }
        ],
        practicalExercise: "Design an extensible event dispatcher hierarchy using ES6 classes, private fields, and prototype mixins to support pluggable logging and retry policies.",
        competencyVerification: "Demonstrates prototypal inheritance, prototype chain traversal, and ES6 class architecture at Level 3.",
        resources: [
          {
            title: "MDN Web Docs: Inheritance and the prototype chain",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain",
            description: "Understanding prototype linkage, shadowing properties, and Object.create.",
            type: "documentation",
            provider: "MDN Web Docs"
          },
          {
            title: "JavaScript.info: Prototypes and Inheritance",
            url: "https://javascript.info/prototypes",
            description: "Prototypal inheritance, F.prototype, native prototypes, and class syntax.",
            type: "guide",
            provider: "JavaScript.info"
          }
        ]
      }
    },
    {
      id: "ts-mod-4",
      order: 4,
      title: "Module 4 — DOM Event Dispatching, Bubbling, Capturing & Delegation",
      durationMinutes: 150,
      summary: "DOM Event flow phases (Capturing, Target, Bubbling), CustomEvent dispatching, Event Delegation pattern, and passive event listeners.",
      learningObjectives: [
        "Trace the 3 phases of DOM event propagation.",
        "Implement high-performance Event Delegation for dynamic lists.",
        "Use CustomEvent with structured detail payloads for decoupled component communication."
      ],
      resources: [
        {
          title: "MDN Web Docs: Introduction to events",
          url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events",
          description: "Event bubbling, event capturing, event delegation, and event objects.",
          type: "documentation",
          provider: "MDN Web Docs"
        },
        {
          title: "JavaScript.info: Event Bubbling and Capturing",
          url: "https://javascript.info/bubbling-and-capturing",
          description: "Standard DOM event flow, stopPropagation(), and event delegation techniques.",
          type: "guide",
          provider: "JavaScript.info"
        }
      ],
      content: {
        overview: "DOM events propagate through three phases: Capture (window down to target), Target, and Bubble (target back up to window). Event Delegation leverages bubbling to attach a single listener to a parent element, handling thousands of child elements efficiently.",
        keyConcepts: [
          {
            section: "Section 1 — Event Propagation & Delegation",
            topic: "Event Delegation Architecture",
            title: "Lesson 1 — Event Propagation Phases & High-Performance Event Delegation",
            prerequisites: "DOM manipulation and JavaScript basics.",
            description: "How event capturing and bubbling work in the browser, how to use `event.target` vs `event.currentTarget`, and how to build scalable event delegation managers.",
            whyItMatters: "Attaching individual click handlers to 1,000 table rows creates 1,000 event listener objects. Event delegation attaches 1 listener to the table, cutting memory usage by 99%.",
            howItWorks: "Events bubble up the DOM tree. The parent listener inspects `event.target.closest('[data-action]')` to determine which child triggered the action.",
            stepByStep: [
              "Step 1: Attach single event listener to the container element with `{ passive: true }` if scroll/touch.",
              "Step 2: Inspect `event.target.closest(selector)` to match intended target elements.",
              "Step 3: Extract dataset attributes (`element.dataset.action`, `element.dataset.id`).",
              "Step 4: Dispatch command to matching action handler."
            ],
            workedExample: "Event Delegation Pattern:\n```typescript\nfunction handleListClick(event: MouseEvent) {\n  const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-id]');\n  if (!target) return;\n  const itemId = target.dataset.id;\n  console.log(`Action executed on item: ${itemId}`);\n}\n```",
            realWorldUsage: "Virtual tables, data grids, dashboard navigation, and UI component libraries.",
            codeSnippet: "// Type-Safe Event Delegation Manager\nexport interface ActionRoute {\n  action: string;\n  handler: (target: HTMLElement, event: Event) => void;\n}\n\nexport class EventDelegator {\n  private routes = new Map<string, (target: HTMLElement, event: Event) => void>();\n\n  registerAction(actionName: string, handler: (target: HTMLElement, event: Event) => void): this {\n    this.routes.set(actionName, handler);\n    return this;\n  }\n\n  handleEvent(event: Event): boolean {\n    const target = event.target as HTMLElement | null;\n    if (!target) return false;\n\n    const actionableElement = target.closest<HTMLElement>('[data-action]');\n    if (!actionableElement) return false;\n\n    const actionName = actionableElement.dataset.action;\n    if (actionName && this.routes.has(actionName)) {\n      this.routes.get(actionName)!(actionableElement, event);\n      return true;\n    }\n    return false;\n  }\n}",
            codeExplanation: "1. Centralizes event handling through declarative `data-action` attributes.\n2. Uses `closest()` for robust ancestor resolution when clicking nested icons.\n3. Decouples UI DOM structure from business logic handlers.",
            expectedOutput: "Event successfully delegated to action handler.",
            commonMistakes: "Using `event.target` directly without `closest()`, causing clicks on child SVG icons to fail selector checks.",
            bestPractices: "Use `data-action` attributes for delegation and use passive listeners `{ passive: true }` for scroll/wheel events.",
            practiceTask: "Implement an event delegation controller for a dynamic kanban board supporting drag-and-drop actions.",
            keyTakeaway: "Event delegation leverages DOM bubbling to provide high-performance, scalable event handling with minimal memory overhead."
          }
        ],
        practicalExercise: "Build an event delegation controller for a dynamic 10,000-row virtual table, handling row selection, inline edits, and deletions with a single event listener.",
        competencyVerification: "Demonstrates mastery of DOM event propagation phases, event delegation architecture, and CustomEvent dispatching at Level 3.",
        resources: [
          {
            title: "MDN Web Docs: Introduction to events",
            url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events",
            description: "Event bubbling, event capturing, event delegation, and event objects.",
            type: "documentation",
            provider: "MDN Web Docs"
          },
          {
            title: "JavaScript.info: Event Bubbling and Capturing",
            url: "https://javascript.info/bubbling-and-capturing",
            description: "Standard DOM event flow, stopPropagation(), and event delegation techniques.",
            type: "guide",
            provider: "JavaScript.info"
          }
        ]
      }
    },
    {
      id: "ts-mod-5",
      order: 5,
      title: "Module 5 — Asynchronous JavaScript: Event Loop, Microtasks, Promises & async/await",
      durationMinutes: 180,
      summary: "V8 Event Loop, Call Stack, Task (Macrotask) Queue vs Microtask Queue (Promise callbacks, queueMicrotask), Promise combinators, and async/await error handling.",
      learningObjectives: [
        "Trace execution order between synchronous code, microtasks, and macrotasks.",
        "Implement custom Promise utilities (allSettled, retry, concurrency pool).",
        "Handle asynchronous errors defensively with try/catch and unhandledrejection handlers."
      ],
      resources: [
        {
          title: "JavaScript.info: Event Loop — Microtasks and Macrotasks",
          url: "https://javascript.info/event-loop",
          description: "Call stack, Macrotask queue (setTimeout), and Microtask queue (Promise, queueMicrotask) execution priority.",
          type: "guide",
          provider: "JavaScript.info"
        },
        {
          title: "MDN Web Docs: Using Promises and async/await",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises",
          description: "Promise chaining, Promise.all, Promise.allSettled, and async/await syntax.",
          type: "documentation",
          provider: "MDN Web Docs"
        }
      ],
      content: {
        overview: "JavaScript is single-threaded and non-blocking, powered by an Event Loop that coordinates the Call Stack, Microtask Queue, and Task Queue. Understanding microtask priority prevents race conditions and UI freezing in asynchronous applications.",
        keyConcepts: [
          {
            section: "Section 1 — Event Loop & Promises",
            topic: "Microtasks & Concurrency Pools",
            title: "Lesson 1 — The Event Loop: Microtasks, Macrotasks & Concurrent Task Pools",
            prerequisites: "Module 1 (Execution Context) and basic Promise usage.",
            description: "How the event loop processes tasks: draining the entire Microtask queue after each synchronous execution and before running the next Macrotask (setTimeout/setInterval).",
            whyItMatters: "Mixing promises with timers can produce unexpected execution ordering. Microtasks execute immediately before DOM rendering and next macrotasks.",
            howItWorks: "1. Synchronous code executes on Call Stack. 2. `Promise.then()` callbacks enqueue in Microtask Queue. 3. Call Stack empties -> entire Microtask queue drains. 4. Next Macrotask dequeues.",
            stepByStep: [
              "Step 1: Enqueue critical state updates in microtasks via `queueMicrotask()` or Promises.",
              "Step 2: Use `Promise.allSettled()` when independent requests should not fail if one errors.",
              "Step 3: Implement an asynchronous concurrency pool to limit concurrent in-flight requests.",
              "Step 4: Wrap top-level executions with structured try/catch and timeout guards."
            ],
            workedExample: "Execution Priority Example:\n```typescript\nconsole.log('1. Sync');\nsetTimeout(() => console.log('4. Macrotask'), 0);\nPromise.resolve().then(() => console.log('3. Microtask'));\nconsole.log('2. Sync');\n// Output order: 1, 2, 3, 4\n```",
            realWorldUsage: "API fetch pools, batch processing, queue consumers, and background data synchronization.",
            codeSnippet: "// High-Performance Async Concurrency Pool\nexport async function asyncPool<T, R>(\n  poolLimit: number,\n  items: T[],\n  iteratorFn: (item: T) => Promise<R>\n): Promise<R[]> {\n  const results: R[] = [];\n  const executing: Promise<void>[] = [];\n\n  for (const item of items) {\n    const promise = Promise.resolve().then(() => iteratorFn(item)).then(result => {\n      results.push(result);\n    });\n\n    const executingPromise: Promise<void> = promise.then(() => {\n      executing.splice(executing.indexOf(executingPromise), 1);\n    });\n    executing.push(executingPromise);\n\n    if (executing.length >= poolLimit) {\n      await Promise.race(executing);\n    }\n  }\n\n  await Promise.all(executing);\n  return results;\n}\n\n// Usage demonstration with 3 concurrent workers\nconst tasks = [10, 20, 30, 40, 50];\nasyncPool(2, tasks, async (t) => `Processed ${t}`).then(res => console.log(res));",
            codeExplanation: "1. Limits active concurrent promises to `poolLimit` to avoid overloading downstream APIs.\n2. Uses `Promise.race()` to await the fastest completing worker before spawning next task.\n3. Ensures all tasks finish before resolving final output array.",
            expectedOutput: "['Processed 10', 'Processed 20', 'Processed 30', 'Processed 40', 'Processed 50']",
            commonMistakes: "Using `forEach` with async callbacks (`items.forEach(async item => ...)`), which spawns all promises concurrently without awaiting.",
            bestPractices: "Use `for...of` with `await` for sequential execution, `Promise.all()` for full parallelism, and an async pool for bounded concurrency.",
            practiceTask: "Build an async retry utility with exponential backoff and jitter for resilient API fetch operations.",
            keyTakeaway: "Microtasks have higher priority than macrotasks; bounded concurrency pools prevent resource exhaustion in high-throughput workflows."
          }
        ],
        practicalExercise: "Build an asynchronous worker pool with bounded concurrency (max 4 parallel tasks), automatic exponential backoff retries, and comprehensive error aggregation using Promise.allSettled.",
        competencyVerification: "Demonstrates deep understanding of the JavaScript event loop, microtask execution priority, and asynchronous concurrency patterns at Level 4.",
        resources: [
          {
            title: "JavaScript.info: Event Loop — Microtasks and Macrotasks",
            url: "https://javascript.info/event-loop",
            description: "Call stack, Macrotask queue (setTimeout), and Microtask queue (Promise, queueMicrotask) execution priority.",
            type: "guide",
            provider: "JavaScript.info"
          },
          {
            title: "MDN Web Docs: Using Promises and async/await",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises",
            description: "Promise chaining, Promise.all, Promise.allSettled, and async/await syntax.",
            type: "documentation",
            provider: "MDN Web Docs"
          }
        ]
      }
    },
    {
      id: "ts-mod-6",
      order: 6,
      title: "Module 6 — ES Modules, CommonJS Interop & Bundler Fundamentals (Vite/Rollup)",
      durationMinutes: 150,
      summary: "Static ESM syntax (import/export), dynamic imports, CommonJS (require/module.exports) interoperability, tree-shaking mechanics, and modern bundler configurations (Vite/Rollup/esbuild).",
      learningObjectives: [
        "Differentiate static ESM parsing from dynamic CommonJS runtime execution.",
        "Implement code splitting and lazy loading using dynamic import().",
        "Configure Rollup/Vite for dead-code elimination (tree-shaking)."
      ],
      resources: [
        {
          title: "MDN Web Docs: JavaScript modules (ESM)",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
          description: "Static imports, named and default exports, dynamic import(), and module scripts.",
          type: "documentation",
          provider: "MDN Web Docs"
        },
        {
          title: "Vite Guide: Why Vite and ESM Architecture",
          url: "https://vitejs.dev/guide/why.html",
          description: "Native ESM-based dev server, Rollup bundling, and tree-shaking optimization.",
          type: "guide",
          provider: "Vite Team"
        }
      ],
      content: {
        overview: "ES Modules (ESM) provide official, standardized modularity in JavaScript. Static import/export declarations enable bundlers to analyze dependency graphs at compile time, eliminating dead code (tree-shaking) and enabling lightning-fast HMR.",
        keyConcepts: [
          {
            section: "Section 1 — ESM & Bundling",
            topic: "ES Modules & Tree-Shaking",
            title: "Lesson 1 — Static ESM Graphs, Tree-Shaking & Dynamic Code Splitting",
            prerequisites: "Module 5 (Asynchronous JavaScript).",
            description: "How static module structure enables tree-shaking, how dynamic `import()` splits code into on-demand bundles, and how to handle CJS/ESM dual-package hazards.",
            whyItMatters: "Unoptimized bundle size directly degrades Core Web Vitals (LCP, FID) and increases server cold-start latency.",
            howItWorks: "Because ESM imports are static, bundlers determine exported bindings without executing code. Unreferenced exports are eliminated from the final production bundle.",
            stepByStep: [
              "Step 1: Declare `\"type\": \"module\"` in package.json.",
              "Step 2: Use named exports to enable granular tree-shaking.",
              "Step 3: Implement dynamic `import('./heavyModule.js')` for route-based lazy loading.",
              "Step 4: Configure `sideEffects: false` in package.json to signal bundlers that unused files can be dropped."
            ],
            workedExample: "Dynamic Module Loading with Graceful Fallback:\n```typescript\nasync function loadAnalyticsEngine() {\n  try {\n    const { initAnalytics } = await import('./analytics.js');\n    initAnalytics();\n  } catch (err) {\n    console.warn('Analytics unavailable offline');\n  }\n}\n```",
            realWorldUsage: "Modern front-end applications built with Vite, Next.js, and Rollup.",
            codeSnippet: "// Dynamic Module Loader with Type-Safe Factory\nexport interface PluginModule {\n  name: string;\n  initialize: () => Promise<void>;\n}\n\nexport class PluginRegistry {\n  private loadedPlugins = new Map<string, PluginModule>();\n\n  async loadPlugin(pluginPath: string): Promise<PluginModule> {\n    if (this.loadedPlugins.has(pluginPath)) {\n      return this.loadedPlugins.get(pluginPath)!;\n    }\n\n    // Native dynamic ESM import\n    const module = (await import(pluginPath)) as PluginModule;\n    await module.initialize();\n    this.loadedPlugins.set(pluginPath, module);\n    return module;\n  }\n}",
            codeExplanation: "1. Uses dynamic `import()` to load modules on demand.\n2. Enforces type safety on imported plugin exports.\n3. Caches loaded instances to avoid redundant module evaluation.",
            expectedOutput: "Plugin dynamically loaded, initialized, and registered.",
            commonMistakes: "Using `export default` with large monolithic objects, preventing bundlers from tree-shaking unused properties.",
            bestPractices: "Always prefer named exports (`export const util = ...`) and mark pure modules with `/*#__PURE__*/` comments.",
            practiceTask: "Configure a minimal Vite project with two route chunks and verify dynamic split output using rollup-plugin-visualizer.",
            keyTakeaway: "Static ESM imports allow bundlers to eliminate unused code, while dynamic imports enable efficient route-based code splitting."
          }
        ],
        practicalExercise: "Build a modular plugin system using dynamic ESM imports that lazy-loads features on demand and compiles cleanly with Vite.",
        competencyVerification: "Demonstrates ESM static graph analysis, dynamic code splitting, and bundler tree-shaking optimization at Level 3.",
        resources: [
          {
            title: "MDN Web Docs: JavaScript modules (ESM)",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules",
            description: "Static imports, named and default exports, dynamic import(), and module scripts.",
            type: "documentation",
            provider: "MDN Web Docs"
          },
          {
            title: "Vite Guide: Why Vite and ESM Architecture",
            url: "https://vitejs.dev/guide/why.html",
            description: "Native ESM-based dev server, Rollup bundling, and tree-shaking optimization.",
            type: "guide",
            provider: "Vite Team"
          }
        ]
      }
    },
    {
      id: "ts-mod-7",
      order: 7,
      title: "Module 7 — TypeScript Foundations: Types, Interfaces, Unions & Type Narrowing",
      durationMinutes: 180,
      summary: "TypeScript type system, types vs interfaces, Discriminated Unions, Control Flow Analysis, User-Defined Type Guards (is), and exhaustive checking with never.",
      learningObjectives: [
        "Choose appropriately between `type` aliases and `interface` declarations.",
        "Model domain entities with Discriminated Unions and handle states exhaustively.",
        "Implement custom User-Defined Type Guards using the `arg is Type` predicate."
      ],
      resources: [
        {
          title: "TypeScript Official Handbook: Narrowing & Discriminated Unions",
          url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
          description: "Type guards, instanceof, in operator, type predicates, and exhaustive checks with never.",
          type: "documentation",
          provider: "Microsoft TypeScript"
        },
        {
          title: "TypeScript Handbook: Everyday Types and Interfaces",
          url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
          description: "Primitives, Union types, Type Aliases, Interfaces, and Type Assertions.",
          type: "guide",
          provider: "Microsoft TypeScript"
        }
      ],
      content: {
        overview: "TypeScript adds static type safety to JavaScript through structural subtyping. Mastering discriminated unions, control flow analysis, and user-defined type guards turns runtime bugs into compile-time errors.",
        keyConcepts: [
          {
            section: "Section 1 — Type Narrowing & Unions",
            topic: "Discriminated Unions & Exhaustiveness",
            title: "Lesson 1 — Discriminated Unions, Type Predicates & Exhaustive Pattern Matching",
            prerequisites: "JavaScript ES6+ fundamentals.",
            description: "How to structure complex state machines using tagged/discriminated unions, write custom type guards (`arg is T`), and ensure compiler-enforced exhaustiveness checking.",
            whyItMatters: "Eliminates runtime `undefined is not a function` errors by guaranteeing that all possible state variants are handled before compilation passes.",
            howItWorks: "A common literal property (the discriminator, e.g., `status: 'success' | 'error'`) allows TypeScript's Control Flow Analysis to narrow the type inside switch/if blocks.",
            stepByStep: [
              "Step 1: Define union member interfaces sharing a common literal discriminator tag (`kind` or `status`).",
              "Step 2: Create a union type aggregating all valid variants.",
              "Step 3: Implement pattern matching with `switch (action.status)`.",
              "Step 4: Add default branch assigning to `const _exhaustiveCheck: never = action;`."
            ],
            workedExample: "Exhaustive State Machine Handler:\n```typescript\ntype ApiResponse =\n  | { status: 'loading' }\n  | { status: 'success'; data: string[] }\n  | { status: 'error'; error: Error };\n\nfunction renderResponse(res: ApiResponse): string {\n  switch (res.status) {\n    case 'loading': return 'Spinner...';\n    case 'success': return `Items: ${res.data.join(', ')}`;\n    case 'error': return `Failed: ${res.error.message}`;\n    default: {\n      const _unreachable: never = res;\n      throw new Error(`Unhandled variant: ${_unreachable}`);\n    }\n  }\n}\n```",
            realWorldUsage: "Redux/Zustand reducers, API response handlers, and UI component state management.",
            codeSnippet: "// Discriminated Unions & Type Guard Architecture\nexport interface FetchIdle { status: 'IDLE'; }\nexport interface FetchLoading { status: 'LOADING'; startedAt: number; }\nexport interface FetchSuccess<T> { status: 'SUCCESS'; data: T; latencyMs: number; }\nexport interface FetchFailure { status: 'FAILURE'; error: string; code: number; }\n\nexport type AsyncState<T> = FetchIdle | FetchLoading | FetchSuccess<T> | FetchFailure;\n\n// User-Defined Type Guard\nexport function isSuccessState<T>(state: AsyncState<T>): state is FetchSuccess<T> {\n  return state.status === 'SUCCESS';\n}\n\n// Exhaustive Processor\nexport function processState<T>(state: AsyncState<T>): string {\n  switch (state.status) {\n    case 'IDLE': return 'State is idle';\n    case 'LOADING': return `Loading since ${state.startedAt}`;\n    case 'SUCCESS': return `Success: received payload with ${state.latencyMs}ms latency`;\n    case 'FAILURE': return `Error [${state.code}]: ${state.error}`;\n    default: {\n      const _exhaustive: never = state;\n      throw new Error(`Unexpected state variant: ${_exhaustive}`);\n    }\n  }\n}\n\nconst success: AsyncState<string[]> = { status: 'SUCCESS', data: ['a', 'b'], latencyMs: 45 };\nconsole.log(processState(success));",
            codeExplanation: "1. Models mutually exclusive states with explicit discriminator tags.\n2. Provides custom type guard `isSuccessState` for safe conditional checks.\n3. Enforces compiler exhaustiveness: adding a new status variant causes a compile error if unhandled.",
            expectedOutput: "Success: received payload with 45ms latency",
            commonMistakes: "Using `any` type assertions (`as any`) to bypass type errors rather than properly refining unions.",
            bestPractices: "Use discriminated unions for all async state management and always add an exhaustive `never` check in switch statements.",
            practiceTask: "Define a discriminated union modeling a payment transaction lifecycle (Pending, Authorized, Captured, Refunded, Failed) with exhaustive verification.",
            keyTakeaway: "Discriminated unions combined with exhaustive checks provide mathematical guarantees that all runtime cases are handled."
          }
        ],
        practicalExercise: "Build a type-safe workflow engine using discriminated unions and type predicates that processes multi-step onboarding states with exhaustive compile-time verification.",
        competencyVerification: "Demonstrates TypeScript type narrowing, discriminated unions, and exhaustive pattern matching at Level 3.",
        resources: [
          {
            title: "TypeScript Official Handbook: Narrowing & Discriminated Unions",
            url: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
            description: "Type guards, instanceof, in operator, type predicates, and exhaustive checks with never.",
            type: "documentation",
            provider: "Microsoft TypeScript"
          },
          {
            title: "TypeScript Handbook: Everyday Types and Interfaces",
            url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html",
            description: "Primitives, Union types, Type Aliases, Interfaces, and Type Assertions.",
            type: "guide",
            provider: "Microsoft TypeScript"
          }
        ]
      }
    },
    {
      id: "ts-mod-8",
      order: 8,
      title: "Module 8 — Advanced TypeScript: Generics, Conditional Types, infer & Mapped Types",
      durationMinutes: 180,
      summary: "Generic constraints (T extends object), Conditional Types (T extends U ? X : Y), infer keyword for type extraction, Mapped Types, and Template Literal Types.",
      learningObjectives: [
        "Construct reusable generic abstractions with strict constraints.",
        "Implement complex type utilities using conditional types and `infer`.",
        "Transform entity schemas with mapped types and template literal types."
      ],
      resources: [
        {
          title: "TypeScript Official Handbook: Conditional Types & infer",
          url: "https://www.typescriptlang.org/docs/handbook/2/conditional-types.html",
          description: "Conditional type syntax, distributive conditional types, and inferring within conditional types.",
          type: "documentation",
          provider: "Microsoft TypeScript"
        },
        {
          title: "TypeScript Handbook: Mapped Types & Template Literals",
          url: "https://www.typescriptlang.org/docs/handbook/2/mapped-types.html",
          description: "Key remapping with as, modifiers (+readonly, -optional), and template literal type generation.",
          type: "documentation",
          provider: "Microsoft TypeScript"
        }
      ],
      content: {
        overview: "Advanced TypeScript operates as a functional type-level programming language. Mastering generic constraints, mapped types, conditional types, and `infer` allows engineers to build bulletproof type-safe libraries and API SDKs.",
        keyConcepts: [
          {
            section: "Section 1 — Type-Level Metaprogramming",
            topic: "Conditional Types & Mapped Types",
            title: "Lesson 1 — Generic Metaprogramming: infer, Key Remapping & Deep Immutability",
            prerequisites: "Module 7 (TypeScript Foundations).",
            description: "How to extract nested types with `infer`, build recursively deep utility types (`DeepReadonly<T>`), and remap object keys using Template Literal Types (`${string}Changed`).",
            whyItMatters: "Enables building expressive SDKs where database queries, routing paths, and event names are strictly validated at compile time.",
            howItWorks: "Conditional types evaluate type relationships at compile time. `infer R` introduces a type variable in the true branch, capturing resolved inner types.",
            stepByStep: [
              "Step 1: Declare generic type parameter with bounds (`<T extends Record<string, any>>`).",
              "Step 2: Use `[K in keyof T]` mapped type syntax to iterate properties.",
              "Step 3: Remap keys using `as \`on\${Capitalize<string & K>}\``.",
              "Step 4: Use `T extends Promise<infer U> ? U : T` to unwrap nested async types."
            ],
            workedExample: "Async Return Type Unwrapper:\n```typescript\ntype AwaitedResult<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;\n\nasync function fetchUserProfile() { return { id: 'USR_1', name: 'Alice' }; }\ntype UserProfile = AwaitedResult<typeof fetchUserProfile>; // { id: string; name: string }\n```",
            realWorldUsage: "Prisma ORM generated types, tRPC routers, and React hook libraries.",
            codeSnippet: "// Advanced Type-Level Metaprogramming Suite\n\n// 1. Recursive Deep Readonly\nexport type DeepImmutable<T> = T extends Function | boolean | number | string | null | undefined\n  ? T\n  : T extends Array<infer U>\n  ? ReadonlyArray<DeepImmutable<U>>\n  : T extends Map<infer K, infer V>\n  ? ReadonlyMap<DeepImmutable<K>, DeepImmutable<V>>\n  : { readonly [K in keyof T]: DeepImmutable<T[K]> };\n\n// 2. Type-Safe Event Listener Key Remapper\nexport type EventHandlers<T> = {\n  [K in keyof T as `on${Capitalize<string & K>}Change`]?: (value: T[K]) => void;\n};\n\n// 3. Unpack Nested Promise Array\nexport type UnpackAsyncArray<T> = T extends Promise<Array<infer Item>> ? Item : T;\n\n// Demonstration interface\ninterface AppState {\n  user: { name: string; roles: string[] };\n  theme: 'light' | 'dark';\n}\n\ntype AppEvents = EventHandlers<AppState>;\n// AppEvents is: { onUserChange?: (value: { name: string; roles: string[] }) => void; onThemeChange?: (value: 'light' | 'dark') => void; }",
            codeExplanation: "1. `DeepImmutable` recursively freezes all nested objects, arrays, and maps at type level.\n2. `EventHandlers` uses template literal key remapping to generate type-safe listener methods.\n3. Guarantees 100% type inference without runtime overhead.",
            expectedOutput: "TypeScript compiler verifies deep immutability and event listener signature generation.",
            commonMistakes: "Creating infinite recursion in recursive mapped types without checking for primitive base cases.",
            bestPractices: "Leverage standard built-in utility types (`ReturnType`, `Parameters`, `Awaited`) before writing custom metaprogramming utilities.",
            practiceTask: "Implement a generic `DeepPartial<T>` type utility that makes all nested object properties optional.",
            keyTakeaway: "Conditional and mapped types allow writing expressive, self-documenting code with zero runtime performance cost."
          }
        ],
        practicalExercise: "Implement a type-safe generic Event Bus with automatic payload extraction using `infer` and key remapping for strongly-typed pub/sub messaging.",
        competencyVerification: "Demonstrates advanced TypeScript metaprogramming, conditional types, infer extraction, and mapped types at Level 4.",
        resources: [
          {
            title: "TypeScript Official Handbook: Conditional Types & infer",
            url: "https://www.typescriptlang.org/docs/handbook/2/conditional-types.html",
            description: "Conditional type syntax, distributive conditional types, and inferring within conditional types.",
            type: "documentation",
            provider: "Microsoft TypeScript"
          },
          {
            title: "TypeScript Handbook: Mapped Types & Template Literals",
            url: "https://www.typescriptlang.org/docs/handbook/2/mapped-types.html",
            description: "Key remapping with as, modifiers (+readonly, -optional), and template literal type generation.",
            type: "documentation",
            provider: "Microsoft TypeScript"
          }
        ]
      }
    },
    {
      id: "ts-mod-9",
      order: 9,
      title: "Module 9 — Type-Safe Application Architecture, Decorators & Compiler Optimization",
      durationMinutes: 150,
      summary: "Strict tsconfig configurations, branded/nominal typing, runtime schema validation with Zod, TC39 Stage 3 decorators, and build performance optimization.",
      learningObjectives: [
        "Configure strict tsconfig compiler flags (exactOptionalPropertyTypes, noUncheckedIndexedAccess).",
        "Implement Nominal/Branded types to prevent primitive obsession bugs.",
        "Integrate Zod schema parsing for end-to-end runtime-to-compile-time type safety."
      ],
      resources: [
        {
          title: "TypeScript TSConfig Reference Documentation",
          url: "https://www.typescriptlang.org/tsconfig",
          description: "Comprehensive guide to compiler flags: strict, noImplicitAny, noUncheckedIndexedAccess, and target outputs.",
          type: "documentation",
          provider: "Microsoft TypeScript"
        },
        {
          title: "Zod: TypeScript-First Schema Validation with Static Type Inference",
          url: "https://zod.dev/",
          description: "Parsing API payloads, generating inferred types with z.infer, and runtime validation.",
          type: "documentation",
          provider: "Zod"
        }
      ],
      content: {
        overview: "TypeScript types disappear at runtime. Building production-grade applications requires uniting compile-time type checking with runtime schema validation (Zod) and branded types to prevent logic errors.",
        keyConcepts: [
          {
            section: "Section 1 — Runtime Validation & Branded Types",
            topic: "Zod Schemas & Nominal Typing",
            title: "Lesson 1 — Branded Types & Runtime Schema Validation with Zod",
            prerequisites: "Modules 7 and 8 (TypeScript Foundations & Generics).",
            description: "How to use branded types (nominal typing) to distinguish primitive values (e.g., UserId vs OrderId) and use Zod to validate untrusted incoming HTTP payloads safely.",
            whyItMatters: "TypeScript uses structural typing: a `string` is a `string`. Branded types prevent passing an `OrderId` to a function expecting a `UserId`.",
            howItWorks: "Branded types attach a unique phantom brand symbol at compile time. Zod parses JSON payloads at runtime and automatically infers exact TypeScript types (`z.infer<typeof schema>`).",
            stepByStep: [
              "Step 1: Declare branded type helper: `type Brand<K, T> = K & { readonly __brand: T };`.",
              "Step 2: Define specific entity IDs (`type UserId = Brand<string, 'UserId'>`).",
              "Step 3: Define runtime Zod validation schema.",
              "Step 4: Parse external data with `schema.safeParse(jsonPayload)`."
            ],
            workedExample: "Branded Type Safety:\n```typescript\ntype UserId = string & { readonly __brand: unique symbol };\ntype OrderId = string & { readonly __brand: unique symbol };\n\nfunction cancelOrder(orderId: OrderId) { /* ... */ }\nconst user = 'USR_101' as UserId;\n// cancelOrder(user); -> Compile error: Type 'UserId' is not assignable to type 'OrderId'\n```",
            realWorldUsage: "Enterprise microservice API validation, financial transactions, and secure identity management.",
            codeSnippet: "// Branded Types & Zod Runtime-to-Compile-Time Type Safety\n\n// 1. Nominal Branded Type Utilities\ndeclare const BrandSymbol: unique symbol;\nexport type Branded<T, Brand> = T & { readonly [BrandSymbol]: Brand };\n\nexport type UserId = Branded<string, 'UserId'>;\nexport type EmailAddress = Branded<string, 'EmailAddress'>;\n\n// 2. Runtime Schema Definition (Simulating Zod / Typebox Pattern)\nexport interface ValidatedUserPayload {\n  id: UserId;\n  email: EmailAddress;\n  role: 'admin' | 'user';\n  createdAt: Date;\n}\n\nexport function validateAndSanitizeUser(rawInput: unknown): ValidatedUserPayload {\n  if (typeof rawInput !== 'object' || rawInput === null) {\n    throw new Error('Invalid payload: Expected an object');\n  }\n  const data = rawInput as Record<string, unknown>;\n  if (typeof data.id !== 'string' || !data.id.startsWith('USR_')) {\n    throw new Error('Invalid UserId format');\n  }\n  if (typeof data.email !== 'string' || !data.email.includes('@')) {\n    throw new Error('Invalid Email format');\n  }\n\n  return {\n    id: data.id as UserId,\n    email: data.email as EmailAddress,\n    role: data.role === 'admin' ? 'admin' : 'user',\n    createdAt: new Date()\n  };\n}\n\nconst valid = validateAndSanitizeUser({ id: 'USR_9021', email: 'dev@enterprise.com', role: 'admin' });\nconsole.log(`Validated user: ${valid.id} [${valid.email}]`);",
            codeExplanation: "1. Creates branded types that prevent mixing up incompatible IDs.\n2. Performs runtime validation and narrows untrusted data to type-safe records.\n3. Guarantees 100% type correctness at both compile time and runtime.",
            expectedOutput: "Validated user: USR_9021 [dev@enterprise.com]",
            commonMistakes: "Relying purely on TypeScript interfaces for incoming network data without runtime schema validation.",
            bestPractices: "Always validate boundary inputs (HTTP request bodies, environment variables, localStorage) with Zod schemas.",
            practiceTask: "Create a Zod schema validating an e-commerce checkout payload and generate inferred TypeScript interfaces.",
            keyTakeaway: "Combining TypeScript static types with runtime Zod validation and branded types guarantees end-to-end data integrity."
          }
        ],
        practicalExercise: "Build an end-to-end type-safe API validator using Zod and branded types, enforcing strict nominal IDs and schema transformation.",
        competencyVerification: "Demonstrates enterprise TypeScript application architecture, nominal branded typing, and runtime validation at Level 4.",
        resources: [
          {
            title: "TypeScript TSConfig Reference Documentation",
            url: "https://www.typescriptlang.org/tsconfig",
            description: "Comprehensive guide to compiler flags: strict, noImplicitAny, noUncheckedIndexedAccess, and target outputs.",
            type: "documentation",
            provider: "Microsoft TypeScript"
          },
          {
            title: "Zod: TypeScript-First Schema Validation with Static Type Inference",
            url: "https://zod.dev/",
            description: "Parsing API payloads, generating inferred types with z.infer, and runtime validation.",
            type: "documentation",
            provider: "Zod"
          }
        ]
      }
    }
  ]
};
