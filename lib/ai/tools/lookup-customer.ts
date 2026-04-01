import { tool } from "ai";
import { z } from "zod";
import { getCustomerBySession } from "@/lib/db/queries";

export function createLookupCustomerTool(tenantId: string, sessionId: string) {
  return tool({
    description:
      "Look up the current customer by their session. Call this at the start of every conversation.",
    inputSchema: z.object({
      session_id: z.string().describe("The session ID from the chat"),
    }),
    execute: async ({ session_id }) => {
      const customer = await getCustomerBySession(tenantId, session_id);
      if (!customer) return { found: false, customer: null };
      return {
        found: true,
        customer: {
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          total_visits: customer.total_visits,
          favorite_service: customer.favorite_service,
          favorite_staff: customer.favorite_staff,
          notes: customer.notes,
          last_visit_at: customer.last_visit_at,
        },
      };
    },
  });
}
