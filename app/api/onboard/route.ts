import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { createOnboardingAgent } from "@/lib/ai/onboarding-agent";
import { logger } from "@/lib/logger";
import { getOrIssueSessionId } from "@/lib/security/session";
import {
  checkRateLimit,
  clientKeyFromRequest,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { scrubMessagesForLlm } from "@/lib/security/pii-scrub";
import { NextRequest } from "next/server";

const OnboardRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().max(128).optional(),
        role: z.enum(["user", "assistant", "system", "tool", "data"]),
        parts: z.array(z.unknown()).max(64).optional(),
        content: z.union([z.string().max(16_000), z.array(z.unknown()).max(64)]).optional(),
      }),
    )
    .min(1)
    .max(120),
});

export async function POST(req: NextRequest) {
  const limit = checkRateLimit({
    key: clientKeyFromRequest(req, "onboard"),
    limit: 20,
    windowSeconds: 60,
  });
  if (!limit.ok) {
    logger.warn("onboard.rate_limited", { retry: limit.retryAfterSeconds });
    return rateLimitResponse(limit);
  }

  try {
    const sessionId = await getOrIssueSessionId();

    const raw = await req.json().catch(() => null);
    const parsed = OnboardRequestSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn("onboard.invalid_body", { issues: parsed.error.issues.length });
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    logger.info("onboard.start", { message_count: parsed.data.messages.length });

    const scrubbedMessages = scrubMessagesForLlm(parsed.data.messages);

    // sessionId binds the onboarding tenant — model can't override (Phase 4.5).
    const agent = await createOnboardingAgent(sessionId);
    return createAgentUIStreamResponse({
      agent,
      uiMessages: scrubbedMessages,
    });
  } catch (error) {
    logger.error("onboard.unhandled", { message: (error as Error)?.message });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
