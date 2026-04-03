import { tool } from "ai";
import { z } from "zod";
import { updateTenant } from "@/lib/db/onboarding-queries";

export function createUpdateTenantTool() {
  return tool({
    description:
      "Update business fields. Call this progressively as you collect information. Pass only the fields you want to update.",
    inputSchema: z.object({
      tenant_id: z
        .string()
        .describe("The tenant ID returned from create_tenant"),
      fields: z
        .record(z.string(), z.unknown())
        .describe(
          "Object with field names and values to update. Valid fields: address_street, address_colonia, address_city, address_state, address_zip, phone, whatsapp_number, social_links, business_hours, break_times, max_advance_days, min_notice_hours, buffer_minutes, max_concurrent, ai_language, ai_tone, ai_greeting, ai_signoff, ai_forbidden_topics, complaint_handling, auto_escalate_complaints, booking_mode, payment_methods, tax_included, extra_fee_notes, first_visit_instructions"
        ),
    }),
    execute: async ({ tenant_id, fields }) => {
      await updateTenant(tenant_id, fields);
      return { success: true, updated_fields: Object.keys(fields) };
    },
  });
}
