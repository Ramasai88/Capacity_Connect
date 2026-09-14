import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { RoleLearningService } from "@/lib/services/role-learning.service";
import { EmployeeService } from "@/lib/services/employee.service";
import { adminCreateUserSchema } from "@/lib/validations/auth";
import { hasPermission } from "@/lib/auth/rbac";
import {
  EXAM_REGISTRY,
  getExamIdForRole,
  evaluateExam,
  getClientExam,
} from "@/lib/assessment/exam-bank";
import { calculateSkillGap } from "@/lib/skill-gap/calculateSkillGap";

const TEST_ORG_ID = "org-kl-university";
const CLEANUP_USER_EMAILS: string[] = [];
const CLEANUP_EMPLOYEE_IDS: string[] = [];

afterEach(async () => {
  // Clean up test users created during the run
  if (CLEANUP_USER_EMAILS.length > 0) {
    await prisma.user.deleteMany({
      where: { email: { in: CLEANUP_USER_EMAILS }, organizationId: TEST_ORG_ID },
    });
    CLEANUP_USER_EMAILS.length = 0;
  }
  // Clean up test employees created
  if (CLEANUP_EMPLOYEE_IDS.length > 0) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
      select: { id: true },
    });
    const enrollmentIds = enrollments.map((e) => e.id);
    if (enrollmentIds.length > 0) {
      await prisma.moduleProgress.deleteMany({
        where: { enrollmentId: { in: enrollmentIds } },
      });
      await prisma.courseEnrollment.deleteMany({
        where: { id: { in: enrollmentIds } },
      });
    }
    await prisma.employeeCompetency.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.competencyAssessmentHistory.deleteMany({
      where: { employeeId: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    await prisma.employee.deleteMany({
      where: { id: { in: CLEANUP_EMPLOYEE_IDS } },
    });
    CLEANUP_EMPLOYEE_IDS.length = 0;
  }
});

describe("Role-Based Learning, Assessment & Resource Access System", () => {
  // ==========================================================================
  // 1. Schema Validation & Admin User Provisioning
  // ==========================================================================
  describe("1. Admin User Provisioning & Designation Validation", () => {
    it("validates EMPLOYEE creation with a valid designationId", () => {
      const result = adminCreateUserSchema.safeParse({
        name: "Ravi ML Engineer",
        email: "ravi.ml@example.com",
        password: "Password@123",
        confirmPassword: "Password@123",
        role: "EMPLOYEE",
        designationId: "desig-mle",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("EMPLOYEE");
        expect(result.data.designationId).toBe("desig-mle");
      }
    });

    it("rejects EMPLOYEE creation when invalid designationId is provided to EmployeeService", async () => {
      await expect(
        EmployeeService.createEmployee(TEST_ORG_ID, {
          name: "Invalid Designation Employee",
          email: "invalid.desig@test-capacity.demo",
          employeeCode: "EMP-INVALID-DESIG-1",
          department: "Engineering",
          designationId: "non-existent-desig-id",
        })
      ).rejects.toThrow("The specified designation does not exist in this organization.");
    });

    it("allows ADMIN and MANAGER creation without designationId", () => {
      const adminResult = adminCreateUserSchema.safeParse({
        name: "Admin User",
        email: "admin.test@example.com",
        password: "Password@123",
        confirmPassword: "Password@123",
        role: "ADMIN",
      });
      expect(adminResult.success).toBe(true);

      const managerResult = adminCreateUserSchema.safeParse({
        name: "Manager User",
        email: "mgr.test@example.com",
        password: "Password@123",
        confirmPassword: "Password@123",
        role: "MANAGER",
      });
      expect(managerResult.success).toBe(true);
    });
  });

  // ==========================================================================
  // 2. Centralized Role Scope Resolution
  // ==========================================================================
  describe("2. Centralized Role Scope Resolution (RoleLearningService)", () => {
    it("resolves role scope for Python Full Stack Developer (desig-pfs)", async () => {
      const scope = await RoleLearningService.resolveRoleScope(TEST_ORG_ID, "desig-pfs");
      expect(scope).not.toBeNull();
      expect(scope?.designationTitle).toBe("Python Full Stack Developer");
      expect(scope?.examId).toBe("exam-python-advanced");

      const compCodes = scope?.requiredCompetencies.map((c) => c.competencyCode) || [];
      expect(compCodes).toContain("TECH-PY-01");
      expect(compCodes).toContain("DATA-SQL-06");

      const courseCodes = scope?.eligibleCourses.map((c) => c.code) || [];
      expect(courseCodes).toContain("CRS-PY-401");
    });

    it("resolves role scope for ML Engineer (desig-mle)", async () => {
      const scope = await RoleLearningService.resolveRoleScope(TEST_ORG_ID, "desig-mle");
      expect(scope).not.toBeNull();
      expect(scope?.designationTitle).toBe("ML Engineer");
      expect(scope?.examId).toBe("exam-ml-engineer");

      const compCodes = scope?.requiredCompetencies.map((c) => c.competencyCode) || [];
      expect(compCodes).toContain("TECH-PY-01");
      expect(compCodes).toContain("AI-ML-03");
      expect(compCodes).toContain("DATA-ANA-07");

      const courseCodes = scope?.eligibleCourses.map((c) => c.code) || [];
      expect(courseCodes).toContain("CRS-PY-401");
      expect(courseCodes).toContain("CRS-ML-402");
    });

    it("resolves role scope for Java Developer (desig-jvd)", async () => {
      const scope = await RoleLearningService.resolveRoleScope(TEST_ORG_ID, "desig-jvd");
      expect(scope).not.toBeNull();
      expect(scope?.designationTitle).toBe("Java Developer");
      expect(scope?.examId).toBe("exam-java-developer");

      const compCodes = scope?.requiredCompetencies.map((c) => c.competencyCode) || [];
      expect(compCodes).toContain("TECH-JV-02");
      expect(compCodes).toContain("DATA-SQL-06");

      const courseCodes = scope?.eligibleCourses.map((c) => c.code) || [];
      expect(courseCodes).toContain("CRS-JV-401");
    });

    it("resolves role scope for HR Manager / Leadership (desig-hrm)", async () => {
      const scope = await RoleLearningService.resolveRoleScope(TEST_ORG_ID, "desig-hrm");
      expect(scope).not.toBeNull();
      expect(scope?.designationTitle).toBe("HR Manager");
      expect(scope?.examId).toBe("exam-leadership");

      const compCodes = scope?.requiredCompetencies.map((c) => c.competencyCode) || [];
      expect(compCodes).toContain("MGMT-LDR-05");
      expect(compCodes).toContain("SOFT-COM-04");

      const courseCodes = scope?.eligibleCourses.map((c) => c.code) || [];
      expect(courseCodes).toContain("CRS-LDR-401");
      expect(courseCodes).toContain("CRS-COM-501");
    });

    it("returns null for non-existent designation", async () => {
      const scope = await RoleLearningService.resolveRoleScope(TEST_ORG_ID, "invalid-desig-id");
      expect(scope).toBeNull();
    });
  });

  // ==========================================================================
  // 3. Automatic Course Assignment & Duplicate Protection
  // ==========================================================================
  describe("3. Automatic Course Assignment & Duplicate Enrollment Protection", () => {
    it("automatically establishes course enrollments for a newly created employee", async () => {
      // 1. Create a test employee with ML Engineer role
      const testEmp = await EmployeeService.createEmployee(TEST_ORG_ID, {
        name: "Test ML Engineer",
        email: "test.ml.engineer@test-capacity.demo",
        employeeCode: "EMP-TEST-MLE-1",
        department: "Engineering",
        designationId: "desig-mle",
      });
      CLEANUP_EMPLOYEE_IDS.push(testEmp.id);

      expect(testEmp.designation?.id).toBe("desig-mle");

      // 2. Fetch employee role learning scope
      const learningScope = await RoleLearningService.getEmployeeRoleLearningScope(
        TEST_ORG_ID,
        testEmp.id
      );
      expect(learningScope).not.toBeNull();
      expect(learningScope?.designation?.title).toBe("ML Engineer");
      expect(learningScope?.roleCourses.length).toBeGreaterThanOrEqual(2);

      const enrolledCourseCodes = learningScope?.roleCourses.map((c) => c.code) || [];
      expect(enrolledCourseCodes).toContain("CRS-PY-401");
      expect(enrolledCourseCodes).toContain("CRS-ML-402");
    });

    it("is strictly idempotent and does not create duplicate enrollments or overwrite progress", async () => {
      // Create employee
      const testEmp = await EmployeeService.createEmployee(TEST_ORG_ID, {
        name: "Test Idempotent Employee",
        email: "test.idempotent@test-capacity.demo",
        employeeCode: "EMP-TEST-IDEM-1",
        department: "Engineering",
        designationId: "desig-pfs",
      });
      CLEANUP_EMPLOYEE_IDS.push(testEmp.id);

      // Verify initial enrollments count
      const initialEnrollments = await prisma.courseEnrollment.findMany({
        where: { employeeId: testEmp.id },
      });
      expect(initialEnrollments.length).toBeGreaterThanOrEqual(1);

      // Simulate employee making progress on Python course
      const pyEnrollment = initialEnrollments.find((e) => e.courseId === "course-py-401");
      expect(pyEnrollment).toBeDefined();

      if (pyEnrollment) {
        await prisma.courseEnrollment.update({
          where: { id: pyEnrollment.id },
          data: { progressPercent: 50, completedLessons: 3 },
        });
      }

      // Re-run syncEmployeeRoleCourseEnrollments
      const syncResult = await RoleLearningService.syncEmployeeRoleCourseEnrollments(
        TEST_ORG_ID,
        testEmp.id,
        "desig-pfs"
      );

      // Check that no duplicate enrollments were added
      expect(syncResult.newlyEnrolledCount).toBe(0);

      // Verify progress on Python course was NOT overwritten
      const updatedPyEnrollment = await prisma.courseEnrollment.findUnique({
        where: { id: pyEnrollment?.id },
      });
      expect(updatedPyEnrollment?.progressPercent).toBe(50);
      expect(updatedPyEnrollment?.completedLessons).toBe(3);
    });
  });

  // ==========================================================================
  // 4. Role Change & Learning History Preservation
  // ==========================================================================
  describe("4. Role Change & Complete History Preservation", () => {
    it("updates role learning scope while preserving historical enrollments and progress", async () => {
      // 1. Create employee as ML Engineer
      const testEmp = await EmployeeService.createEmployee(TEST_ORG_ID, {
        name: "Ravi Role Transition",
        email: "ravi.transition@test-capacity.demo",
        employeeCode: "EMP-TEST-TRANS-1",
        department: "Engineering",
        designationId: "desig-mle",
      });
      CLEANUP_EMPLOYEE_IDS.push(testEmp.id);

      const initialEnrollments = await prisma.courseEnrollment.findMany({
        where: { employeeId: testEmp.id },
      });
      const mleCourseIds = initialEnrollments.map((e) => e.courseId);
      expect(mleCourseIds).toContain("course-ml-402");

      // 2. Add some progress to ML course
      const mlEnrollment = initialEnrollments.find((e) => e.courseId === "course-ml-402");
      if (mlEnrollment) {
        await prisma.courseEnrollment.update({
          where: { id: mlEnrollment.id },
          data: { progressPercent: 80, completedLessons: 4 },
        });
      }

      // 3. Admin transitions employee from ML Engineer to Data Scientist (desig-ds)
      const updatedEmp = await EmployeeService.updateEmployee(
        TEST_ORG_ID,
        testEmp.id,
        { designationId: "desig-ds" }
      );
      expect(updatedEmp.designation?.id).toBe("desig-ds");

      // 4. Verify new learning scope
      const newLearningScope = await RoleLearningService.getEmployeeRoleLearningScope(
        TEST_ORG_ID,
        testEmp.id
      );
      expect(newLearningScope?.designation?.title).toBe("Data Scientist");

      // Verify that Data Scientist courses (e.g. SQL course) are now enrolled
      const allEnrollments = await prisma.courseEnrollment.findMany({
        where: { employeeId: testEmp.id },
      });
      const allCourseIds = allEnrollments.map((e) => e.courseId);
      expect(allCourseIds).toContain("course-sql-301"); // Data Scientist course

      // Verify that historical ML enrollment and its progress STILL EXIST (NOT DELETED)
      const preservedMlEnrollment = allEnrollments.find((e) => e.courseId === "course-ml-402");
      expect(preservedMlEnrollment).toBeDefined();
      expect(preservedMlEnrollment?.progressPercent).toBe(80);
      expect(preservedMlEnrollment?.completedLessons).toBe(4);
    });
  });

  // ==========================================================================
  // 5. Role-Specific Diagnostic Assessment Scope & Exam Engine
  // ==========================================================================
  describe("5. Role-Specific Diagnostic Assessment Engine", () => {
    it("maps designations to appropriate diagnostic exams", () => {
      expect(getExamIdForRole("Python Full Stack Developer")).toBe("exam-python-advanced");
      expect(getExamIdForRole("ML Engineer")).toBe("exam-ml-engineer");
      expect(getExamIdForRole("Java Developer")).toBe("exam-java-developer");
      expect(getExamIdForRole("Data Scientist")).toBe("exam-ml-engineer");
      expect(getExamIdForRole("HR Manager")).toBe("exam-leadership");
      expect(getExamIdForRole("Project Manager")).toBe("exam-leadership");
      expect(getExamIdForRole("Unknown Custom Role")).toBe("exam-python-advanced"); // Safe fallback
    });

    it("provides valid questions and topics for ML Engineer exam", () => {
      const exam = EXAM_REGISTRY["exam-ml-engineer"];
      expect(exam).toBeDefined();
      expect(exam.title).toContain("Machine Learning");
      expect(exam.questions.length).toBeGreaterThanOrEqual(4);

      const clientExam = getClientExam("exam-ml-engineer");
      expect(clientExam.questions.length).toBe(exam.questions.length);
      // Ensure correctAnswer is stripped for client security
      expect((clientExam.questions[0] as any).correctAnswer).toBeUndefined();
    });

    it("evaluates diagnostic exam submissions accurately", () => {
      const exam = EXAM_REGISTRY["exam-python-advanced"];
      const answers = exam.questions.map((q) => ({
        questionId: q.id,
        selectedOption: q.correctAnswer,
      }));

      const result = evaluateExam("exam-python-advanced", answers);
      expect(result.score).toBe(100);
      expect(result.correctQuestions).toBe(exam.totalQuestions);
      expect(result.topicBreakdown.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 6. Role-Specific Competency & Skill Gap Analysis
  // ==========================================================================
  describe("6. Role-Specific Competency & Skill Gap Analysis", () => {
    it("calculates skill gaps based strictly on role-required competencies using max(0, Required - Current)", () => {
      const required = [
        { competencyId: "comp-py", competencyName: "Python", category: "Technical", requiredLevel: 4 },
        { competencyId: "comp-ml", competencyName: "Machine Learning", category: "Data & AI", requiredLevel: 4 },
        { competencyId: "comp-dl", competencyName: "Deep Learning", category: "Data & AI", requiredLevel: 4 },
      ];

      const current = [
        { competencyId: "comp-py", currentLevel: 2 },
        { competencyId: "comp-ml", currentLevel: 4 },
        { competencyId: "comp-dl", currentLevel: 1 },
      ];

      const gapResults = calculateSkillGap(required, current);

      expect(gapResults).toEqual([
        expect.objectContaining({ competencyId: "comp-py", gap: 2, status: "NEEDS_IMPROVEMENT" }),
        expect.objectContaining({ competencyId: "comp-ml", gap: 0, status: "MEETS_REQUIREMENT" }),
        expect.objectContaining({ competencyId: "comp-dl", gap: 3, status: "NEEDS_IMPROVEMENT" }),
      ]);
    });
  });

  // ==========================================================================
  // 7. Multi-Tenant Organization Isolation & RBAC Security
  // ==========================================================================
  describe("7. Organization Isolation & RBAC Security", () => {
    it("rejects role scope queries from another organization", async () => {
      const FOREIGN_ORG_ID = "org-other-tenant-999";
      const scope = await RoleLearningService.resolveRoleScope(FOREIGN_ORG_ID, "desig-mle");
      // Since desig-mle belongs to TEST_ORG_ID, foreign org query returns null
      expect(scope).toBeNull();
    });

    it("enforces RBAC permissions: EMPLOYEES cannot add or edit employees or designations", () => {
      expect(hasPermission("EMPLOYEE", "canAddEmployee")).toBe(false);
      expect(hasPermission("EMPLOYEE", "canEditEmployee")).toBe(false);
      expect(hasPermission("EMPLOYEE", "canCreateDesignation")).toBe(false);
      expect(hasPermission("EMPLOYEE", "canCreateCompetency")).toBe(false);

      expect(hasPermission("ADMIN", "canAddEmployee")).toBe(true);
      expect(hasPermission("ADMIN", "canEditEmployee")).toBe(true);
      expect(hasPermission("ADMIN", "canCreateDesignation")).toBe(true);
    });

    it("validates course access strictly within employee role enrollments", async () => {
      const testEmp = await EmployeeService.createEmployee(TEST_ORG_ID, {
        name: "Test Access Guard Employee",
        email: "test.guard@test-capacity.demo",
        employeeCode: "EMP-TEST-GUARD-1",
        department: "Engineering",
        designationId: "desig-pfs", // Python Full Stack
      });
      CLEANUP_EMPLOYEE_IDS.push(testEmp.id);

      // Access to assigned Python course is allowed
      const allowed = await RoleLearningService.validateCourseAccess(
        TEST_ORG_ID,
        testEmp.id,
        "course-py-401"
      );
      expect(allowed).toBe(true);

      // Direct access check against non-existent course is rejected
      const rejected = await RoleLearningService.validateCourseAccess(
        TEST_ORG_ID,
        testEmp.id,
        "non-existent-course"
      );
      expect(rejected).toBe(false);
    });
  });
});
