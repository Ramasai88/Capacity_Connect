# Capacity Connect

**Digital Capacity Building and Learning Management Portal**

A standalone application — not a fork, customization, or dependency of
ClassroomIO or any other existing project.

> **Build status:** Phase 1 of 10 complete. See [Development Phases](#development-phases)
> below for what exists today vs. what's coming.

---

## 1. What Capacity Connect Is

Organizations run training programs, but training alone doesn't show
whether employees actually have the skills their job roles require.
Capacity Connect answers that by connecting:

```
Organization → Designation → Required Competencies → Employee →
Current Competencies → Skill Gap Analysis → Training/Courses →
Learning & Improvement
```

The core feature is **designation-based employee skill gap analysis**:
for every employee, compare what their job role requires against what
they currently have, surface the gap, and point them at courses that
close it.

## 2. Problem Statement

Given a designation (e.g. "AI Engineer") with required competency levels,
and an employee's assessed competency levels, the system answers:

- What does this employee's role require?
- What does the employee currently have?
- Where's the gap? (`gap = max(0, required − current)`)
- Which employees/competencies need the most attention org-wide?
- What training closes a given gap?

## 3. Features (by phase — see [Development Phases](#development-phases))

- Organization, user, and employee management with multi-tenant isolation
- Competency and configurable proficiency-level management
- Designation management with a required-competency matrix
- Employee competency assessment (with history)
- Skill-gap calculation engine (backend-only source of truth)
- Skill-gap dashboards (per-employee and org-wide)
- Course/lesson management, enrollment, and progress tracking
- Rule-based training recommendations driven by skill gaps

## 4. Architecture

See [`capacity-connect-architecture.md`](./capacity-connect-architecture.md)
(the approved design document) for the full ER diagram, API design, route
structure, and authorization model. In short:

- Next.js App Router serves both the UI and the REST-shaped API
  (`app/api/**`), so there's one codebase and one deploy target.
- All business logic (skill-gap calculation, validation, authorization)
  lives in `lib/`, never duplicated in the frontend.
- Every organization-scoped database query is filtered by
  `organizationId` taken from the authenticated session — never from
  client input — enforcing tenant isolation at the query layer.

## 5. Technology Stack

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript |
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| UI components | shadcn/ui (Radix primitives + Tailwind) |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js (NextAuth) — Credentials provider, JWT sessions, bcrypt password hashing |
| Testing | Vitest |

## 6. Database Schema (current)

Phase 1 implements three models — see `prisma/schema.prisma`:

- **Organization** — tenant root (`name`, `description`, `logo`)
- **User** — the login/authentication identity (`email` unique per org,
  `passwordHash`, `role`: `ADMIN | MANAGER | EMPLOYEE`)
- **Employee** — the HR/competency record (`employeeCode` unique per org,
  `department`, `status`). A `User` with role `EMPLOYEE` links to exactly
  one `Employee` via a nullable, unique `employeeId` foreign key; `ADMIN`
  and `MANAGER` users don't require one.

Designation, Competency, CompetencyLevel, DesignationCompetency,
EmployeeCompetency, CompetencyAssessmentHistory, Course, CourseCompetency,
CourseLesson, CourseEnrollment, and LessonProgress are added in Phases
2–7 per the architecture document — building the full schema up front
before the code that uses it exists was deliberately avoided.

## 7. How Skill-Gap Calculation Works

Not implemented yet (Phase 5). When it lands, `lib/skill-gap/calculateSkillGap.ts`
will be a pure, unit-tested function:

```
gap = max(0, requiredLevel − currentLevel)

no current record  → status = NOT_ASSESSED
gap === 0           → status = MEETS_REQUIREMENT
gap > 0              → status = NEEDS_IMPROVEMENT
```

Every API route and UI view that shows a skill gap calls this same
function — the calculation is never re-implemented in the frontend.

## 8. Installation

Requires Node.js 18.18+ and a running PostgreSQL instance.

```bash
git clone <this-repo>
cd capacity-connect
npm install
```

## 9. Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random 32-byte secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of the app, e.g. `http://localhost:3000` |

```bash
cp .env.example .env
```

## 10. Running Locally

```bash
npm run db:migrate   # applies migrations, creates tables
npm run db:seed       # seeds the demo organization + admin user
npm run dev            # starts the dev server at http://localhost:3000
```

## 11. Database Migrations

```bash
npm run db:migrate          # creates/applies a new migration in development
npm run db:migrate:deploy   # applies existing migrations (CI/production)
npm run db:studio            # opens Prisma Studio to inspect data
```

## 12. Seeding Demo Data

```bash
npm run db:seed
```

Phase 1 seeds:

- Organization: **KL University**
- One `ADMIN` user (see credentials below)

Competencies, designations, additional employees with varied skill gaps,
and courses are added to the seed script in later phases as those models
land, per the architecture document's seed data plan.

### Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@klu.edu` | `Admin@123` |

## 13. Running Tests

```bash
npm test          # run once
npm run test:watch # watch mode
npm run typecheck   # TypeScript strict check
```

## Development Phases

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Project scaffold, Prisma schema (Organization/User/Employee), Auth.js login/session, protected app shell | ✅ Done |
| 2 | Competency + CompetencyLevel CRUD | ⬜ Next |
| 3 | Designation CRUD + Designation Competency Matrix editor | ⬜ |
| 4 | Employee Competency Assessment (+ history log) | ⬜ |
| 5 | Skill-gap engine + unit tests | ⬜ |
| 6 | Skill-gap UI: employee detail, org-wide table, dashboard summary | ⬜ |
| 7 | Course/Lesson CRUD + enrollment + progress tracking | ⬜ |
| 8 | Training recommendations (gap → course matching) | ⬜ |
| 9 | Dashboard polish, reports | ⬜ |
| 10 | Test coverage pass, validation hardening, security review, docs | ⬜ |

## What's Implemented in Phase 1

- `prisma/schema.prisma` — Organization, User, Employee models with
  multi-tenant unique constraints (`organizationId + email`,
  `organizationId + employeeCode`)
- `prisma/seed.ts` — seeds KL University + one admin user
- `lib/auth/auth.ts` — Auth.js Credentials provider (bcrypt password
  check, JWT session carrying `userId`, `role`, `organizationId`,
  `employeeId`)
- `lib/auth/session.ts` — `getCurrentSession()`, `requireSession()`,
  `requireRole()` helpers for use by every future protected route
- `middleware.ts` — redirects unauthenticated requests to `/login` for
  every protected route prefix
- `app/login/page.tsx` — login form
- `app/(protected)/layout.tsx` — the AppShell: role-aware sidebar, top
  nav with sign-out, server-side session guard
- `app/(protected)/dashboard/page.tsx` — placeholder dashboard (metrics
  arrive in Phase 9 once the modules that feed them exist)
- `components/ui/*` — shadcn/ui-style Button, Input, Label, Card
  primitives
- `tests/auth-validation.test.ts` — unit tests for the login Zod schema

## What's Deliberately Not Here Yet

Competencies, designations, the skill-gap engine, courses, and reports —
these are Phases 2 through 9. Building them before their dependencies
exist would work against the "build incrementally" instruction the
project was scoped under.
