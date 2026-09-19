import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/lib/services/audit.service";
import { Prisma } from "@prisma/client";

export class ActivationServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "ACTIVATION_ERROR"
  ) {
    super(message);
    this.name = "ActivationServiceError";
  }
}

export interface ActivationValidationResult {
  valid: boolean;
  code?: string;
  message?: string;
  employee?: {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

/**
 * Service managing cryptographically secure one-time account activation tokens
 * and employee self-password creation.
 */
export class ActivationService {
  /** Default token validity period: 24 hours */
  public static readonly TOKEN_EXPIRATION_HOURS = 24;

  /**
   * Generates a 256-bit cryptographically secure random token string.
   */
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Computes deterministic SHA-256 hash of a raw token for database storage and lookup.
   */
  static hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
  }

  /**
   * Creates an activation token for an employee/user account.
   */
  static async createToken(
    data: {
      userId: string;
      employeeId: string;
      organizationId: string;
      expirationHours?: number;
    },
    tx?: Prisma.TransactionClient
  ): Promise<{ rawToken: string; tokenHash: string; expiresAt: Date }> {
    const db = tx || prisma;
    const rawToken = this.generateSecureToken();
    const tokenHash = this.hashToken(rawToken);

    const hours = data.expirationHours || this.TOKEN_EXPIRATION_HOURS;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    await db.accountActivationToken.create({
      data: {
        tokenHash,
        userId: data.userId,
        employeeId: data.employeeId,
        organizationId: data.organizationId,
        expiresAt,
      },
    });

    return { rawToken, tokenHash, expiresAt };
  }

  /**
   * Validates a raw activation token server-side without mutating state.
   */
  static async validateToken(rawToken: string): Promise<ActivationValidationResult> {
    if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
      return {
        valid: false,
        code: "INVALID_TOKEN",
        message: "Activation token is missing or invalid.",
      };
    }

    const tokenHash = this.hashToken(rawToken);

    const tokenRecord = await prisma.accountActivationToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        employee: true,
        organization: true,
      },
    });

    if (!tokenRecord) {
      return {
        valid: false,
        code: "INVALID_TOKEN",
        message: "Your activation link is invalid or does not exist.",
      };
    }

    if (tokenRecord.usedAt !== null) {
      return {
        valid: false,
        code: "TOKEN_ALREADY_USED",
        message: "This activation link has already been used. Please sign in with your password.",
      };
    }

    const now = new Date();
    if (tokenRecord.expiresAt < now) {
      return {
        valid: false,
        code: "TOKEN_EXPIRED",
        message: "Your activation link has expired. Please contact your organization administrator.",
      };
    }

    return {
      valid: true,
      employee: {
        id: tokenRecord.employee.id,
        employeeCode: tokenRecord.employee.employeeCode,
        name: tokenRecord.employee.name,
        email: tokenRecord.employee.email,
      },
      organization: {
        id: tokenRecord.organization.id,
        name: tokenRecord.organization.name,
      },
    };
  }

  /**
   * Atomically executes password creation and account activation.
   *
   * SECURITY:
   * - Validates token and checks unexpired + unused within transaction
   * - Hashes password using bcrypt (cost factor 10)
   * - Marks token as used immediately to prevent replay attacks
   * - Sets user.isActivated = true
   * - Logs audit event
   */
  static async activateAccountWithPassword(
    rawToken: string,
    password: string
  ): Promise<{
    success: boolean;
    userId: string;
    employeeId: string;
    email: string;
    name: string;
    role: string;
  }> {
    if (!rawToken || rawToken.trim().length === 0) {
      throw new ActivationServiceError("Activation token is required.", 400, "MISSING_TOKEN");
    }

    if (!password || password.length < 8) {
      throw new ActivationServiceError(
        "Password must be at least 8 characters long.",
        400,
        "INVALID_PASSWORD"
      );
    }

    const tokenHash = this.hashToken(rawToken);

    return await prisma.$transaction(
      async (tx) => {
        const tokenRecord = await tx.accountActivationToken.findUnique({
          where: { tokenHash },
          include: {
            user: true,
            employee: true,
            organization: true,
          },
        });

        if (!tokenRecord) {
          throw new ActivationServiceError(
            "Your activation link is invalid or does not exist.",
            400,
            "INVALID_TOKEN"
          );
        }

        if (tokenRecord.usedAt !== null) {
          throw new ActivationServiceError(
            "This activation link has already been used. Please log in with your credentials.",
            400,
            "TOKEN_ALREADY_USED"
          );
        }

        const now = new Date();
        if (tokenRecord.expiresAt < now) {
          throw new ActivationServiceError(
            "Your activation link has expired. Please contact your administrator for a new link.",
            400,
            "TOKEN_EXPIRED"
          );
        }

        // Hash new password using canonical bcrypt cost factor 10
        const passwordHash = await bcrypt.hash(password, 10);

        // Update User account to activated status and assign new password hash
        const updatedUser = await tx.user.update({
          where: { id: tokenRecord.userId },
          data: {
            passwordHash,
            isActivated: true,
          },
        });

        // Invalidate the activation token immediately
        await tx.accountActivationToken.update({
          where: { id: tokenRecord.id },
          data: {
            usedAt: now,
          },
        });

        // Ensure employee status is ACTIVE
        if (tokenRecord.employee && tokenRecord.employee.status !== "ACTIVE") {
          await tx.employee.update({
            where: { id: tokenRecord.employeeId },
            data: { status: "ACTIVE" },
          });
        }

        // Record security audit log
        await AuditService.log({
          organizationId: tokenRecord.organizationId,
          actorId: updatedUser.id,
          actorName: updatedUser.name,
          actorRole: updatedUser.role,
          action: "USER_ACTIVATED",
          category: "AUTHENTICATION",
          status: "SUCCESS",
          targetId: updatedUser.id,
          targetName: `${updatedUser.name} (${updatedUser.email})`,
          description: `Employee ${tokenRecord.employee.name} (${tokenRecord.employee.employeeCode}) successfully activated account and created initial password.`,
          metadata: {
            email: updatedUser.email,
            employeeCode: tokenRecord.employee.employeeCode,
            role: updatedUser.role,
          },
        });

        return {
          success: true,
          userId: updatedUser.id,
          employeeId: tokenRecord.employeeId,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        };
      },
      { timeout: 15000 }
    );
  }
}
