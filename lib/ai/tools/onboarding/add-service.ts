import { tool } from "ai";
import { z } from "zod";
import { addService } from "@/lib/db/onboarding-queries";

export function createAddServiceTool() {
  return tool({
    description: "Add a service to the business. Call once per service.",
    inputSchema: z.object({
      tenant_id: z.string(),
      name: z
        .string()
        .describe("Service name, e.g. 'Corte de cabello'"),
      price: z.number().describe("Price in MXN"),
      duration_minutes: z.number().describe("Duration in minutes"),
      description: z
        .string()
        .optional()
        .describe("Brief description"),
      category: z
        .string()
        .optional()
        .describe("Category grouping, e.g. 'Cortes', 'Color', 'Uñas'"),
    }),
    execute: async ({
      tenant_id,
      name,
      price,
      duration_minutes,
      description,
      category,
    }) => {
      const result = await addService({
        tenant_id,
        name,
        price,
        duration_minutes,
        description,
        category,
      });
      return { success: true, service_id: result.id };
    },
  });
}
