import { tool } from "ai";
import { z } from "zod";

export function createEscalateToHumanTool(tenantId: string) {
  return tool({
    description:
      "Escalate the conversation to a human agent when the AI cannot resolve the customer's issue.",
    inputSchema: z.object({
      reason: z.string().describe("Why escalation is needed"),
      summary: z.string().describe("Summary of the conversation so far"),
    }),
    execute: async ({ reason, summary }) => {
      console.log("[ESCALATION]", {
        tenant_id: tenantId,
        reason,
        summary,
        timestamp: new Date().toISOString(),
      });
      return {
        escalated: true,
        message:
          "Your request has been escalated to a human agent. Someone will follow up with you shortly.",
      };
    },
  });
}
