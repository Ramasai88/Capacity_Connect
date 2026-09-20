import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EmailService } from "@/lib/services/email.service";

describe("Brevo Production Email Transport & Environment Isolation", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    EmailService.clearSentEmailsHistory();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  it("1. In production (NODE_ENV=production), dispatches email via Brevo HTTPS API with exact endpoint, headers, and body", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.BREVO_API_KEY = "xkeysib-mock-test-key-12345";
    process.env.BREVO_FROM_EMAIL = "custom.sender@company.com";
    process.env.BREVO_FROM_NAME = "Custom Org Sender";
    process.env.APP_BASE_URL = "https://capacity-connect-ldwb.onrender.com";

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ messageId: "<brevo-msg-id-123@smtp-relay.mailin.fr>" }),
    });
    global.fetch = mockFetch;

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "employee.prod@company.com",
      recipientName: "Anita Roy",
      employeeCode: "EMP-PROD-789",
      role: "Software Developer",
      rawToken: "raw-token-prod-xyz",
      organizationName: "KL University",
    });

    // Verify delivery result
    expect(result.success).toBe(true);
    expect(result.simulated).toBe(false);
    expect(result.messageId).toBe("<brevo-msg-id-123@smtp-relay.mailin.fr>");
    expect(result.activationUrl).toBe(
      "https://capacity-connect-ldwb.onrender.com/activate-account?token=raw-token-prod-xyz"
    );

    // Verify fetch was called exactly once with Brevo API endpoint
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, requestInit] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(requestInit.method).toBe("POST");
    expect(requestInit.headers).toEqual({
      accept: "application/json",
      "api-key": "xkeysib-mock-test-key-12345",
      "content-type": "application/json",
    });

    const parsedBody = JSON.parse(requestInit.body);
    expect(parsedBody.sender).toEqual({
      email: "custom.sender@company.com",
      name: "Custom Org Sender",
    });
    expect(parsedBody.to).toEqual([
      {
        email: "employee.prod@company.com",
        name: "Anita Roy",
      },
    ]);
    expect(parsedBody.subject).toBe("Welcome to Capacity Connect — Activate Your Account");
    expect(parsedBody.textContent).toContain("EMP-PROD-789");
    expect(parsedBody.textContent).toContain("Role: Software Developer");
    expect(parsedBody.textContent).toContain("https://capacity-connect-ldwb.onrender.com/activate-account?token=raw-token-prod-xyz");
    expect(parsedBody.htmlContent).toContain("Anita Roy");
    expect(parsedBody.htmlContent).toContain("EMP-PROD-789");
    expect(parsedBody.htmlContent).toContain("Role");
    expect(parsedBody.htmlContent).toContain("Software Developer");
    expect(parsedBody.htmlContent).toContain("https://capacity-connect-ldwb.onrender.com/activate-account?token=raw-token-prod-xyz");
  });

  it("2. In production, falls back to default Brevo sender email and name if environment variables are unset", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.BREVO_API_KEY = "xkeysib-test-key-default";
    delete process.env.BREVO_FROM_EMAIL;
    delete process.env.BREVO_FROM_NAME;

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ messageId: "<brevo-default-from-msg>" }),
    });
    global.fetch = mockFetch;

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "default.sender@company.com",
      recipientName: "Rahul Verma",
      employeeCode: "EMP-DEF-001",
      rawToken: "default-sender-token",
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const parsedBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(parsedBody.sender).toEqual({
      email: "service.capacityconnect@gmail.com",
      name: "Capacity Connect",
    });
  });

  it("3. In production, handles Brevo non-2xx API error responses safely without throwing or exposing secrets", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.BREVO_API_KEY = "xkeysib-test-secret-123456";

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        code: "invalid_parameter",
        message: "Sender email is not authenticated in Brevo account",
      }),
    });
    global.fetch = mockFetch;

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "error.test@company.com",
      recipientName: "Test User",
      employeeCode: "EMP-ERR-001",
      rawToken: "err-token",
    });

    expect(result.success).toBe(false);
    expect(result.simulated).toBe(false);
    expect(result.error).toBe("Sender email is not authenticated in Brevo account");
    expect(result.activationUrl).toBeDefined();

    // Verify secret is not in the error message or console logs
    expect(result.error).not.toContain("xkeysib-test-secret-123456");
    consoleSpy.mockRestore();
  });

  it("4. In production, handles unexpected network/fetch exceptions gracefully without exposing secrets", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.BREVO_API_KEY = "xkeysib-test-secret-123456";

    const mockFetch = vi.fn().mockRejectedValueOnce(new Error("fetch failed: ECONNRESET"));
    global.fetch = mockFetch;

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "exception.test@company.com",
      recipientName: "Test User",
      employeeCode: "EMP-EXC-001",
      rawToken: "exc-token",
    });

    expect(result.success).toBe(false);
    expect(result.simulated).toBe(false);
    expect(result.error).toBe("fetch failed: ECONNRESET");
    expect(result.error).not.toContain("xkeysib-test-secret-123456");
    consoleSpy.mockRestore();
  });

  it("5. In production without BREVO_API_KEY, safely fails without simulation", async () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.BREVO_API_KEY;

    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "nokey@company.com",
      recipientName: "No Key User",
      employeeCode: "EMP-NOKEY-001",
      rawToken: "nokey-token",
    });

    expect(result.success).toBe(false);
    expect(result.simulated).toBe(false);
    expect(result.error).toContain("Brevo API key is not configured");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("6. In development (NODE_ENV !== production), Brevo HTTPS API is NOT invoked and development fallback is used", async () => {
    delete (process.env as any).NODE_ENV;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;
    process.env.BREVO_API_KEY = "xkeysib-should-not-be-called-in-dev";

    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const result = await EmailService.sendActivationEmail({
      recipientEmail: "dev.user@example.com",
      recipientName: "Dev User",
      employeeCode: "EMP-DEV-999",
      rawToken: "dev-token-999",
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.messageId?.startsWith("sim-")).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("7. EmailService.isConfigured() returns correct boolean based on environment", () => {
    // Production checks BREVO_API_KEY
    (process.env as any).NODE_ENV = "production";
    delete process.env.BREVO_API_KEY;
    expect(EmailService.isConfigured()).toBe(false);

    process.env.BREVO_API_KEY = "xkeysib-valid-key";
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
