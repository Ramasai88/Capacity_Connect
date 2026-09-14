import { CourseCurriculum } from "./types";

export const courseRct401: CourseCurriculum = {
  courseId: "course-rct-401",
  totalDurationMinutes: 1600,
  modules: [
    {
      id: "rct-mod-1",
      order: 1,
      title: "Module 1 — React Component Lifecycle, JSX & The Virtual DOM / Fiber Architecture",
      durationMinutes: 160,
      summary: "React reconciliation algorithm, Fiber tree architecture, work loop, concurrent rendering, and JSX compilation mechanics.",
      learningObjectives: [
        "Explain React Fiber reconciliation: Render Phase (interruptible) vs Commit Phase (synchronous).",
        "Trace component lifecycle, render triggers, and DOM mutation batches.",
        "Differentiate React elements from DOM nodes and describe Fiber node structures."
      ],
      resources: [
        {
          title: "React Official Documentation: Describing the UI & Rendering Lifecycle",
          url: "https://react.dev/learn/describing-the-ui",
          description: "Official guide on JSX syntax, pure components, and how React renders components into the DOM.",
          type: "documentation",
          provider: "React Documentation"
        },
        {
          title: "A Deep Dive into React Fiber Architecture",
          url: "https://github.com/acdlite/react-fiber-architecture",
          description: "Andrew Clark's canonical architecture document explaining the Fiber reconciliation engine.",
          type: "specification",
          provider: "React Core Architecture"
        }
      ],
      content: {
        overview: "React uses a virtual Fiber reconciliation tree to manage rendering lifecycles. Fiber divides work into an interruptible Render phase and a synchronous Commit phase, enabling smooth concurrent UI updates without blocking the browser main thread.",
        keyConcepts: [
          {
            section: "Section 1 — Fiber Reconciliation & Rendering",
            topic: "React Fiber & JSX Mechanics",
            title: "Lesson 1 — React Fiber Architecture, Reconciliation & Pure Component Mechanics",
            prerequisites: "Modern JavaScript (ES6+), DOM tree structure, and basic TypeScript.",
            description: "How JSX compiles to `jsx()` calls, how the Fiber tree builds work-in-progress alternate trees, and why pure component rendering guarantees predictable UI state.",
            whyItMatters: "Understanding that re-renders are triggered by state/prop identity changes prevents unnecessary render waterfalls and UI stutter.",
            howItWorks: "State mutations schedule work on the Fiber root. The Work Loop traverses Fiber nodes via `child`, `sibling`, and `return` pointers, diffing props and scheduling DOM mutations for the Commit phase.",
            stepByStep: [
              "Step 1: Write pure component functions returning JSX element descriptions.",
              "Step 2: React compiles JSX to `_jsx(Component, props)` element objects.",
              "Step 3: Render phase reconciles the new element tree with the current Fiber tree.",
              "Step 4: Commit phase applies calculated DOM mutations and triggers layout effects."
            ],
            workedExample: "Pure Component Pattern:\n```tsx\ninterface CardProps { title: string; count: number; }\nexport function MetricCard({ title, count }: CardProps) {\n  return (\n    <div className=\"p-4 rounded-lg bg-slate-900 border border-slate-800\">\n      <h4 className=\"text-xs font-semibold text-slate-400\">{title}</h4>\n      <p className=\"text-2xl font-bold text-white mt-1\">{count.toLocaleString()}</p>\n    </div>\n  );\n}\n```",
            realWorldUsage: "Core UI rendering model for all modern enterprise React and Next.js applications.",
            codeSnippet: "// React Fiber Component Architecture (TypeScript / TSX)\nimport React from 'react';\n\nexport interface PerformanceMetricProps {\n  readonly metricKey: string;\n  readonly value: number;\n  readonly threshold: number;\n}\n\nexport const PerformanceMetric: React.FC<PerformanceMetricProps> = ({\n  metricKey,\n  value,\n  threshold\n}) => {\n  const isExceeded = value > threshold;\n  const formattedValue = value.toFixed(2);\n\n  return (\n    <div className=\"flex items-center justify-between p-3 border rounded-md\">\n      <span className=\"font-medium text-sm text-slate-700\">{metricKey}</span>\n      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${isExceeded ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>\n        {formattedValue} ms {isExceeded ? '(High Latency)' : '(Optimal)'}\n      </span>\n    </div>\n  );\n};",
            codeExplanation: "1. Follows pure component contract: returns deterministic JSX given immutable props.\n2. Computes derived display values during render phase without side-effects.\n3. Encapsulates status styling cleanly with conditional CSS classes.",
            expectedOutput: "Renders accessible, styled metric badge indicating latency threshold adherence.",
            commonMistakes: "Mutating props or global variables inside the render function body, causing non-deterministic render bugs in Concurrent Mode.",
            bestPractices: "Keep component render functions strictly pure: given the same props and state, they must return the exact same JSX.",
            practiceTask: "Create a pure React component that renders a collapsible diagnostic log tree with type-safe prop contracts.",
            keyTakeaway: "React Fiber separates rendering into an interruptible calculation phase and a synchronous commit phase for smooth 60fps UI performance."
          }
        ],
        practicalExercise: "Build a set of type-safe, pure React UI components that render real-time telemetry metrics with strict immutability and zero render-phase side effects.",
        competencyVerification: "Demonstrates understanding of React Fiber reconciliation, pure component architecture, and JSX compilation at Level 4.",
        resources: [
          {
            title: "React Official Documentation: Describing the UI & Rendering Lifecycle",
            url: "https://react.dev/learn/describing-the-ui",
            description: "Official guide on JSX syntax, pure components, and how React renders components into the DOM.",
            type: "documentation",
            provider: "React Core Team"
          },
          {
            title: "A Deep Dive into React Fiber Architecture",
            url: "https://github.com/acdlite/react-fiber-architecture",
            description: "Andrew Clark's canonical architecture document explaining the Fiber reconciliation engine.",
            type: "specification",
            provider: "React Core Architecture"
          }
        ]
      }
    },
    {
      id: "rct-mod-2",
      order: 2,
      title: "Module 2 — State Management with useState, useReducer & Immutable State Updates",
      durationMinutes: 160,
      summary: "React state snapshots, batching mechanics, useState updater functions, complex state machines with useReducer, and immutable update patterns.",
      learningObjectives: [
        "Explain React state snapshots and automatic batching across event handlers and async callbacks.",
        "Model complex multi-field state machines using useReducer and discriminated action unions.",
        "Perform safe immutable updates for nested objects and arrays."
      ],
      resources: [
        {
          title: "React Documentation: Managing State with useReducer",
          url: "https://react.dev/learn/extracting-state-logic-into-a-reducer",
          description: "Consolidating state logic, writing clean reducers, and comparing useState vs useReducer.",
          type: "documentation",
          provider: "React Core Team"
        },
        {
          title: "React Documentation: Updating Objects and Arrays in State",
          url: "https://react.dev/learn/updating-objects-in-state",
          description: "Treating state as read-only, spreading objects, and updating nested array structures.",
          type: "guide",
          provider: "React Core Team"
        }
      ],
      content: {
        overview: "State in React behaves like a snapshot: updating state schedules a new render with updated state values. Using useReducer with discriminated unions allows developers to manage complex, multi-step business logic cleanly.",
        keyConcepts: [
          {
            section: "Section 1 — Reducers & Immutable State",
            topic: "useReducer Architecture",
            title: "Lesson 1 — Complex Component State Machines with useReducer & Type-Safe Actions",
            prerequisites: "Module 1 (Component Lifecycle) and TypeScript Discriminated Unions.",
            description: "How to extract complex component state transitions into a pure reducer function, handle state mutations immutably, and type actions with discriminated unions.",
            whyItMatters: "Scattering multiple `useState` calls across a component leads to out-of-sync state states. `useReducer` centralizes state mutations into a predictable, testable state machine.",
            howItWorks: "The component dispatches an action `{ type: 'ADD_ITEM', payload: item }`. The pure reducer function takes `(state, action)` and returns the brand new state object.",
            stepByStep: [
              "Step 1: Define TypeScript interface for state shape.",
              "Step 2: Define Discriminated Union for all valid Action types.",
              "Step 3: Implement pure reducer switch statement with default branch.",
              "Step 4: Initialize component with `const [state, dispatch] = useReducer(reducer, initialState)`."
            ],
            workedExample: "Type-Safe Reducer Pattern:\n```tsx\ntype FilterAction =\n  | { type: 'SET_SEARCH'; query: string }\n  | { type: 'TOGGLE_STATUS'; status: 'active' | 'archived' }\n  | { type: 'RESET' };\n```",
            realWorldUsage: "Complex filter panels, multi-step checkout forms, data table pagination/sorting.",
            codeSnippet: "// Type-Safe useReducer State Machine for Data Table Filter\nimport React, { useReducer } from 'react';\n\nexport interface FilterState {\n  readonly searchQuery: string;\n  readonly selectedRole: string | null;\n  readonly page: number;\n  readonly pageSize: number;\n}\n\nexport type FilterAction =\n  | { type: 'SET_QUERY'; payload: string }\n  | { type: 'SET_ROLE'; payload: string | null }\n  | { type: 'SET_PAGE'; payload: number }\n  | { type: 'RESET' };\n\nconst initialFilterState: FilterState = {\n  searchQuery: '',\n  selectedRole: null,\n  page: 1,\n  pageSize: 20\n};\n\nexport function filterReducer(state: FilterState, action: FilterAction): FilterState {\n  switch (action.type) {\n    case 'SET_QUERY':\n      return { ...state, searchQuery: action.payload, page: 1 }; // Reset page on new search\n    case 'SET_ROLE':\n      return { ...state, selectedRole: action.payload, page: 1 };\n    case 'SET_PAGE':\n      return { ...state, page: action.payload };\n    case 'RESET':\n      return initialFilterState;\n    default:\n      return state;\n  }\n}\n\nexport const DataTableFilterController: React.FC = () => {\n  const [state, dispatch] = useReducer(filterReducer, initialFilterState);\n\n  return (\n    <div className=\"p-4 bg-white shadow rounded-lg flex gap-4\">\n      <input\n        type=\"text\"\n        value={state.searchQuery}\n        onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}\n        placeholder=\"Search employees...\"\n        className=\"border p-2 rounded w-full\"\n      />\n      <button onClick={() => dispatch({ type: 'RESET' })} className=\"px-4 py-2 bg-slate-200 rounded\">\n        Reset\n      </button>\n    </div>\n  );\n};",
            codeExplanation: "1. Defines strict readonly state shape and discriminated union actions.\n2. Reducer returns new state objects immutably using object spread.\n3. Automatically resets pagination when search query or role filter changes.",
            expectedOutput: "Component renders interactive search filter with synchronized state updates.",
            commonMistakes: "Directly mutating state objects (`state.searchQuery = 'new'`) before returning, which fails React identity equality checks and skips re-renders.",
            bestPractices: "Always return new object references and test reducer functions in isolation using standard unit tests.",
            practiceTask: "Implement a reducer handling an order items shopping cart with actions for Add, Remove, UpdateQuantity, and Clear.",
            keyTakeaway: "useReducer decouples state transition logic from component rendering, providing deterministic state machines."
          }
        ],
        practicalExercise: "Build an interactive data table filtering and pagination controller using useReducer with discriminated actions and unit test all state transitions.",
        competencyVerification: "Demonstrates advanced React state management, useReducer state machines, and immutable data modeling at Level 4.",
        resources: [
          {
            title: "React Documentation: Managing State with useReducer",
            url: "https://react.dev/learn/extracting-state-logic-into-a-reducer",
            description: "Consolidating state logic, writing clean reducers, and comparing useState vs useReducer.",
            type: "documentation",
            provider: "React Core Team"
          },
          {
            title: "React Documentation: Updating Objects and Arrays in State",
            url: "https://react.dev/learn/updating-objects-in-state",
            description: "Treating state as read-only, spreading objects, and updating nested array structures.",
            type: "guide",
            provider: "React Core Team"
          }
        ]
      }
    },
    {
      id: "rct-mod-3",
      order: 3,
      title: "Module 3 — Side Effects with useEffect, useLayoutEffect & Lifecycle Cleanup",
      durationMinutes: 160,
      summary: "Synchronizing with external systems using useEffect, dependency array rules, cleanup functions, preventing race conditions with AbortController, and useLayoutEffect.",
      learningObjectives: [
        "Structure useEffect hooks to synchronize with external APIs, websockets, and DOM listeners.",
        "Implement robust cleanup functions to prevent memory leaks and unmounted component state updates.",
        "Use AbortController to cancel stale in-flight HTTP requests and eliminate race conditions."
      ],
      resources: [
        {
          title: "React Documentation: Synchronizing with Effects",
          url: "https://react.dev/learn/synchronizing-with-effects",
          description: "Declaring effects, specifying dependencies, and understanding effect lifecycles.",
          type: "documentation",
          provider: "React Core Team"
        },
        {
          title: "React Documentation: You Might Not Need an Effect",
          url: "https://react.dev/learn/you-might-not-need-an-effect",
          description: "Transforming data without effects, handling user events, and optimizing rendering.",
          type: "guide",
          provider: "React Core Team"
        }
      ],
      content: {
        overview: "useEffect is an escape hatch for synchronizing components with external systems (network, DOM subscriptions, timers). Mastering effect dependencies and cleanup functions prevents race conditions and memory leaks.",
        keyConcepts: [
          {
            section: "Section 1 — Effects & Cleanup",
            topic: "useEffect & AbortController",
            title: "Lesson 1 — Network Synchronization, Race Conditions & Cleanup with AbortController",
            prerequisites: "Module 2 (State Management) and Fetch API.",
            description: "How to fetch data safely inside useEffect, use AbortController to cancel stale requests when dependencies change, and ensure proper cleanup on component unmount.",
            whyItMatters: "Fast typing in a search input without request cancellation causes race conditions where an earlier slow request overwrites a newer fast response.",
            howItWorks: "When the effect re-runs or the component unmounts, React first executes the cleanup function returned by the previous effect instance.",
            stepByStep: [
              "Step 1: Declare `const controller = new AbortController()` inside effect.",
              "Step 2: Pass `{ signal: controller.signal }` to fetch.",
              "Step 3: Return cleanup function: `return () => controller.abort()`.",
              "Step 4: Catch `DOMException: AbortError` gracefully to ignore aborted requests."
            ],
            workedExample: "Cancellable Fetch Pattern:\n```tsx\nuseEffect(() => {\n  const controller = new AbortController();\n  fetchData(query, controller.signal).then(setData).catch(err => {\n    if (err.name !== 'AbortError') setError(err);\n  });\n  return () => controller.abort();\n}, [query]);\n```",
            realWorldUsage: "Search autocompletes, live dashboard widgets, websocket subscriptions.",
            codeSnippet: "// Type-Safe Network Sync Hook with AbortController Cleanup\nimport { useState, useEffect } from 'react';\n\nexport interface FetchResult<T> {\n  data: T | null;\n  isLoading: boolean;\n  error: string | null;\n}\n\nexport function useCancellableQuery<T>(url: string | null): FetchResult<T> {\n  const [data, setData] = useState<T | null>(null);\n  const [isLoading, setIsLoading] = useState<boolean>(Boolean(url));\n  const [error, setError] = useState<string | null>(null);\n\n  useEffect(() => {\n    if (!url) {\n      setData(null);\n      setIsLoading(false);\n      return;\n    }\n\n    const controller = new AbortController();\n    setIsLoading(true);\n    setError(null);\n\n    fetch(url, { signal: controller.signal })\n      .then(async (res) => {\n        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);\n        return res.json() as Promise<T>;\n      })\n      .then((payload) => {\n        setData(payload);\n        setIsLoading(false);\n      })\n      .catch((err: Error) => {\n        if (err.name === 'AbortError') return; // Ignore intentional abort\n        setError(err.message);\n        setIsLoading(false);\n      });\n\n    // Cleanup executes before next effect run or on unmount\n    return () => {\n      controller.abort();\n    };\n  }, [url]);\n\n  return { data, isLoading, error };\n}",
            codeExplanation: "1. Creates fresh AbortController per effect invocation.\n2. Aborts active fetch if `url` changes before previous request resolves.\n3. Prevents state updates on unmounted components.",
            expectedOutput: "Smoothly cancels stale network requests without memory leaks or race conditions.",
            commonMistakes: "Omitting variables used inside the effect from the dependency array, causing stale closure bugs.",
            bestPractices: "Always include all referenced reactive values in dependencies and return an explicit cleanup function for subscriptions and network calls.",
            practiceTask: "Create an effect hook that subscribes to window resize events with a debounced listener and cleans up on unmount.",
            keyTakeaway: "useEffect cleanup functions and AbortController guarantee deterministic, race-condition-free external synchronization."
          }
        ],
        practicalExercise: "Build a real-time auto-complete search widget using useEffect and AbortController that cancels pending requests on keystroke changes and handles debounced network latency.",
        competencyVerification: "Demonstrates mastery of useEffect synchronization, cleanup lifecycles, and network race condition prevention at Level 4.",
        resources: [
          {
            title: "React Documentation: Synchronizing with Effects",
            url: "https://react.dev/learn/synchronizing-with-effects",
            description: "Declaring effects, specifying dependencies, and understanding effect lifecycles.",
            type: "documentation",
            provider: "React Core Team"
          },
          {
            title: "React Documentation: You Might Not Need an Effect",
            url: "https://react.dev/learn/you-might-not-need-an-effect",
            description: "Transforming data without effects, handling user events, and optimizing rendering.",
            type: "guide",
            provider: "React Core Team"
          }
        ]
      }
    },
    {
      id: "rct-mod-4",
      order: 4,
      title: "Module 4 — Custom React Hooks & Headless UI State Architecture",
      durationMinutes: 160,
      summary: "Designing reusable custom hooks, extracting stateful logic, headless UI patterns (inversion of control), and TypeScript generics in hook design.",
      learningObjectives: [
        "Author composable custom hooks encapsulating stateful business logic.",
        "Implement headless UI patterns separating interaction logic from visual presentation.",
        "Type custom hooks with TypeScript generics and inferred return tuples/objects."
      ],
      resources: [
        {
          title: "React Documentation: Reusing Logic with Custom Hooks",
          url: "https://react.dev/learn/reusing-logic-with-custom-hooks",
          description: "When to extract custom hooks, hook naming conventions, and sharing logic between components.",
          type: "documentation",
          provider: "React Core Team"
        },
        {
          title: "Kent C. Dodds: The State Reducer Pattern with React Hooks",
          url: "https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks",
          description: "Headless UI architecture, prop getters, and inversion of control in React custom hooks.",
          type: "article",
          provider: "Kent C. Dodds"
        }
      ],
      content: {
        overview: "Custom hooks allow developers to extract stateful component logic into reusable functions. Headless UI design patterns separate behavior, accessibility, and state from styling, allowing design systems to scale across multiple apps.",
        keyConcepts: [
          {
            section: "Section 1 — Custom Hooks & Headless Patterns",
            topic: "Headless Hook Architecture",
            title: "Lesson 1 — Designing Headless UI Hooks with Prop Getters",
            prerequisites: "Modules 2 and 3 (State & Effects).",
            description: "How to build headless custom hooks that manage accessibility attributes (ARIA), keyboard navigation, and open/close state, returning prop getters for maximum UI flexibility.",
            whyItMatters: "Hardcoding UI markup inside complex logic components prevents design customization. Headless hooks provide complete styling freedom while preserving complex interaction logic.",
            howItWorks: "The custom hook manages state internally and exports `getToggleProps()` and `getMenuProps()` functions that spread required ARIA attributes onto any user-provided JSX element.",
            stepByStep: [
              "Step 1: Identify stateful behavior (e.g., disclosure/dropdown open state, focus index).",
              "Step 2: Encapsulate state, keyboard listeners, and toggle handlers in custom hook.",
              "Step 3: Provide prop-getter functions that merge internal event handlers with consumer handlers.",
              "Step 4: Return state and prop getters as a strongly-typed object."
            ],
            workedExample: "Headless Disclosure Hook Usage:\n```tsx\nconst { isOpen, getToggleButtonProps, getPanelProps } = useDisclosure();\nreturn (\n  <div>\n    <button {...getToggleButtonProps()}>Toggle Menu</button>\n    <div {...getPanelProps()}>{isOpen && <p>Menu Content</p>}</div>\n  </div>\n);\n```",
            realWorldUsage: "Core pattern behind Radix UI, Headless UI, React Aria, and TanStack Table.",
            codeSnippet: "// Headless Dropdown Custom Hook with Prop Getters (TypeScript)\nimport { useState, useCallback, KeyboardEvent } from 'react';\n\nexport interface UseDropdownOptions {\n  defaultOpen?: boolean;\n  onOpenChange?: (isOpen: boolean) => void;\n}\n\nexport function useDropdown({ defaultOpen = false, onOpenChange }: UseDropdownOptions = {}) {\n  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);\n\n  const toggle = useCallback(() => {\n    setIsOpen((prev) => {\n      const next = !prev;\n      onOpenChange?.(next);\n      return next;\n    });\n  }, [onOpenChange]);\n\n  const getTriggerProps = useCallback(() => ({\n    'aria-expanded': isOpen,\n    'aria-haspopup': true as const,\n    onClick: toggle,\n    onKeyDown: (e: KeyboardEvent) => {\n      if (e.key === 'Escape' && isOpen) toggle();\n    }\n  }), [isOpen, toggle]);\n\n  const getMenuProps = useCallback(() => ({\n    role: 'menu' as const,\n    hidden: !isOpen,\n    'aria-hidden': !isOpen\n  }), [isOpen]);\n\n  return { isOpen, toggle, getTriggerProps, getMenuProps };\n}",
            codeExplanation: "1. Encapsulates ARIA accessibility and keyboard shortcut logic.\n2. Exposes `getTriggerProps` and `getMenuProps` to attach accessible attributes to any element.\n3. Guarantees complete separation between state logic and styling.",
            expectedOutput: "Custom hook provides headless dropdown state and accessible ARIA attributes.",
            commonMistakes: "Calling hooks conditionally or inside loops, violating the fundamental Rules of Hooks.",
            bestPractices: "Always prefix custom hook names with `use` and return prop getters for extensible headless component architectures.",
            practiceTask: "Build a `usePagination` custom hook that calculates page ranges, next/prev handlers, and boundary constraints.",
            keyTakeaway: "Headless custom hooks enable extreme reusability by separating interaction logic from visual presentation."
          }
        ],
        practicalExercise: "Design and implement a reusable headless `useCombobox` custom hook with full keyboard navigation (Up, Down, Enter, Escape) and ARIA attributes.",
        competencyVerification: "Demonstrates headless UI architecture, custom hook composition, and accessible component state modeling at Level 4.",
        resources: [
          {
            title: "React Documentation: Reusing Logic with Custom Hooks",
            url: "https://react.dev/learn/reusing-logic-with-custom-hooks",
            description: "When to extract custom hooks, hook naming conventions, and sharing logic between components.",
            type: "documentation",
            provider: "React Core Team"
          },
          {
            title: "Kent C. Dodds: The State Reducer Pattern with React Hooks",
            url: "https://kentcdodds.com/blog/the-state-reducer-pattern-with-react-hooks",
            description: "Headless UI architecture, prop getters, and inversion of control in React custom hooks.",
            type: "article",
            provider: "Kent C. Dodds"
          }
        ]
      }
    },
    {
      id: "rct-mod-5",
      order: 5,
      title: "Module 5 — React Context API, Zustand & Atomic State Management",
      durationMinutes: 160,
      summary: "Global state trade-offs, React Context performance (preventing re-render cascading), Zustand store creation, selectors, and atomic state.",
      learningObjectives: [
        "Evaluate trade-offs between React Context, Zustand, and Atomic state management.",
        "Prevent context re-render thrashing using selector subscriptions.",
        "Implement persistent global stores with Zustand middleware."
      ],
      resources: [
        {
          title: "Zustand Documentation: Small, Fast and Scalable Bearbones State Management",
          url: "https://zustand-demo.pmnd.rs/",
          description: "Creating stores, writing selectors, middleware (persist, devtools), and async actions.",
          type: "documentation",
          provider: "Poimandres / Zustand"
        },
        {
          title: "React Documentation: Passing Data Deeply with Context",
          url: "https://react.dev/learn/passing-data-deeply-with-context",
          description: "Context creation, useContext hook, and optimizing context provider hierarchies.",
          type: "documentation",
          provider: "React Core Team"
        }
      ],
      content: {
        overview: "While React Context is excellent for low-frequency global data (theming, current user), high-frequency state updates cause all consuming components to re-render. Zustand uses external store subscriptions with fine-grained selectors to re-render only the components whose subscribed data changed.",
        keyConcepts: [
          {
            section: "Section 1 — Global State & Zustand",
            topic: "Zustand Store & Selectors",
            title: "Lesson 1 — High-Performance Global State with Zustand & Atomic Selectors",
            prerequisites: "Module 4 (Custom Hooks) and TypeScript.",
            description: "How to create a type-safe Zustand store, write atomic selector hooks to eliminate unnecessary re-renders, and integrate persistence middleware.",
            whyItMatters: "A React Context update re-renders every component calling `useContext()`. Zustand uses `useSyncExternalStore` so components only re-render if their selected slice changes.",
            howItWorks: "Zustand stores live outside the React Fiber tree in a vanilla JavaScript closure. Components subscribe to specific properties using selectors: `useStore(state => state.activeOrgId)`.",
            stepByStep: [
              "Step 1: Define state interface with data fields and action functions.",
              "Step 2: Create store using `create<State>()((set) => ({ ... }))`.",
              "Step 3: Consume in components with specific atomic selectors.",
              "Step 4: Add `devtools` and `persist` middleware for debugging and localStorage sync."
            ],
            workedExample: "Atomic Selector Pattern:\n```tsx\n// Only re-renders when `unreadCount` changes, ignoring other store updates\nconst unreadCount = useNotificationStore(state => state.unreadCount);\n```",
            realWorldUsage: "Enterprise dashboard application state, authentication tokens, and user settings.",
            codeSnippet: "// Type-Safe Global State Store with Zustand\nimport { create } from 'zustand';\n\nexport interface OrganizationSessionState {\n  readonly currentOrgId: string | null;\n  readonly userRole: 'ADMIN' | 'EMPLOYEE' | 'MANAGER' | null;\n  readonly activeNotifications: number;\n  setOrganization: (orgId: string, role: 'ADMIN' | 'EMPLOYEE' | 'MANAGER') => void;\n  incrementNotifications: () => void;\n  clearSession: () => void;\n}\n\nexport const useOrganizationStore = create<OrganizationSessionState>()((set) => ({\n  currentOrgId: 'ORG_ACME_CORP',\n  userRole: 'EMPLOYEE',\n  activeNotifications: 3,\n  setOrganization: (orgId, role) => set({ currentOrgId: orgId, userRole: role }),\n  incrementNotifications: () => set((state) => ({ activeNotifications: state.activeNotifications + 1 })),\n  clearSession: () => set({ currentOrgId: null, userRole: null, activeNotifications: 0 })\n}));\n\n// Selective consumer component\nexport const NotificationBadge: React.FC = () => {\n  // Atomic selector: only re-renders when activeNotifications changes\n  const count = useOrganizationStore((s) => s.activeNotifications);\n  return <span className=\"badge bg-indigo-600 text-white px-2 py-0.5 rounded-full\">{count}</span>;\n};",
            codeExplanation: "1. Creates strongly-typed Zustand global store with encapsulated actions.\n2. Component subscribes only to `activeNotifications` property.\n3. Mutations to `currentOrgId` will NOT re-render `NotificationBadge`.",
            expectedOutput: "Renders notification badge with fine-grained subscription reactivity.",
            commonMistakes: "Calling `const state = useOrganizationStore()` without a selector, causing component to re-render on any store mutation.",
            bestPractices: "Always pass a selector function `useStore(s => s.property)` to prevent re-render cascades.",
            practiceTask: "Build a theme and sidebar collapse store with Zustand that persists preferences to localStorage.",
            keyTakeaway: "Zustand provides boilerplate-free global state with fine-grained selector subscriptions that eliminate unnecessary re-renders."
          }
        ],
        practicalExercise: "Build an enterprise multi-tenant session and notification store using Zustand with atomic selectors and local storage persistence middleware.",
        competencyVerification: "Demonstrates global state architecture, selector optimization, and Zustand store engineering at Level 4.",
        resources: [
          {
            title: "Zustand Documentation: Small, Fast and Scalable Bearbones State Management",
            url: "https://zustand-demo.pmnd.rs/",
            description: "Creating stores, writing selectors, middleware (persist, devtools), and async actions.",
            type: "documentation",
            provider: "Poimandres / Zustand"
          },
          {
            title: "React Documentation: Passing Data Deeply with Context",
            url: "https://react.dev/learn/passing-data-deeply-with-context",
            description: "Context creation, useContext hook, and optimizing context provider hierarchies.",
            type: "documentation",
            provider: "React Core Team"
          }
        ]
      }
    },
    {
      id: "rct-mod-6",
      order: 6,
      title: "Module 6 — Next.js App Router Architecture & React Server Components (RSC)",
      durationMinutes: 160,
      summary: "App Router directory hierarchy, Server Components vs Client Components ('use client'), async data fetching at the component level, streaming SSR, and Suspense boundaries.",
      learningObjectives: [
        "Architect Next.js applications using the App Router hierarchy (layout, page, loading, error).",
        "Differentiate React Server Components (zero bundle size) from Client Components ('use client').",
        "Implement streaming server rendering with React Suspense boundaries."
      ],
      resources: [
        {
          title: "Next.js Documentation: App Router Architecture & Server Components",
          url: "https://nextjs.org/docs/app/building-your-application/rendering/server-components",
          description: "Server Components benefits, Client Components boundary rules, and data fetching.",
          type: "documentation",
          provider: "Vercel / Next.js"
        },
        {
          title: "React Documentation: React Server Components Specification",
          url: "https://react.dev/reference/rsc/server-components",
          description: "Asynchronous component rendering on the server and serializable props passing.",
          type: "specification",
          provider: "React Core Team"
        }
      ],
      content: {
        overview: "Next.js App Router leverages React Server Components (RSC) by default. Server Components execute exclusively on the server, accessing databases directly and streaming HTML to the client with zero JavaScript bundle size.",
        keyConcepts: [
          {
            section: "Section 1 — RSC & App Router",
            topic: "Server vs Client Components",
            title: "Lesson 1 — React Server Components (RSC) & Streaming Suspense Boundaries",
            prerequisites: "React fundamentals and asynchronous programming.",
            description: "How Server Components fetch data directly from databases without API endpoints, how the `'use client'` boundary works, and how to stream UI with `<Suspense>`.",
            whyItMatters: "Client-side rendering downloads massive JavaScript bundles and causes waterfall loading spinners. RSC keeps heavy dependencies on the server and streams fast HTML.",
            howItWorks: "Server Components are async functions executing on Node.js/Edge runtimes. They serialize JSX and props into an RSC payload stream. Client Components handle interactivity on the client.",
            stepByStep: [
              "Step 1: Write async React Server Component accessing database directly.",
              "Step 2: Wrap slow data sections in `<Suspense fallback={<Skeleton />}>`.",
              "Step 3: Move interactive buttons/inputs to separate `'use client'` leaf components.",
              "Step 4: Pass server-fetched data down to Client Components as serializable props."
            ],
            workedExample: "Async Server Component with Suspense:\n```tsx\nexport default async function DashboardPage() {\n  return (\n    <main className=\"p-8\">\n      <h1>Executive Dashboard</h1>\n      <Suspense fallback={<TableSkeleton />}>\n        <AsyncMetricsTable />\n      </Suspense>\n    </main>\n  );\n}\n```",
            realWorldUsage: "Modern high-performance web applications built with Next.js 14 and 15.",
            codeSnippet: "// Next.js App Router: React Server Component with Direct DB Access & Suspense\nimport React, { Suspense } from 'react';\n\n// Simulated Database Query (Executes on Server Only)\nasync function fetchCapacityMetrics() {\n  // In real Next.js app: const data = await prisma.competency.findMany();\n  return [\n    { role: 'ML Engineer', capacityScore: 88, employees: 14 },\n    { role: 'Full Stack Dev', capacityScore: 92, employees: 28 }\n  ];\n}\n\n// Async Server Component (Zero Client JS Bundle)\nasync function MetricsSummary() {\n  const metrics = await fetchCapacityMetrics();\n\n  return (\n    <div className=\"grid grid-cols-2 gap-4 mt-4\">\n      {metrics.map((m) => (\n        <div key={m.role} className=\"p-4 border rounded-lg bg-slate-50\">\n          <h3 className=\"font-bold text-slate-800\">{m.role}</h3>\n          <p className=\"text-sm text-slate-600\">Capacity Index: {m.capacityScore}% ({m.employees} engineers)</p>\n        </div>\n      ))}\n    </div>\n  );\n}\n\nexport default function CapacityDashboardPage() {\n  return (\n    <div className=\"p-6 max-w-4xl mx-auto\">\n      <h1 className=\"text-2xl font-bold text-slate-900\">Workforce Capacity Overview</h1>\n      <Suspense fallback={<div className=\"p-4 animate-pulse bg-slate-200 rounded-lg mt-4\">Loading metrics...</div>}>\n        <MetricsSummary />\n      </Suspense>\n    </div>\n  );\n}",
            codeExplanation: "1. `MetricsSummary` is an async Server Component fetching directly on the server.\n2. Zero client-side JavaScript sent for database fetching logic.\n3. `<Suspense>` streams fallback UI instantly while data resolves.",
            expectedOutput: "Next.js streams initial page shell instantly and streams resolved metrics table as data arrives.",
            commonMistakes: "Placing `'use client'` at the top of a page route, forcing the entire sub-tree to become client-rendered and bloating bundle size.",
            bestPractices: "Keep `'use client'` at the lowest possible leaf components (buttons, modals, forms) and keep data-fetching components on the server.",
            practiceTask: "Build an App Router layout with a Server Component sidebar and Suspense-streamed main content area.",
            keyTakeaway: "React Server Components combine direct backend data access with zero client bundle overhead and streaming Suspense rendering."
          }
        ],
        practicalExercise: "Build an analytics dashboard page in Next.js App Router using async React Server Components, Suspense streaming boundaries, and interactive client filter components.",
        competencyVerification: "Demonstrates Next.js App Router architecture, Server Component data fetching, and Suspense streaming at Level 4.",
        resources: [
          {
            title: "Next.js Documentation: App Router Architecture & Server Components",
            url: "https://nextjs.org/docs/app/building-your-application/rendering/server-components",
            description: "Server Components benefits, Client Components boundary rules, and data fetching.",
            type: "documentation",
            provider: "Vercel / Next.js"
          },
          {
            title: "React Documentation: React Server Components Specification",
            url: "https://react.dev/reference/rsc/server-components",
            description: "Asynchronous component rendering on the server and serializable props passing.",
            type: "specification",
            provider: "React Core Team"
          }
        ]
      }
    },
    {
      id: "rct-mod-7",
      order: 7,
      title: "Module 7 — Next.js Server Actions, Route Handlers & Data Mutations",
      durationMinutes: 160,
      summary: "Mutating server state with Server Actions ('use server'), revalidatePath / revalidateTag cache purging, optimistic UI updates with useOptimistic, and API Route Handlers.",
      learningObjectives: [
        "Implement secure form submissions and mutations using Next.js Server Actions.",
        "Trigger targeted cache revalidation with revalidatePath and revalidateTag.",
        "Provide instant feedback for user interactions with useOptimistic."
      ],
      resources: [
        {
          title: "Next.js Documentation: Server Actions and Mutations",
          url: "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations",
          description: "Invoking server actions, form handling, error states, and revalidating cached data.",
          type: "documentation",
          provider: "Vercel / Next.js"
        },
        {
          title: "React Documentation: useOptimistic Hook Reference",
          url: "https://react.dev/reference/react/useOptimistic",
          description: "Optimistically updating the UI while an async server mutation is in flight.",
          type: "documentation",
          provider: "React Core Team"
        }
      ],
      content: {
        overview: "Server Actions allow client components and forms to invoke asynchronous server functions directly without writing boilerplate REST endpoints. Combined with `useOptimistic` and `revalidatePath`, applications achieve instantaneous UI responsiveness with server-side validation.",
        keyConcepts: [
          {
            section: "Section 1 — Server Actions & Cache Invalidation",
            topic: "Server Actions & useOptimistic",
            title: "Lesson 1 — Server Actions, Optimistic UI Updates & Cache Invalidation",
            prerequisites: "Module 6 (App Router & RSC).",
            description: "How to declare `'use server'` action functions, validate payloads with Zod, purge Next.js server cache via `revalidatePath()`, and render instant UI updates using `useOptimistic`.",
            whyItMatters: "Traditional API mutations require manual fetch handlers, loading states, and client cache invalidation. Server Actions provide end-to-end type safety and automated revalidation.",
            howItWorks: "Forms invoke the server action via `action={handleSubmit}`. Next.js dispatches an HTTP POST, runs server-side validation and database updates, and revalidates the specified page route in one roundtrip.",
            stepByStep: [
              "Step 1: Declare server action file with `'use server'` directive.",
              "Step 2: Validate incoming FormData or object payload with Zod.",
              "Step 3: Perform database mutation.",
              "Step 4: Call `revalidatePath('/dashboard')` to refresh server-rendered data.",
              "Step 5: Use `useOptimistic` in client component for instant UI feedback."
            ],
            workedExample: "Server Action Declaration:\n```typescript\n'use server';\nimport { revalidatePath } from 'next/cache';\nexport async function updateEmployeeRole(employeeId: string, newRole: string) {\n  // Database update...\n  revalidatePath('/organization/roles');\n  return { success: true };\n}\n```",
            realWorldUsage: "Form submissions, status toggles, profile editing, and e-commerce carts.",
            codeSnippet: "// Next.js Server Action and Optimistic UI Component\n// File: app/actions/competency-actions.ts\n'use server';\n\nexport interface ActionResponse {\n  success: boolean;\n  message: string;\n}\n\nexport async function assignCompetencyAction(\n  employeeId: string,\n  competencyCode: string\n): Promise<ActionResponse> {\n  // Server-side security check & database mutation\n  if (!employeeId || !competencyCode) {\n    return { success: false, message: 'Invalid employee or competency code' };\n  }\n\n  // Simulating Prisma mutation: await prisma.employeeCompetency.create(...);\n  console.log(`[Server Action] Assigned ${competencyCode} to employee ${employeeId}`);\n  \n  // revalidatePath('/employees/' + employeeId);\n  return { success: true, message: `Successfully assigned ${competencyCode}` };\n}",
            codeExplanation: "1. Uses `'use server'` to mark function as an executable backend RPC endpoint.\n2. Validates inputs and performs secure database mutation on server.\n3. Returns strongly-typed response to caller without manual API route setup.",
            expectedOutput: "[Server Action] Assigned COMP_TS_01 to employee USR_101",
            commonMistakes: "Passing sensitive server credentials to Server Actions from client components instead of accessing them inside the server closure.",
            bestPractices: "Always validate inputs defensively with Zod inside Server Actions and verify user authorization sessions.",
            practiceTask: "Create a Server Action that toggles an employee's onboarding step completion status and triggers path revalidation.",
            keyTakeaway: "Server Actions streamline data mutations by unifying server execution, security validation, and automatic cache revalidation."
          }
        ],
        practicalExercise: "Build an employee skill endorsement module using Next.js Server Actions with Zod payload validation, optimistic UI updates with useOptimistic, and cache revalidation.",
        competencyVerification: "Demonstrates Next.js Server Actions mastery, optimistic UI architecture, and cache revalidation at Level 4.",
        resources: [
          {
            title: "Next.js Documentation: Server Actions and Mutations",
            url: "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations",
            description: "Invoking server actions, form handling, error states, and revalidating cached data.",
            type: "documentation",
            provider: "Vercel / Next.js"
          },
          {
            title: "React Documentation: useOptimistic Hook Reference",
            url: "https://react.dev/reference/react/useOptimistic",
            description: "Optimistically updating the UI while an async server mutation is in flight.",
            type: "documentation",
            provider: "React Core Team"
          }
        ]
      }
    },
    {
      id: "rct-mod-8",
      order: 8,
      title: "Module 8 — Form Handling, Zod Schema Validation & React Hook Form",
      durationMinutes: 160,
      summary: "Controlled vs uncontrolled form inputs, React Hook Form performance, schema-based validation with Zod resolver, async field validation, and accessible error messages.",
      learningObjectives: [
        "Construct high-performance uncontrolled forms using React Hook Form.",
        "Integrate Zod schema validation using @hookform/resolvers/zod.",
        "Implement dynamic field arrays, async validations, and accessible ARIA error messaging."
      ],
      resources: [
        {
          title: "React Hook Form Documentation",
          url: "https://react-hook-form.com/get-started",
          description: "useForm hook, register, formState, Controller, and performance optimization.",
          type: "documentation",
          provider: "React Hook Form Team"
        },
        {
          title: "Zod: Schema Validation with React Hook Form",
          url: "https://zod.dev/",
          description: "Defining validation rules, inferring form types, and custom refinement validators.",
          type: "documentation",
          provider: "Zod"
        }
      ],
      content: {
        overview: "Traditional React forms using useState re-render the entire component on every keystroke. React Hook Form uses uncontrolled inputs with refs, minimizing re-renders and integrating seamlessly with Zod schema validation.",
        keyConcepts: [
          {
            section: "Section 1 — Forms & Validation",
            topic: "React Hook Form & Zod",
            title: "Lesson 1 — Enterprise Form Architecture with React Hook Form & Zod Resolvers",
            prerequisites: "TypeScript and React fundamentals.",
            description: "How to build type-safe, accessible forms with React Hook Form, validate complex nested schemas using Zod, and render accessible validation errors.",
            whyItMatters: "Uncontrolled form inputs provide instant 60fps typing performance even on massive 50-field enterprise forms.",
            howItWorks: "React Hook Form registers DOM inputs via ref. The Zod resolver parses the form values upon submission, populating `formState.errors` if validation fails.",
            stepByStep: [
              "Step 1: Define validation schema with `z.object({ ... })`.",
              "Step 2: Infer TypeScript form values: `type FormValues = z.infer<typeof schema>`.",
              "Step 3: Initialize form: `useForm<FormValues>({ resolver: zodResolver(schema) })`.",
              "Step 4: Register inputs with `{...register('fieldName')}` and display `errors.fieldName?.message`."
            ],
            workedExample: "Schema Definition:\n```typescript\nconst employeeFormSchema = z.object({\n  fullName: z.string().min(2, 'Name must be at least 2 characters'),\n  email: z.string().email('Invalid email address'),\n  yearsOfExperience: z.number().min(0).max(50)\n});\n```",
            realWorldUsage: "Enterprise onboarding workflows, employee provisioning portals, and checkout flows.",
            codeSnippet: "// React Hook Form with Zod Schema Resolver (TypeScript / TSX)\nimport React from 'react';\nimport { useForm } from 'react-hook-form';\n\nexport interface ProvisionEmployeeFormData {\n  fullName: string;\n  workEmail: string;\n  jobRole: string;\n  targetProficiency: number;\n}\n\nexport const EmployeeProvisioningForm: React.FC<{\n  onSubmitSuccess: (data: ProvisionEmployeeFormData) => void;\n}> = ({ onSubmitSuccess }) => {\n  const {\n    register,\n    handleSubmit,\n    formState: { errors, isSubmitting }\n  } = useForm<ProvisionEmployeeFormData>({\n    defaultValues: {\n      fullName: '',\n      workEmail: '',\n      jobRole: 'Software Engineer',\n      targetProficiency: 3\n    }\n  });\n\n  const onSubmit = (data: ProvisionEmployeeFormData) => {\n    onSubmitSuccess(data);\n  };\n\n  return (\n    <form onSubmit={handleSubmit(onSubmit)} className=\"space-y-4 max-w-md p-6 bg-white rounded-lg shadow\">\n      <div>\n        <label className=\"block text-sm font-medium text-slate-700\">Full Name</label>\n        <input\n          {...register('fullName', { required: 'Full name is required', minLength: { value: 2, message: 'Min 2 characters' } })}\n          className=\"mt-1 block w-full p-2 border border-slate-300 rounded-md\"\n        />\n        {errors.fullName && <p className=\"text-xs text-red-600 mt-1\">{errors.fullName.message}</p>}\n      </div>\n\n      <div>\n        <label className=\"block text-sm font-medium text-slate-700\">Work Email</label>\n        <input\n          type=\"email\"\n          {...register('workEmail', { required: 'Work email is required' })}\n          className=\"mt-1 block w-full p-2 border border-slate-300 rounded-md\"\n        />\n        {errors.workEmail && <p className=\"text-xs text-red-600 mt-1\">{errors.workEmail.message}</p>}\n      </div>\n\n      <button\n        type=\"submit\"\n        disabled={isSubmitting}\n        className=\"w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50\"\n      >\n        {isSubmitting ? 'Provisioning...' : 'Provision Employee'}\n      </button>\n    </form>\n  );\n};",
            codeExplanation: "1. Uses uncontrolled inputs registered via React Hook Form.\n2. Validates field constraints synchronously without causing full form re-renders on keystroke.\n3. Exposes strongly-typed data to submit handler.",
            expectedOutput: "Renders accessible form with instant validation feedback and type-safe submission.",
            commonMistakes: "Using `useState` for every individual form input on large forms, creating severe keystroke input latency.",
            bestPractices: "Use React Hook Form with Zod schemas for all multi-field forms and use `Controller` for third-party date pickers/selects.",
            practiceTask: "Build a multi-step wizard form using React Hook Form with step-by-step Zod schema validation.",
            keyTakeaway: "React Hook Form provides zero-re-render form performance with declarative schema validation."
          }
        ],
        practicalExercise: "Build an enterprise employee provisioning form using React Hook Form and Zod schema validation, supporting dynamic skill arrays and accessible error announcements.",
        competencyVerification: "Demonstrates enterprise form architecture, React Hook Form performance, and Zod schema integration at Level 4.",
        resources: [
          {
            title: "React Hook Form Documentation",
            url: "https://react-hook-form.com/get-started",
            description: "useForm hook, register, formState, Controller, and performance optimization.",
            type: "documentation",
            provider: "React Hook Form Team"
          },
          {
            title: "Zod: Schema Validation with React Hook Form",
            url: "https://zod.dev/",
            description: "Defining validation rules, inferring form types, and custom refinement validators.",
            type: "documentation",
            provider: "Zod"
          }
        ]
      }
    },
    {
      id: "rct-mod-9",
      order: 9,
      title: "Module 9 — Accessible Component Systems: Radix UI, Tailwind CSS & Styling",
      durationMinutes: 160,
      summary: "WCAG 2.1 AA accessibility standards, Radix UI primitives, design token architecture, Tailwind CSS utility composition (cva, clsx), and accessible keyboard focus traps.",
      learningObjectives: [
        "Implement accessible UI components adhering to WCAG 2.1 AA guidelines.",
        "Compose headless Radix UI primitives with Tailwind CSS.",
        "Author variant-based component systems using class-variance-authority (cva)."
      ],
      resources: [
        {
          title: "Radix UI Primitives Documentation",
          url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
          description: "Unstyled, accessible component primitives for building high-quality design systems.",
          type: "documentation",
          provider: "WorkOS / Radix UI"
        },
        {
          title: "W3C WAI-ARIA Authoring Practices Guide (APG)",
          url: "https://www.w3.org/WAI/ARIA/apg/",
          description: "Official keyboard navigation patterns, ARIA role definitions, and accessibility guidelines.",
          type: "specification",
          provider: "W3C WAI"
        }
      ],
      content: {
        overview: "Building accessible component libraries requires compliance with WAI-ARIA standards, full keyboard navigation, and responsive design token management. Combining Radix UI headless primitives with Tailwind CSS and `class-variance-authority` (cva) provides enterprise-grade design systems.",
        keyConcepts: [
          {
            section: "Section 1 — Accessible Primitives & Variants",
            topic: "Radix Primitives & CVA",
            title: "Lesson 1 — Building Accessible Design Systems with Radix Primitives & CVA",
            prerequisites: "Module 4 (Headless UI) and Tailwind CSS basics.",
            description: "How to build fully accessible Dialog/Modal and Dropdown components with automatic focus trapping, ARIA attributes, and type-safe style variants using `cva`.",
            whyItMatters: "Building modals from scratch usually breaks keyboard focus trapping, screen readers, and ESC key dismissal, violating WCAG compliance.",
            howItWorks: "Radix UI manages accessibility state (focus trapping, portal rendering, ARIA roles). `class-variance-authority` generates Tailwind class strings based on variant props.",
            stepByStep: [
              "Step 1: Install Radix UI primitive (e.g., `@radix-ui/react-dialog`).",
              "Step 2: Define style variants with `cva('base-classes', { variants: { ... } })`.",
              "Step 3: Combine props and ref with React.forwardRef.",
              "Step 4: Verify keyboard tab trapping and screen reader announcements."
            ],
            workedExample: "CVA Variant Pattern:\n```typescript\nconst buttonVariants = cva('inline-flex items-center justify-center font-medium rounded-md transition', {\n  variants: {\n    variant: {\n      primary: 'bg-indigo-600 text-white hover:bg-indigo-700',\n      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',\n      outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50'\n    },\n    size: { sm: 'px-2 py-1 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }\n  },\n  defaultVariants: { variant: 'primary', size: 'md' }\n});\n```",
            realWorldUsage: "Enterprise design systems (shadcn/ui, GitHub Primer, Shopify Polaris).",
            codeSnippet: "// Accessible Button Component using CVA & Tailwind (TypeScript / TSX)\nimport React from 'react';\n\nexport interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: 'primary' | 'secondary' | 'danger';\n  size?: 'sm' | 'md' | 'lg';\n  isLoading?: boolean;\n}\n\nexport const AccessibleButton = React.forwardRef<HTMLButtonElement, ButtonProps>(\n  ({ variant = 'primary', size = 'md', isLoading = false, children, className = '', disabled, ...props }, ref) => {\n    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none';\n    \n    const variantClasses = {\n      primary: 'bg-indigo-600 text-white hover:bg-indigo-700',\n      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',\n      danger: 'bg-red-600 text-white hover:bg-red-700'\n    }[variant];\n\n    const sizeClasses = {\n      sm: 'px-2.5 py-1.5 text-xs',\n      md: 'px-4 py-2 text-sm',\n      lg: 'px-6 py-3 text-base'\n    }[size];\n\n    return (\n      <button\n        ref={ref}\n        disabled={disabled || isLoading}\n        className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}\n        {...props}\n      >\n        {isLoading ? <span className=\"mr-2 animate-spin\">⏳</span> : null}\n        {children}\n      </button>\n    );\n  }\n);\nAccessibleButton.displayName = 'AccessibleButton';",
            codeExplanation: "1. Uses React.forwardRef for proper DOM ref forwarding.\n2. Implements visible keyboard focus rings (`focus-visible:ring-2`).\n3. Disables pointer events and handles loading state accessibly.",
            expectedOutput: "Renders accessible button with keyboard focus ring and variant styling.",
            commonMistakes: "Removing focus outlines (`outline: none`) without providing visible `focus-visible` alternatives, making the site unusable for keyboard users.",
            bestPractices: "Always ensure high color contrast ratios (minimum 4.5:1 for normal text) and verify full keyboard tab navigation.",
            practiceTask: "Build an accessible Modal dialog component with focus lock and background backdrop blur.",
            keyTakeaway: "Accessible component libraries ensure that all users—regardless of ability or device—can navigate and interact with applications seamlessly."
          }
        ],
        practicalExercise: "Build an accessible, keyboard-navigable Modal Dialog component using Radix UI primitives and Tailwind CSS with focus trapping and ESC dismissal.",
        competencyVerification: "Demonstrates WCAG 2.1 AA accessibility compliance, Radix UI integration, and variant-based component design at Level 4.",
        resources: [
          {
            title: "Radix UI Primitives Documentation",
            url: "https://www.radix-ui.com/primitives/docs/overview/introduction",
            description: "Unstyled, accessible component primitives for building high-quality design systems.",
            type: "documentation",
            provider: "WorkOS / Radix UI"
          },
          {
            title: "W3C WAI-ARIA Authoring Practices Guide (APG)",
            url: "https://www.w3.org/WAI/ARIA/apg/",
            description: "Official keyboard navigation patterns, ARIA role definitions, and accessibility guidelines.",
            type: "specification",
            provider: "W3C WAI"
          }
        ]
      }
    },
    {
      id: "rct-mod-10",
      order: 10,
      title: "Module 10 — Performance Optimization: useMemo, useCallback, Code Splitting & Streaming SSR",
      durationMinutes: 160,
      summary: "React profiling tools, preventing unnecessary re-renders with useMemo / useCallback / React.memo, windowing large lists (TanStack Virtual), dynamic imports, and streaming SSR.",
      learningObjectives: [
        "Profile React component render duration and identify wasted re-renders using React DevTools Profiler.",
        "Apply useMemo, useCallback, and React.memo judiciously based on empirical profiling data.",
        "Virtualize 10,000+ row data tables using TanStack Virtual to maintain 60fps scrolling."
      ],
      resources: [
        {
          title: "React Official Documentation: Optimizing Performance",
          url: "https://react.dev/reference/react/useMemo",
          description: "useMemo, useCallback, memo, and when optimization is actually necessary.",
          type: "documentation",
          provider: "React Core Team"
        },
        {
          title: "TanStack Virtual: Headless Virtualization for React",
          url: "https://tanstack.com/virtual/latest",
          description: "Virtualizing massive lists, tables, and grids to minimize DOM node overhead.",
          type: "documentation",
          provider: "TanStack"
        }
      ],
      content: {
        overview: "Premature optimization introduces code complexity, but unoptimized React applications suffer from render lag and DOM node bloat. Profiling with React DevTools and virtualizing large datasets ensures snappy 60fps interactions.",
        keyConcepts: [
          {
            section: "Section 1 — React Performance & Virtualization",
            topic: "Profiling & List Virtualization",
            title: "Lesson 1 — Profiling, Render Optimization & DOM Virtualization",
            prerequisites: "Modules 1 through 9 (Complete React Suite).",
            description: "How to use the React Profiler to measure commit durations, when to wrap components in `React.memo`, and how DOM virtualization renders only visible rows in massive tables.",
            whyItMatters: "Rendering 5,000 DOM nodes freezes the browser main thread; DOM virtualization renders only the ~20 items currently inside the viewport, maintaining constant 60fps.",
            howItWorks: "The virtualizer calculates item offsets based on scroll position and container height, dynamically translating visible items using absolute positioning.",
            stepByStep: [
              "Step 1: Profile component tree in React DevTools to find slow renders.",
              "Step 2: Memoize expensive CPU calculations with `useMemo(() => compute(items), [items])`.",
              "Step 3: Stabilize callback references passed to memoized children with `useCallback`.",
              "Step 4: Implement virtualized windowing for lists exceeding 100 items."
            ],
            workedExample: "Virtualization Concept:\nTotal items: 10,000.\nVisible items in 400px window: 10 items.\nDOM nodes created: 12 nodes (10 visible + 2 overscan buffer) instead of 10,000 nodes.",
            realWorldUsage: "Enterprise audit logs, financial transaction feeds, and big data tables.",
            codeSnippet: "// Virtualized List Component Concept (TypeScript / TSX)\nimport React, { useState, useMemo, useCallback } from 'react';\n\nexport interface VirtualRowItem {\n  id: string;\n  name: string;\n  score: number;\n}\n\nexport const VirtualizedLogViewer: React.FC<{\n  items: VirtualRowItem[];\n  rowHeight?: number;\n  viewportHeight?: number;\n}> = ({ items, rowHeight = 40, viewportHeight = 320 }) => {\n  const [scrollTop, setScrollTop] = useState(0);\n\n  const totalHeight = items.length * rowHeight;\n  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 2); // 2 item overscan\n  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + viewportHeight) / rowHeight) + 2);\n\n  const visibleItems = useMemo(() => {\n    return items.slice(startIndex, endIndex + 1).map((item, index) => ({\n      item,\n      top: (startIndex + index) * rowHeight\n    }));\n  }, [items, startIndex, endIndex, rowHeight]);\n\n  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {\n    setScrollTop(e.currentTarget.scrollTop);\n  }, []);\n\n  return (\n    <div\n      onScroll={handleScroll}\n      style={{ height: viewportHeight }}\n      className=\"overflow-y-auto relative border border-slate-300 rounded-lg bg-white\"\n    >\n      <div style={{ height: totalHeight }} className=\"w-full relative\">\n        {visibleItems.map(({ item, top }) => (\n          <div\n            key={item.id}\n            style={{ top, height: rowHeight }}\n            className=\"absolute w-full px-4 flex items-center justify-between border-b text-sm\"\n          >\n            <span>{item.name}</span>\n            <span className=\"font-mono text-slate-500\">{item.score.toFixed(1)}</span>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n};",
            codeExplanation: "1. Calculates dynamic slice indices based on container `scrollTop`.\n2. Renders only visible rows inside absolute positioned container.\n3. Allows smooth scrolling over 100,000 items with zero DOM lag.",
            expectedOutput: "Smooth 60fps scrolling performance over 10,000 records with minimal memory footprint.",
            commonMistakes: "Wrapping every trivial function in `useCallback` without measuring, adding unnecessary memory overhead for dependency arrays.",
            bestPractices: "Profile first with React DevTools; apply `useMemo`/`useCallback` when passing callbacks to memoized children or computing heavy mathematical transformations.",
            practiceTask: "Implement a virtualized table displaying 50,000 log records with column sorting and filtering.",
            keyTakeaway: "DOM virtualization and targeted memoization keep React applications fast and responsive even when handling massive datasets."
          }
        ],
        practicalExercise: "Profile a laggy data table component, implement TanStack Virtual DOM windowing over 10,000 rows, and verify 60fps scrolling performance in Chrome DevTools.",
        competencyVerification: "Demonstrates advanced React performance profiling, DOM list virtualization, and memoization optimization at Level 4.",
        resources: [
          {
            title: "React Official Documentation: Optimizing Performance",
            url: "https://react.dev/reference/react/useMemo",
            description: "useMemo, useCallback, memo, and when optimization is actually necessary.",
            type: "documentation",
            provider: "React Core Team"
          },
          {
            title: "TanStack Virtual: Headless Virtualization for React",
            url: "https://tanstack.com/virtual/latest",
            description: "Virtualizing massive lists, tables, and grids to minimize DOM node overhead.",
            type: "documentation",
            provider: "TanStack"
          }
        ]
      }
    }
  ]
};
