import { createAgentUIStreamResponse } from "ai";
import { z } from "zod";
import { getTenantBySlug, upsertConversation } from "@/lib/db/queries";
import { createChatAgent } from "@/lib/ai/agent";
import { logger } from "@/lib/logger";
import { getOrIssueSessionId } from "@/lib/security/session";
import {
  checkRateLimit,
  clientKeyFromRequest,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { scrubMessagesForLlm } from "@/lib/security/pii-scrub";
import { NextRequest } from "next/server";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().max(128).optional(),
        role: z.enum(["user", "assistant", "system", "tool", "data"]),
        parts: z.array(z.unknown()).max(64).optional(),
        content: z
          .union([z.string().max(16_000), z.array(z.unknown()).max(64)])
          .optional(),
      }),
    )
    .min(1)
    .max(60),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;

  const limit = checkRateLimit({
    key: clientKeyFromRequest(req, `chat:${tenantSlug}`),
    limit: 30,
    windowSeconds: 60,
  });
  if (!limit.ok) {
    logger.warn("chat.rate_limited", {
      tenantSlug,
      retry: limit.retryAfterSeconds,
    });
    return rateLimitResponse(limit);
  }

  try {
    const sessionId = await getOrIssueSessionId();

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      logger.info("chat.tenant_not_found", { tenantSlug });
      return Response.json({ error: "Business not found" }, { status: 404 });
    }

    const raw = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(raw);
    if (!parsed.success) {
      logger.warn("chat.invalid_body", {
        tenantId: tenant.id,
        issue_count: parsed.error.issues.length,
      });
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    logger.info("chat.start", {
      tenantId: tenant.id,
      message_count: parsed.data.messages.length,
    });

    // Scrub obvious PII (cards, RFC, CURP, long account numbers) before
    // forwarding to the third-party LLM. Phase 4.5 BLOCKER #3.
    const scrubbedMessages = scrubMessagesForLlm(parsed.data.messages);

    const agent = await createChatAgent(tenant.id, sessionId);

    return createAgentUIStreamResponse({
      agent,
      uiMessages: scrubbedMessages,
      onFinish: async ({ messages: finalMessages }) => {
        await upsertConversation(tenant.id, sessionId, finalMessages);
      },
    });
  } catch (error) {
    logger.error("chat.unhandled", {
      tenantSlug,
      message: (error as Error)?.message,
    });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
