import { tool } from "ai";
import { z } from "zod";
import { createTenant, bindSessionTenantId } from "@/lib/db/onboarding-queries";

/**
 * Creates a tenant and binds it to the caller's onboarding session.
 * After this call, all other onboarding tools resolve `tenant_id` from the
 * session — the model never sees or passes it. (Phase 4.5 BLOCKER #1)
 */
export function createCreateTenantTool(sessionId: string) {
  return tool({
    description:
      "Create a new business (tenant) record. Call this after collecting business name, type, and description. The tenant is bound to your session — subsequent tools will operate on it automatically.",
    inputSchema: z.object({
      business_name: z
        .string()
        .min(1)
        .max(200)
        .describe("Name of the business"),
      vertical: z
        .string()
        .min(1)
        .max(60)
        .describe(
          "Type of business: salon, restaurant, dentist, barber, spa, vet, lawyer, accountant, tutor, other",
        ),
      description: z
        .string()
        .min(1)
        .max(2000)
        .describe("2-3 sentence description of the business"),
    }),
    execute: async ({ business_name, vertical, description }) => {
      const result = await createTenant({
        business_name,
        vertical,
        description,
      });
      await bindSessionTenantId(sessionId, result.id);
      return { success: true, slug: result.slug };
    },
  });
}
