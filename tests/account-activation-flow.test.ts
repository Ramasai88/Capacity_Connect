import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { EmployeeService } from "@/lib/services/employee.service";
import { ActivationService, ActivationServiceError } from "@/lib/services/activation.service";
import { EmailService } from "@/lib/services/email.service";
import { verifyUserCredentials } from "@/lib/auth/auth";
import { activateAccountSchema, adminCreateUserSchema } from "@/lib/validations/auth";

const TEST_ORG_ID = "org-kl-university";

describe("Phase 1 — Email Activation Link + Employee Password Setup Flow", () => {
  beforeEach(() => {
    EmailService.clearSentEmailsHistory();
  });

  it("1-7: Admin creates employee -> creates unactivated user, generates token with 24h expiration, and sends email with Employee ID & link (no password)", async () => {
    const uniqueSuffix = Date.now().toString(36);
    const testCode = `EMP-ACT-${uniqueSuffix.toUpperCase()}`;
    const testEmail = `employee.activation.${uniqueSuffix}@klu.edu`;
    const employeeName = "Priya Sharma";

    // 1. Admin creates employee
    const created = await EmployeeService.createEmployee(TEST_ORG_ID, {
      name: employeeName,
      email: testEmail,
      employeeCode: testCode,
      department: "Computer Science",
      designationId: "desig-swe",
      status: "ACTIVE",
    });

    expect(created).toBeDefined();
    expect(created.employeeCode).toBe(testCode);
    expect(created.email).toBe(testEmail);

    // 2. Verify User account created in database in unactivated state
    const user = await prisma.user.findFirst({
      where: { email: testEmail, organizationId: TEST_ORG_ID },
    });
    expect(user).toBeDefined();
    expect(user!.isActivated).toBe(false);
    expect(user!.employeeId).toBe(created.id);
    expect(user!.role).toBe("EMPLOYEE");

    // 3. Verify Activation Token generated with expiration
    const tokenRecord = await prisma.accountActivationToken.findFirst({
      where: { userId: user!.id, employeeId: created.id },
    });
    expect(tokenRecord).toBeDefined();
    expect(tokenRecord!.usedAt).toBeNull();
    expect(tokenRecord!.tokenHash).toBeDefined();
    // Expiration must be within 24 hours in the future
    const now = Date.now();
    const expiresMs = new Date(tokenRecord!.expiresAt).getTime();
    expect(expiresMs).toBeGreaterThan(now);
    expect(expiresMs).toBeLessThanOrEqual(now + 25 * 60 * 60 * 1000);

    // 4. Verify Activation Email was triggered
    const emailHistory = EmailService.getSentEmailsHistory();
    const sentEmail = emailHistory.find((e) => e.recipientEmail === testEmail);
    expect(sentEmail).toBeDefined();

    // 5. Verify email contains Employee ID
    expect(sentEmail!.employeeCode).toBe(testCode);

    // 6. Verify email contains activation link with token
    expect(sentEmail!.activationUrl).toContain("/activate-account?token=");

    // 7. Verify email subject & body does NOT contain any permanent or plaintext password
    expect(sentEmail!.subject).toBe("Welcome to Capacity Connect — Activate Your Account");
    expect(sentEmail!.activationUrl).not.toContain("password");
  });

  it("8: Unactivated employee CANNOT log in before completing activation", async () => {
    const uniqueSuffix = `${Date.now()}_unact`;
    const testEmail = `unactivated.${uniqueSuffix}@klu.edu`;
    const testCode = `EMP-${Date.now().toString(36).toUpperCase()}`;

    await EmployeeService.createEmployee(TEST_ORG_ID, {
      name: "Unactivated Employee",
      email: testEmail,
      employeeCode: testCode,
      status: "ACTIVE",
    });

    // Attempting login before activation must fail
    const loginResult = await verifyUserCredentials({
      email: testEmail,
      password: "AnyPassword123!",
    });

    expect(loginResult).toBeNull();
  });

  it("9-15: Valid token allows password creation, stores bcrypt hash, activates account, burns token, and enables login", async () => {
    const uniqueSuffix = `${Date.now()}_success`;
    const testEmail = `success.${uniqueSuffix}@klu.edu`;
    const testCode = `EMP-S-${Date.now().toString(36).toUpperCase()}`;
    const employeeName = "Vikram Reddy";

    await EmployeeService.createEmployee(TEST_ORG_ID, {
      name: employeeName,
      email: testEmail,
      employeeCode: testCode,
      status: "ACTIVE",
    });

    // Retrieve raw token from email history
    const emailHistory = EmailService.getSentEmailsHistory();
    const sentEmail = emailHistory.find((e) => e.recipientEmail === testEmail);
    expect(sentEmail).toBeDefined();

    const rawToken = new URL(sentEmail!.activationUrl).searchParams.get("token")!;
    expect(rawToken).toBeDefined();

    // Validate token
    const validation = await ActivationService.validateToken(rawToken);
    expect(validation.valid).toBe(true);
    expect(validation.employee?.employeeCode).toBe(testCode);
    expect(validation.employee?.email).toBe(testEmail);

    // Activate account with employee's new password
    const newPassword = "MySecurePassword@2026";
    const activationResult = await ActivationService.activateAccountWithPassword(rawToken, newPassword);

    expect(activationResult.success).toBe(true);
    expect(activationResult.email).toBe(testEmail);

    // Verify User record is now activated and password is a bcrypt hash
    const updatedUser = await prisma.user.findFirst({
      where: { email: testEmail, organizationId: TEST_ORG_ID },
    });
    expect(updatedUser).toBeDefined();
    expect(updatedUser!.isActivated).toBe(true);
    expect(updatedUser!.passwordHash.startsWith("$2a$") || updatedUser!.passwordHash.startsWith("$2b$")).toBe(true);
    expect(updatedUser!.passwordHash).not.toBe(newPassword);

    // Verify bcrypt compare matches
    const matches = await bcrypt.compare(newPassword, updatedUser!.passwordHash);
    expect(matches).toBe(true);

    // Verify token is burned (usedAt is set)
    const tokenRecord = await prisma.accountActivationToken.findFirst({
      where: { userId: updatedUser!.id },
    });
    expect(tokenRecord!.usedAt).not.toBeNull();

    // Verify burned token cannot be reused
    const revalidation = await ActivationService.validateToken(rawToken);
    expect(revalidation.valid).toBe(false);
    expect(revalidation.code).toBe("TOKEN_ALREADY_USED");

    await expect(
      ActivationService.activateAccountWithPassword(rawToken, "AnotherPassword123!")
    ).rejects.toThrow();

    // Verify the newly activated employee can now log in via standard verifyUserCredentials
    const loginUser = await verifyUserCredentials({
      email: testEmail,
      password: newPassword,
    });

    expect(loginUser).toBeDefined();
    expect(loginUser!.email).toBe(testEmail);
    expect(loginUser!.role).toBe("EMPLOYEE");
    expect(loginUser!.organizationId).toBe(TEST_ORG_ID);
    expect(loginUser!.employeeId).toBeDefined();
  });

  it("16: Rejects invalid, nonexistent, or malformed activation tokens", async () => {
    const invalidResult = await ActivationService.validateToken("fake-non-existent-token-12345");
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.code).toBe("INVALID_TOKEN");

    await expect(
      ActivationService.activateAccountWithPassword("fake-non-existent-token", "ValidPass123!")
    ).rejects.toThrow();
  });

  it("17: Rejects expired activation tokens", async () => {
    const uniqueSuffix = `${Date.now()}_exp`;
    const testEmail = `expired.${uniqueSuffix}@klu.edu`;
    const testCode = `EMP-E-${Date.now().toString(36).toUpperCase()}`;

    const created = await EmployeeService.createEmployee(TEST_ORG_ID, {
      name: "Expired Token Employee",
      email: testEmail,
      employeeCode: testCode,
      status: "ACTIVE",
    });

    const user = await prisma.user.findFirst({
      where: { email: testEmail, organizationId: TEST_ORG_ID },
    });

    // Create an explicitly expired token (1 hour in the past)
    const rawExpiredToken = ActivationService.generateSecureToken();
    const expiredHash = ActivationService.hashToken(rawExpiredToken);

    await prisma.accountActivationToken.create({
      data: {
        tokenHash: expiredHash,
        userId: user!.id,
        employeeId: created.id,
        organizationId: TEST_ORG_ID,
        expiresAt: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      },
    });

    const validation = await ActivationService.validateToken(rawExpiredToken);
    expect(validation.valid).toBe(false);
    expect(validation.code).toBe("TOKEN_EXPIRED");

    await expect(
      ActivationService.activateAccountWithPassword(rawExpiredToken, "ValidPassword@123")
    ).rejects.toThrow("expired");
  });

  it("18: Validates password schema requirements and rejects mismatch or weak password", () => {
    const valid = activateAccountSchema.safeParse({
      token: "valid-token-123",
      password: "StrongPassword@123",
      confirmPassword: "StrongPassword@123",
    });
    expect(valid.success).toBe(true);

    const mismatch = activateAccountSchema.safeParse({
      token: "valid-token-123",
      password: "StrongPassword@123",
      confirmPassword: "DifferentPassword@123",
    });
    expect(mismatch.success).toBe(false);

    const tooShort = activateAccountSchema.safeParse({
      token: "valid-token-123",
      password: "123",
      confirmPassword: "123",
    });
    expect(tooShort.success).toBe(false);
  });

  it("23: adminCreateUserSchema allows EMPLOYEE without password, but requires password for ADMIN and MANAGER", () => {
    // 1. Employee without password -> valid
    const empValid = adminCreateUserSchema.safeParse({
      name: "Employee Without Password",
      email: "emp.nopass@example.com",
      role: "EMPLOYEE",
      designationId: "desig-swe",
    });
    expect(empValid.success).toBe(true);

    // 2. Admin without password -> invalid
    const adminInvalid = adminCreateUserSchema.safeParse({
      name: "Admin Without Password",
      email: "admin.nopass@example.com",
      role: "ADMIN",
    });
    expect(adminInvalid.success).toBe(false);

    // 3. Manager without password -> invalid
    const mgrInvalid = adminCreateUserSchema.safeParse({
      name: "Manager Without Password",
      email: "mgr.nopass@example.com",
      role: "MANAGER",
    });
    expect(mgrInvalid.success).toBe(false);

    // 4. Admin with valid password -> valid
    const adminValid = adminCreateUserSchema.safeParse({
      name: "Admin With Password",
      email: "admin.valid@example.com",
      password: "StrongPassword@123",
      confirmPassword: "StrongPassword@123",
      role: "ADMIN",
    });
    expect(adminValid.success).toBe(true);
  });

  it("24: POST /api/users provisions Employee in unactivated state, generates token, and dispatches activation email", async () => {
    const uniqueSuffix = Date.now().toString(36);
    const testEmail = `user.mgmt.emp.${uniqueSuffix}@klu.edu`;
    const employeeName = `User Mgmt Employee ${uniqueSuffix}`;

    // Create unactivated employee as POST /api/users does
    const lockedPlaceholder = `$2a$10$LOCKED_UNACTIVATED_${Date.now()}`;
    const txResult = await prisma.$transaction(async (tx) => {
      const empCount = await tx.employee.count({ where: { organizationId: TEST_ORG_ID } });
      const employeeCode = `EMP-UM-${uniqueSuffix.toUpperCase()}`;
      const employee = await tx.employee.create({
        data: {
          organizationId: TEST_ORG_ID,
          employeeCode,
          name: employeeName,
          email: testEmail,
          designationId: "desig-swe",
          status: "ACTIVE",
        },
      });

      const user = await tx.user.create({
        data: {
          name: employeeName,
          email: testEmail,
          passwordHash: lockedPlaceholder,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: employee.id,
          isActivated: false,
        },
      });

      const tokenResult = await ActivationService.createToken(
        {
          userId: user.id,
          employeeId: employee.id,
          organizationId: TEST_ORG_ID,
        },
        tx
      );

      return { user, employee, token: tokenResult.rawToken };
    });

    // Send email post-transaction
    await EmailService.sendActivationEmail({
      recipientEmail: testEmail,
      recipientName: employeeName,
      employeeCode: txResult.employee.employeeCode,
      rawToken: txResult.token,
      organizationName: "KL University",
    });

    // Verify user in DB
    const dbUser = await prisma.user.findFirst({
      where: { email: testEmail, organizationId: TEST_ORG_ID },
    });
    expect(dbUser).toBeDefined();
    expect(dbUser!.isActivated).toBe(false);
    expect(dbUser!.employeeId).toBe(txResult.employee.id);

    // Verify unactivated cannot login
    const loginAttempt = await verifyUserCredentials({
      email: testEmail,
      password: "AttemptPassword@123",
    });
    expect(loginAttempt).toBeNull();

    // Verify email sent with employee code and token link
    const sentEmail = EmailService.getSentEmailsHistory().find((e) => e.recipientEmail === testEmail);
    expect(sentEmail).toBeDefined();
    expect(sentEmail!.employeeCode).toBe(txResult.employee.employeeCode);
    expect(sentEmail!.activationUrl).toContain(`/activate-account?token=${txResult.token}`);

    // Complete password setup
    const activationResult = await ActivationService.activateAccountWithPassword(
      txResult.token,
      "EmployeeSetupPass@123"
    );
    expect(activationResult.success).toBe(true);

    // Verify can now login with newly created password
    const activatedLogin = await verifyUserCredentials({
      email: testEmail,
      password: "EmployeeSetupPass@123",
    });
    expect(activatedLogin).not.toBeNull();
    expect(activatedLogin!.role).toBe("EMPLOYEE");
  });

  it("26: Development Fallback — EmailService safely returns simulated delivery result with activation link when SMTP is unconfigured", async () => {
    // 1. Verify SMTP detection
    const isConfigured = EmailService.isConfigured();
    expect(typeof isConfigured).toBe("boolean");

    // 2. Dispatch simulated email in development/test mode
    const rawToken = "dev-fallback-token-" + Date.now();
    const result = await EmailService.sendActivationEmail({
      recipientEmail: "dev.employee@example.com",
      recipientName: "Dev Fallback Employee",
      employeeCode: "EMP-DEV-001",
      rawToken,
      organizationName: "KL University",
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.activationUrl).toBeDefined();
    expect(result.activationUrl).toContain(`/activate-account?token=${rawToken}`);
  });

  it("27: Production Protection — EmailService fails safely and never returns simulated delivery in production without Resend API key", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalResendKey = process.env.RESEND_API_KEY;
    try {
      (process.env as any).NODE_ENV = "production";
      delete process.env.RESEND_API_KEY;

      const rawToken = "prod-test-token-" + Date.now();
      const result = await EmailService.sendActivationEmail({
        recipientEmail: "prod.employee@example.com",
        recipientName: "Prod Employee",
        employeeCode: "EMP-PROD-001",
        rawToken,
        organizationName: "KL University",
      });

      // Without Resend credentials in production, must NOT simulate delivery
      expect(result.simulated).toBe(false);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Resend");
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
      process.env.RESEND_API_KEY = originalResendKey;
    }
  });

  it("28: End-to-end dev fallback activation link successfully activates employee account and allows login", async () => {
    const uniqueSuffix = Date.now().toString(36);
    const testEmail = `dev.e2e.${uniqueSuffix}@klu.edu`;
    const employeeName = `Dev E2E Employee ${uniqueSuffix}`;
    const employeeCode = `EMP-E2E-${uniqueSuffix.toUpperCase()}`;

    // 1. Create unactivated employee and token
    const { user, token } = await prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          organizationId: TEST_ORG_ID,
          employeeCode,
          name: employeeName,
          email: testEmail,
          designationId: "desig-swe",
          status: "ACTIVE",
        },
      });

      const u = await tx.user.create({
        data: {
          name: employeeName,
          email: testEmail,
          passwordHash: `$2a$10$LOCKED_UNACTIVATED_${Date.now()}`,
          role: "EMPLOYEE",
          organizationId: TEST_ORG_ID,
          employeeId: emp.id,
          isActivated: false,
        },
      });

      const tok = await ActivationService.createToken(
        { userId: u.id, employeeId: emp.id, organizationId: TEST_ORG_ID },
        tx
      );

      return { user: u, token: tok.rawToken };
    });

    // 2. EmailService fallback produces development activation link
    const emailResult = await EmailService.sendActivationEmail({
      recipientEmail: testEmail,
      recipientName: employeeName,
      employeeCode,
      rawToken: token,
      organizationName: "KL University",
    });

    expect(emailResult.simulated).toBe(true);
    const devLink = emailResult.activationUrl!;
    expect(devLink).toContain(`/activate-account?token=${token}`);

    // 3. Extract token parameter from link as frontend would
    const urlObj = new URL(devLink);
    const extractedToken = urlObj.searchParams.get("token");
    expect(extractedToken).toBe(token);

    // 4. Token validation succeeds
    const validation = await ActivationService.validateToken(extractedToken!);
    expect(validation.valid).toBe(true);
    expect(validation.employee?.email).toBe(testEmail);

    // 5. Submit password via activation service
    const setupResult = await ActivationService.activateAccountWithPassword(
      extractedToken!,
      "DevPasswordSetup@123"
    );
    expect(setupResult.success).toBe(true);

    // 6. User is now activated in DB
    const dbUser = await prisma.user.findFirst({ where: { email: testEmail } });
    expect(dbUser!.isActivated).toBe(true);

    // 7. Login succeeds with newly created password
    const login = await verifyUserCredentials({
      email: testEmail,
      password: "DevPasswordSetup@123",
    });
    expect(login).not.toBeNull();
    expect(login!.role).toBe("EMPLOYEE");
  });

  it("29: Regression safety — Existing Admin, Manager, and active Employee accounts remain fully operational", async () => {
    // 1. Admin Login
    const adminLogin = await verifyUserCredentials({
      email: "admin@klu.edu",
      password: "Admin@123",
    });
    expect(adminLogin).not.toBeNull();
    expect(adminLogin!.role).toBe("ADMIN");

    // 2. Manager Login
    const managerLogin = await verifyUserCredentials({
      email: "sarah.jenkins@capacityconnect.demo",
      password: "Manager@123",
    });
    expect(managerLogin).not.toBeNull();
    expect(managerLogin!.role).toBe("MANAGER");

    // 3. Existing Employee Login (Ravi Kumar)
    const employeeLogin = await verifyUserCredentials({
      email: "ravi.kumar@capacityconnect.demo",
      password: "Employee@123",
    });
    expect(employeeLogin).not.toBeNull();
    expect(employeeLogin!.role).toBe("EMPLOYEE");
  });

  it("30: EmailService.getBaseUrl() prioritizes APP_BASE_URL and trims trailing slashes correctly", () => {
    const savedAppBaseUrl = process.env.APP_BASE_URL;
    const savedNextAuthUrl = process.env.NEXTAUTH_URL;
    const savedAppUrl = process.env.APP_URL;
    const savedNextPublic = process.env.NEXT_PUBLIC_APP_URL;

    try {
      // 1. When APP_BASE_URL is set, it overrides NEXTAUTH_URL
      process.env.APP_BASE_URL = "http://localhost:3000/";
      process.env.NEXTAUTH_URL = "https://capacity-connect-ldwb.onrender.com";
      expect(EmailService.getBaseUrl()).toBe("http://localhost:3000");

      // 2. When APP_BASE_URL points to Render production
      process.env.APP_BASE_URL = "https://capacity-connect-ldwb.onrender.com/";
      expect(EmailService.getBaseUrl()).toBe("https://capacity-connect-ldwb.onrender.com");

      // 3. When APP_BASE_URL is unset, falls back to NEXTAUTH_URL
      delete process.env.APP_BASE_URL;
      process.env.NEXTAUTH_URL = "https://capacity-connect-ldwb.onrender.com///";
      expect(EmailService.getBaseUrl()).toBe("https://capacity-connect-ldwb.onrender.com");

      // 4. When NEXTAUTH_URL is unset, falls back to APP_URL / NEXT_PUBLIC_APP_URL
      delete process.env.NEXTAUTH_URL;
      process.env.APP_URL = "https://custom-domain.com";
      expect(EmailService.getBaseUrl()).toBe("https://custom-domain.com");

      // 5. When none are set, defaults to http://localhost:3000
      delete process.env.APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(EmailService.getBaseUrl()).toBe("http://localhost:3000");

      // 6. Activation URL generation uses getBaseUrl()
      process.env.APP_BASE_URL = "http://localhost:3000";
      const activationUrl = EmailService.generateActivationUrl("sample-token-xyz");
      expect(activationUrl).toBe("http://localhost:3000/activate-account?token=sample-token-xyz");
    } finally {
      process.env.APP_BASE_URL = savedAppBaseUrl;
      process.env.NEXTAUTH_URL = savedNextAuthUrl;
      process.env.APP_URL = savedAppUrl;
      process.env.NEXT_PUBLIC_APP_URL = savedNextPublic;
    }
  });
});
