import { tool } from "ai";
import { z } from "zod";
import { getOnboardingProgress } from "@/lib/db/onboarding-queries";

export function createGetProgressTool() {
  return tool({
    description:
      "Check the current onboarding progress — what data has been collected so far.",
    inputSchema: z.object({
      tenant_id: z.string(),
    }),
    execute: async ({ tenant_id }) => {
      return await getOnboardingProgress(tenant_id);
    },
  });
}
