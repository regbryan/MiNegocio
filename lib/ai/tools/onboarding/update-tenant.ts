import { tool } from "ai";
import { z } from "zod";
import { updateTenant, getSessionTenantId } from "@/lib/db/onboarding-queries";

// Allowlist: only these tenant columns may be updated by the agent.
const UPDATABLE_FIELDS = new Set([
  "address_street",
  "address_colonia",
  "address_city",
  "address_state",
  "address_zip",
  "phone",
  "whatsapp_number",
  "social_links",
  "business_hours",
  "break_times",
  "max_advance_days",
  "min_notice_hours",
  "buffer_minutes",
  "max_concurrent",
  "ai_language",
  "ai_tone",
  "ai_greeting",
  "ai_signoff",
  "ai_forbidden_topics",
  "complaint_handling",
  "auto_escalate_complaints",
  "booking_mode",
  "payment_methods",
  "tax_included",
  "extra_fee_notes",
  "first_visit_instructions",
]);

export function createUpdateTenantTool(sessionId: string) {
  return tool({
    description:
      "Update business fields for your onboarding session's tenant. Pass only the fields you want to update.",
    inputSchema: z.object({
      fields: z
        .record(z.string(), z.unknown())
        .describe(
          "Object with field names and values to update. Valid fields: address_street, address_colonia, address_city, address_state, address_zip, phone, whatsapp_number, social_links, business_hours, break_times, max_advance_days, min_notice_hours, buffer_minutes, max_concurrent, ai_language, ai_tone, ai_greeting, ai_signoff, ai_forbidden_topics, complaint_handling, auto_escalate_complaints, booking_mode, payment_methods, tax_included, extra_fee_notes, first_visit_instructions",
        ),
    }),
    execute: async ({ fields }) => {
      const tenantId = await getSessionTenantId(sessionId);
      if (!tenantId) {
        return {
          error:
            "No tenant bound to this session. Call create_tenant first before updating fields.",
        };
      }
      // Drop any fields not in the allowlist before writing.
      const safe: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(fields)) {
        if (UPDATABLE_FIELDS.has(k)) safe[k] = v;
      }
      const rejected = Object.keys(fields).filter((k) => !UPDATABLE_FIELDS.has(k));
      await updateTenant(tenantId, safe);
      return {
        success: true,
        updated_fields: Object.keys(safe),
        rejected_fields: rejected,
      };
    },
  });
}
