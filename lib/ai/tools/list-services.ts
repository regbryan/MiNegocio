import { tool } from "ai";
import { z } from "zod";
import { getServices } from "@/lib/db/queries";

export function createListServicesTool(tenantId: string) {
  return tool({
    description:
      "List available services for this business, optionally filtered by category.",
    inputSchema: z.object({
      category: z.string().optional().describe("Filter services by category"),
    }),
    execute: async ({ category }) => {
      const services = await getServices(tenantId, category);
      return services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        currency: s.currency,
        duration_minutes: s.duration_minutes,
        category: s.category,
      }));
    },
  });
}
