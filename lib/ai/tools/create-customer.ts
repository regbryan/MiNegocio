import { tool } from "ai";
import { z } from "zod";
import { createCustomer, linkCustomerToConversation } from "@/lib/db/queries";

export function createCreateCustomerTool(tenantId: string, sessionId: string) {
  return tool({
    description:
      "Create a new customer record and link them to the current conversation.",
    inputSchema: z.object({
      full_name: z.string().describe("The customer's full name"),
      email: z.string().email().optional().describe("The customer's email address"),
    }),
    execute: async ({ full_name, email }) => {
      const customer = await createCustomer(tenantId, { full_name, email });
      await linkCustomerToConversation(tenantId, sessionId, customer.id);
      return {
        id: customer.id,
        full_name: customer.full_name,
        email: customer.email,
        status: customer.status,
        created_at: customer.created_at,
      };
    },
  });
}
