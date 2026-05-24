import { tool } from "ai";
import { z } from "zod";
import { addFaqEntry, getSessionTenantId } from "@/lib/db/onboarding-queries";

export function createAddFaqTool(sessionId: string) {
  return tool({
    description: "Add a FAQ entry to the onboarding session's business knowledge base.",
    inputSchema: z.object({
      question: z.string().min(1).max(1000).describe("The question customers ask"),
      answer: z.string().min(1).max(4000).describe("The answer to give"),
      category: z
        .enum(["faq", "policy", "first-visit", "access"])
        .optional()
        .describe(
          "Category: faq (general), policy (cancellation/deposits), first-visit (new customer info), access (parking/wheelchair)",
        ),
    }),
    execute: async ({ question, answer, category }) => {
      const tenant_id = await getSessionTenantId(sessionId);
      if (!tenant_id) {
        return { error: "No tenant bound to this session. Call create_tenant first." };
      }
      const result = await addFaqEntry({ tenant_id, question, answer, category });
      return { success: true, faq_id: result.id };
    },
  });
}
