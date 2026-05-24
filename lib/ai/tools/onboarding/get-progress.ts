import { tool } from "ai";
import { z } from "zod";
import { getOnboardingProgress, getSessionTenantId } from "@/lib/db/onboarding-queries";

export function createGetProgressTool(sessionId: string) {
  return tool({
    description: "Check the current onboarding progress for the session's business.",
    inputSchema: z.object({}),
    execute: async () => {
      const tenantId = await getSessionTenantId(sessionId);
      if (!tenantId) {
        return { error: "No tenant bound to this session. Call create_tenant first." };
      }
      return await getOnboardingProgress(tenantId);
    },
  });
}
