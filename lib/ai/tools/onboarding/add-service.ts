import { tool } from "ai";
import { z } from "zod";
import { addService, getSessionTenantId } from "@/lib/db/onboarding-queries";

export function createAddServiceTool(sessionId: string) {
  return tool({
    description: "Add a service to the onboarding session's business. Call once per service.",
    inputSchema: z.object({
      name: z.string().min(1).max(200).describe("Service name, e.g. 'Corte de cabello'"),
      price: z.number().nonnegative().describe("Price in MXN"),
      duration_minutes: z.number().int().positive().max(24 * 60).describe("Duration in minutes"),
      description: z.string().max(2000).optional().describe("Brief description"),
      category: z.string().max(100).optional().describe("Category grouping, e.g. 'Cortes', 'Color', 'Uñas'"),
    }),
    execute: async ({ name, price, duration_minutes, description, category }) => {
      const tenant_id = await getSessionTenantId(sessionId);
      if (!tenant_id) {
        return { error: "No tenant bound to this session. Call create_tenant first." };
      }
      const result = await addService({ tenant_id, name, price, duration_minutes, description, category });
      return { success: true, service_id: result.id };
    },
  });
}
