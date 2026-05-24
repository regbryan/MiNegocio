import { tool } from "ai";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { recordEscalation } from "@/lib/db/onboarding-queries";

export function createEscalateToHumanTool(
  tenantId: string,
  sessionId?: string,
) {
  return tool({
    description:
      "Escalate the conversation to a human agent when the AI cannot resolve the customer's issue.",
    inputSchema: z.object({
      reason: z.string().min(1).max(500).describe("Why escalation is needed"),
      summary: z.string().min(1).max(4000).describe("Summary of the conversation so far"),
    }),
    execute: async ({ reason, summary }) => {
      // Record in sealed table; do NOT log the summary to stdout (PII).
      try {
        const { id } = await recordEscalation({
          tenantId,
          sessionId: sessionId ?? null,
          reason,
          summary,
        });
        logger.warn("agent.escalate", { tenantId, escalationId: id, reason });
      } catch (e) {
        logger.error("agent.escalate_record_failed", {
          tenantId,
          message: (e as Error)?.message,
        });
      }
      return {
        escalated: true,
        message:
          "Your request has been escalated to a human agent. Someone will follow up with you shortly.",
      };
    },
  });
}
