import { tool } from "ai";
import { z } from "zod";
import { addFaqEntry } from "@/lib/db/onboarding-queries";

export function createAddFaqTool() {
  return tool({
    description: "Add a FAQ entry to the business knowledge base.",
    inputSchema: z.object({
      tenant_id: z.string(),
      question: z.string().describe("The question customers ask"),
      answer: z.string().describe("The answer to give"),
      category: z
        .enum(["faq", "policy", "first-visit", "access"])
        .optional()
        .describe(
          "Category: faq (general), policy (cancellation/deposits), first-visit (new customer info), access (parking/wheelchair)"
        ),
    }),
    execute: async ({ tenant_id, question, answer, category }) => {
      const result = await addFaqEntry({
        tenant_id,
        question,
        answer,
        category,
      });
      return { success: true, faq_id: result.id };
    },
  });
}
