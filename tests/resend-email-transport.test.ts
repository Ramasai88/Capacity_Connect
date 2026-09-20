import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EmailService } from "@/lib/services/email.service";

// Mock Resend SDK
const mockSend = vi.fn();
vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  };
});

describe("Resend Production Email Transport & Environment Isolation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    EmailService.clearSentEmailsHistory();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("1. In production (NODE_ENV=production), dispatches email via Resend HTTPS API", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_production_key_12345";
    process.env.RESEND_FROM_EMAIL = "Capacity Connect <custom-sender@example.com>";
    process.env.APP_BASE_URL = "https://capacity-connect-ldwb.onrender.com";

    mockSend.mockResolvedValueOnce({
      data: { id: "resend_msg_test_abc123" },
      error: null,
    });

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "employee.prod@company.com",
      recipientName: "Anita Roy",
      employeeCode: "EMP-PROD-789",
      rawToken: "raw-token-prod-xyz",
      organizationName: "KL University",
    });

    // Verify delivery result
    expect(result.success).toBe(true);
    expect(result.simulated).toBe(false);
    expect(result.messageId).toBe("resend_msg_test_abc123");
    expect(result.activationUrl).toBe(
      "https://capacity-connect-ldwb.onrender.com/activate-account?token=raw-token-prod-xyz"
    );

    // Verify Resend was called with correct payload
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sendArgs = mockSend.mock.calls[0][0];
    expect(sendArgs.from).toBe("Capacity Connect <custom-sender@example.com>");
    expect(sendArgs.to).toBe("employee.prod@company.com");
    expect(sendArgs.subject).toBe("Welcome to Capacity Connect — Activate Your Account");
    expect(sendArgs.text).toContain("EMP-PROD-789");
    expect(sendArgs.text).toContain("https://capacity-connect-ldwb.onrender.com/activate-account?token=raw-token-prod-xyz");
    expect(sendArgs.html).toContain("Anita Roy");
    expect(sendArgs.html).toContain("EMP-PROD-789");
    expect(sendArgs.html).toContain("https://capacity-connect-ldwb.onrender.com/activate-account?token=raw-token-prod-xyz");
  });

  it("2. In production, falls back to standard Resend onboarding sender if RESEND_FROM_EMAIL is unset", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key_xyz";
    delete process.env.RESEND_FROM_EMAIL;

    mockSend.mockResolvedValueOnce({
      data: { id: "resend_msg_default_from" },
      error: null,
    });

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "default.sender@company.com",
      recipientName: "Rahul Verma",
      employeeCode: "EMP-DEF-001",
      rawToken: "default-sender-token",
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].from).toBe("Capacity Connect <onboarding@resend.dev>");
  });

  it("3. In production, handles Resend API error responses gracefully without throwing", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key_xyz";

    mockSend.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Domain not verified on Resend",
        name: "validation_error",
      },
    });

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "error.test@company.com",
      recipientName: "Test User",
      employeeCode: "EMP-ERR-001",
      rawToken: "err-token",
    });

    expect(result.success).toBe(false);
    expect(result.simulated).toBe(false);
    expect(result.error).toBe("Domain not verified on Resend");
    expect(result.activationUrl).toBeDefined();
  });

  it("4. In production, handles unexpected Resend network exceptions gracefully", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.RESEND_API_KEY = "re_test_key_xyz";

    mockSend.mockRejectedValueOnce(new Error("Connection reset by peer"));

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "exception.test@company.com",
      recipientName: "Test User",
      employeeCode: "EMP-EXC-001",
      rawToken: "exc-token",
    });

    expect(result.success).toBe(false);
    expect(result.simulated).toBe(false);
    expect(result.error).toBe("Connection reset by peer");
  });

  it("5. In production without RESEND_API_KEY, safely fails without simulation", async () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "nokey@company.com",
      recipientName: "No Key User",
      employeeCode: "EMP-NOKEY-001",
      rawToken: "nokey-token",
    });

    expect(result.success).toBe(false);
    expect(result.simulated).toBe(false);
    expect(result.error).toContain("Resend API key is not configured");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("6. In development (NODE_ENV !== production), Resend is NOT invoked and SMTP/fallback is used", async () => {
    delete (process.env as any).NODE_ENV;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    process.env.RESEND_API_KEY = "re_should_not_be_used_in_dev";

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "dev.user@example.com",
      recipientName: "Dev User",
      employeeCode: "EMP-DEV-999",
      rawToken: "dev-token-999",
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.messageId?.startsWith("sim-")).toBe(true);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("7. EmailService.isConfigured() returns correct boolean based on environment", () => {
    // Production checks RESEND_API_KEY
    (process.env as any).NODE_ENV = "production";
    delete process.env.RESEND_API_KEY;
    expect(EmailService.isConfigured()).toBe(false);

    process.env.RESEND_API_KEY = "re_valid_key";
    expect(EmailService.isConfigured()).toBe(true);

    // Development checks SMTP credentials
    (process.env as any).NODE_ENV = "development";
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    expect(EmailService.isConfigured()).toBe(false);

    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_USER = "user@gmail.com";
    process.env.SMTP_PASSWORD = "app-password";
    expect(EmailService.isConfigured()).toBe(true);
  });
});
