-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReassessmentStatus" AS ENUM ('PENDING_REASSESSMENT', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "industry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT,
    "designationId" TEXT,
    "joiningDate" TIMESTAMP(3),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "department" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency_levels" (
    "id" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "behavioralIndicators" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competency_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designation_competencies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "requiredLevel" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designation_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_competencies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competency_assessment_history" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "previousLevel" INTEGER,
    "newLevel" INTEGER NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessedBy" TEXT,
    "reason" TEXT,

    CONSTRAINT "competency_assessment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "status" "CourseStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "learningObjectives" TEXT[],
    "overview" TEXT NOT NULL,
    "keyConcepts" JSONB NOT NULL,
    "practicalExercise" TEXT NOT NULL,
    "competencyVerification" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "completedLessons" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reassessments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "previousLevel" INTEGER NOT NULL,
    "requestedLevel" INTEGER NOT NULL,
    "status" "ReassessmentStatus" NOT NULL DEFAULT 'PENDING_REASSESSMENT',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewerComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reassessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "users_organizationId_email_key" ON "users"("organizationId", "email");

-- CreateIndex
CREATE INDEX "employees_organizationId_idx" ON "employees"("organizationId");

-- CreateIndex
CREATE INDEX "employees_designationId_idx" ON "employees"("designationId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_employeeCode_key" ON "employees"("organizationId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "employees_organizationId_email_key" ON "employees"("organizationId", "email");

-- CreateIndex
CREATE INDEX "designations_organizationId_idx" ON "designations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "designations_organizationId_code_key" ON "designations"("organizationId", "code");

-- CreateIndex
CREATE INDEX "competencies_organizationId_idx" ON "competencies"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "competencies_organizationId_code_key" ON "competencies"("organizationId", "code");

-- CreateIndex
CREATE INDEX "competency_levels_competencyId_idx" ON "competency_levels"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "competency_levels_competencyId_level_key" ON "competency_levels"("competencyId", "level");

-- CreateIndex
CREATE INDEX "designation_competencies_organizationId_idx" ON "designation_competencies"("organizationId");

-- CreateIndex
CREATE INDEX "designation_competencies_designationId_idx" ON "designation_competencies"("designationId");

-- CreateIndex
CREATE INDEX "designation_competencies_competencyId_idx" ON "designation_competencies"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "designation_competencies_designationId_competencyId_key" ON "designation_competencies"("designationId", "competencyId");

-- CreateIndex
CREATE INDEX "employee_competencies_organizationId_idx" ON "employee_competencies"("organizationId");

-- CreateIndex
CREATE INDEX "employee_competencies_employeeId_idx" ON "employee_competencies"("employeeId");

-- CreateIndex
CREATE INDEX "employee_competencies_competencyId_idx" ON "employee_competencies"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_competencies_employeeId_competencyId_key" ON "employee_competencies"("employeeId", "competencyId");

-- CreateIndex
CREATE INDEX "competency_assessment_history_employeeId_idx" ON "competency_assessment_history"("employeeId");

-- CreateIndex
CREATE INDEX "competency_assessment_history_competencyId_idx" ON "competency_assessment_history"("competencyId");

-- CreateIndex
CREATE INDEX "courses_organizationId_idx" ON "courses"("organizationId");

-- CreateIndex
CREATE INDEX "courses_competencyId_idx" ON "courses"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_organizationId_code_key" ON "courses"("organizationId", "code");

-- CreateIndex
CREATE INDEX "course_modules_courseId_idx" ON "course_modules"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_courseId_order_key" ON "course_modules"("courseId", "order");

-- CreateIndex
CREATE INDEX "course_enrollments_employeeId_idx" ON "course_enrollments"("employeeId");

-- CreateIndex
CREATE INDEX "course_enrollments_courseId_idx" ON "course_enrollments"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_employeeId_courseId_key" ON "course_enrollments"("employeeId", "courseId");

-- CreateIndex
CREATE INDEX "module_progress_enrollmentId_idx" ON "module_progress"("enrollmentId");

-- CreateIndex
CREATE INDEX "module_progress_moduleId_idx" ON "module_progress"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "module_progress_enrollmentId_moduleId_key" ON "module_progress"("enrollmentId", "moduleId");

-- CreateIndex
CREATE INDEX "reassessments_organizationId_idx" ON "reassessments"("organizationId");

-- CreateIndex
CREATE INDEX "reassessments_employeeId_idx" ON "reassessments"("employeeId");

-- CreateIndex
CREATE INDEX "reassessments_courseId_idx" ON "reassessments"("courseId");

-- CreateIndex
CREATE INDEX "reassessments_competencyId_idx" ON "reassessments"("competencyId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_levels" ADD CONSTRAINT "competency_levels_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designation_competencies" ADD CONSTRAINT "designation_competencies_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designation_competencies" ADD CONSTRAINT "designation_competencies_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_competencies" ADD CONSTRAINT "employee_competencies_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_competencies" ADD CONSTRAINT "employee_competencies_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_assessment_history" ADD CONSTRAINT "competency_assessment_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competency_assessment_history" ADD CONSTRAINT "competency_assessment_history_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessments" ADD CONSTRAINT "reassessments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessments" ADD CONSTRAINT "reassessments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessments" ADD CONSTRAINT "reassessments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reassessments" ADD CONSTRAINT "reassessments_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
