import { NextRequest, NextResponse } from "next/server";
import { ActivationService, ActivationServiceError } from "@/lib/services/activation.service";
import { activateAccountSchema, verifyTokenQuerySchema } from "@/lib/validations/auth";

/**
 * GET /api/auth/activate?token=...
 *
 * Validates an account activation token server-side.
 * Returns public employee summary (name, email, employee code, organization) if valid.
 * Does not expose password hashes or sensitive account credentials.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get("token") || "";

    const parsed = verifyTokenQuerySchema.safeParse({ token: rawToken });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Activation token is required.",
          },
        },
        { status: 400 }
      );
    }

    const validation = await ActivationService.validateToken(parsed.data.token);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: {
            code: validation.code || "INVALID_TOKEN",
            message: validation.message || "Your activation link is invalid or has expired.",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      data: {
        employee: validation.employee,
        organization: validation.organization,
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/activate error:", error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Unable to validate activation link at this time. Please try again later.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/activate
 *
 * Completes employee self-password setup and activates the account.
 * Atomically hashes password with bcrypt, sets isActivated = true, and burns the one-time token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = activateAccountSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: firstIssue?.message || "Invalid password data.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const activationResult = await ActivationService.activateAccountWithPassword(
      token,
      password
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your account has been activated successfully.",
        data: {
          userId: activationResult.userId,
          email: activationResult.email,
          name: activationResult.name,
          role: activationResult.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof ActivationServiceError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    console.error("POST /api/auth/activate error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to activate account. Please contact your organization administrator.",
        },
      },
      { status: 500 }
    );
  }
}
