import { NextRequest, NextResponse } from "next/server";
import { authenticateApi } from "@/lib/auth/session";
import { AIAssistantService } from "@/lib/services/ai-assistant.service";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

/**
 * POST /api/chat
 * Isolated, read-only AI Learning Assistant endpoint.
 * RBAC & tenant boundaries are strictly verified before data retrieval.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApi(["ADMIN", "MANAGER", "EMPLOYEE"]);
    if (!auth.authorized || !auth.user || !auth.organizationId) {
      return auth.response || NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message || "Invalid chat request format.",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const result = await AIAssistantService.handleUserChat(
      auth.organizationId,
      auth.user,
      parsed.data.message,
      parsed.data.history || []
    );

    return NextResponse.json({
      success: true,
      reply: result.reply,
      suggestions: result.suggestions,
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "I'm temporarily unable to process your question. Please try again in a moment.",
        },
      },
      { status: 500 }
    );
  }
}
