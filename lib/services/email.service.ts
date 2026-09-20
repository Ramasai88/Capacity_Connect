export interface SendActivationEmailOptions {
  recipientEmail: string;
  recipientName: string;
  employeeCode?: string;
  role?: string;
  rawToken: string;
  organizationName?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  activationUrl?: string;
  error?: string;
}

/**
 * Enterprise Email Service for Capacity Connect.
 * Dispatches account activation emails, notification alerts, and onboarding notices.
 *
 * Transports:
 * - Production (NODE_ENV === "production"): Brevo HTTPS API via BREVO_API_KEY, BREVO_FROM_EMAIL & BREVO_FROM_NAME.
 * - Development: Gmail / Custom SMTP via Nodemailer with safe simulated fallback if unconfigured.
 */
export class EmailService {
  // In-memory delivery history for test assertions & auditability
  private static sentEmailsHistory: Array<{
    recipientEmail: string;
    recipientName: string;
    employeeCode: string;
    role?: string;
    activationUrl: string;
    subject: string;
    sentAt: Date;
  }> = [];

  /**
   * Retrieves sent emails history (useful for automated testing verification).
   */
  static getSentEmailsHistory() {
    return [...this.sentEmailsHistory];
  }

  /**
   * Clears delivery history.
   */
  static clearSentEmailsHistory() {
    this.sentEmailsHistory = [];
  }

  /**
   * Constructs the absolute base URL for activation links.
   */
  static getBaseUrl(): string {
    const rawUrl =
      process.env.APP_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    return rawUrl.replace(/\/+$/, "");
  }

  /**
   * Generates the secure activation URL given a raw activation token.
   */
  static generateActivationUrl(rawToken: string): string {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}/activate-account?token=${encodeURIComponent(rawToken)}`;
  }

  /**
   * Checks whether the active transport credentials are configured.
   */
  static isConfigured(): boolean {
    if (process.env.NODE_ENV === "production") {
      console.log("[EmailService] Production Brevo config check:", {
        hasApiKey: Boolean(process.env.BREVO_API_KEY),
      });
      return Boolean(process.env.BREVO_API_KEY);
    }

    console.log("[EmailService] SMTP config check:", {
      host: Boolean(process.env.SMTP_HOST),
      user: Boolean(process.env.SMTP_USER),
      password: Boolean(process.env.SMTP_PASSWORD),
    });

    return Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    );
  }

  /**
   * Dispatches the initial account activation email to a newly created employee.
   *
   * SECURITY RULES:
   * - MUST include Employee ID
   * - MUST include secure activation link
   * - MUST include expiration notice (24 hours)
   * - MUST NOT include any permanent or temporary password
   */
  static async sendActivationEmail(
    options: SendActivationEmailOptions
  ): Promise<EmailDeliveryResult> {
    const { recipientEmail, recipientName, employeeCode, role, rawToken, organizationName } = options;
    const orgName = organizationName || "Capacity Connect";
    const code = employeeCode || "N/A";
    const activationUrl = this.generateActivationUrl(rawToken);

    const subject = `Welcome to Capacity Connect — Activate Your Account`;

    const textContent = `
Welcome to Capacity Connect, ${recipientName}!

Your employee account has been created for ${orgName}.

Employee ID: ${code}${role ? `\nRole: ${role}` : ""}

Please activate your account and create your password using the secure link below:
${activationUrl}

This activation link will expire in 24 hours.

If you did not expect this account, please contact your organization administrator immediately.

Please do not reply to this automated message.
`.trim();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
    .logo-badge { display: inline-block; background: #1e293b; color: #ffffff; font-weight: 700; font-size: 14px; padding: 6px 12px; border-radius: 6px; }
    .emp-card { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .emp-id-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
    .emp-id-value { font-size: 18px; font-family: monospace; font-weight: 700; color: #0f172a; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0; text-align: center; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
    .notice { font-size: 12px; color: #64748b; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo-badge">Capacity Connect</span>
      <h2 style="margin: 12px 0 0 0; color: #0f172a; font-size: 20px;">Welcome to ${orgName}</h2>
    </div>

    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>An authorized administrator has provisioned your workforce profile on the Capacity Connect learning &amp; capability platform.</p>

    <div class="emp-card">
      <div class="emp-id-label">Employee ID</div>
      <div class="emp-id-value">${code}</div>
      ${role ? `
      <div class="emp-id-label" style="margin-top: 10px;">Role</div>
      <div class="emp-id-value" style="font-size: 15px; font-weight: 600; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${role}</div>
      ` : ""}
    </div>

    <p>To begin, please activate your account and choose your personal password using the secure button below:</p>

    <div style="text-align: center;">
      <a href="${activationUrl}" class="btn" target="_blank">Activate Your Account &rarr;</a>
    </div>

    <p class="notice">
      <strong>Note:</strong> For security, this activation link will expire in <strong>24 hours</strong> and can only be used once.
    </p>

    <div class="footer">
      <p>If you did not expect this invitation or believe it was sent in error, please contact your organization administrator.</p>
      <p style="margin-top: 4px;">Direct link: <a href="${activationUrl}" style="color: #3b82f6; word-break: break-all;">${activationUrl}</a></p>
    </div>
  </div>
</body>
</html>
`.trim();

    // Record in memory history for testing/audit
    this.sentEmailsHistory.push({
      recipientEmail,
      recipientName,
      employeeCode: code,
      role,
      activationUrl,
      subject,
      sentAt: new Date(),
    });

    // 1. PRODUCTION TRANSPORT: Brevo HTTPS API
    if (process.env.NODE_ENV === "production") {
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (!brevoApiKey) {
        console.warn("[EmailService] ⚠️ BREVO_API_KEY is not configured in production. Account activation email was not delivered.");
        return {
          success: false,
          simulated: false,
          error: "Brevo API key is not configured in production environment.",
          activationUrl,
        };
      }

      try {
        const brevoFromEmail =
          process.env.BREVO_FROM_EMAIL ||
          "service.capacityconnect@gmail.com";
        const brevoFromName =
          process.env.BREVO_FROM_NAME ||
          "Capacity Connect";

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              email: brevoFromEmail,
              name: brevoFromName,
            },
            to: [
              {
                email: recipientEmail,
                name: recipientName,
              },
            ],
            subject,
            htmlContent,
            textContent,
          }),
        });

        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({}));
          const errorMessage =
            errorData?.message ||
            `Failed to deliver email via Brevo (HTTP ${response.status})`;
          console.error("[EmailService] Brevo email delivery failed:", errorMessage);
          return {
            success: false,
            simulated: false,
            error: errorMessage,
            activationUrl,
          };
        }

        const data: any = await response.json().catch(() => ({}));
        return {
          success: true,
          simulated: false,
          messageId: data?.messageId,
          activationUrl,
        };
      } catch (err: any) {
        console.error("[EmailService] Brevo dispatch exception:", err?.message || "Unknown error");
        return {
          success: false,
          simulated: false,
          error: err?.message || "Failed to deliver email via Brevo",
          activationUrl,
        };
      }
    }

    // 2. DEVELOPMENT TRANSPORT: Nodemailer SMTP
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || `"Capacity Connect" <no-reply@capacityconnect.internal>`;

    // If real SMTP credentials are configured, dispatch real email
    if (this.isConfigured()) {
      try {
        const nodemailerModule: any = await (
          Function('return import("nodemailer")')() as Promise<any>
        ).catch(() => null);
        const nodemailer = nodemailerModule?.default || nodemailerModule;

        if (nodemailer && typeof nodemailer.createTransport === "function") {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          const info = await transporter.sendMail({
            from: smtpFrom,
            to: recipientEmail,
            subject,
            text: textContent,
            html: htmlContent,
          });

          return {
            success: true,
            simulated: false,
            messageId: info.messageId,
            activationUrl,
          };
        }
      } catch (err: any) {
        console.error("[EmailService] SMTP email delivery failed:", err);
        return {
          success: false,
          simulated: false,
          error: err.message || "Failed to deliver email via SMTP",
          activationUrl,
        };
      }
    }

    // 3. DEVELOPMENT FALLBACK: Safe structured simulation if SMTP is unconfigured
    console.log(`[EmailService] 📧 Development fallback: Simulated activation email for: ${recipientEmail} (Employee: ${code})`);
    console.log(`[EmailService] 🔗 Development activation link: ${activationUrl}`);

    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      activationUrl,
    };
  }
}

