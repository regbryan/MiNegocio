import { tool } from "ai";
import { z } from "zod";
import { createTenant } from "@/lib/db/onboarding-queries";

export function createCreateTenantTool() {
  return tool({
    description:
      "Create a new business (tenant) record. Call this after collecting business name, type, and description.",
    inputSchema: z.object({
      business_name: z.string().describe("Name of the business"),
      vertical: z
        .string()
        .describe(
          "Type of business: salon, restaurant, dentist, barber, spa, vet, lawyer, accountant, tutor, other"
        ),
      description: z
        .string()
        .describe("2-3 sentence description of the business"),
    }),
    execute: async ({ business_name, vertical, description }) => {
      const result = await createTenant({
        business_name,
        vertical,
        description,
      });
      return { success: true, tenant_id: result.id, slug: result.slug };
    },
  });
}
