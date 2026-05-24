import { tool } from "ai";
import { z } from "zod";
import { addStaffMember, getSessionTenantId } from "@/lib/db/onboarding-queries";

export function createAddStaffTool(sessionId: string) {
  return tool({
    description: "Add a team member to the onboarding session's business.",
    inputSchema: z.object({
      name: z.string().min(1).max(200).describe("Staff member's name"),
      role: z.string().max(100).optional().describe("Their role, e.g. 'Estilista', 'Colorista', 'Barbero'"),
      service_ids: z.array(z.string()).max(50).optional().describe("Array of service IDs they can perform"),
      schedule_override: z
        .record(
          z.string(),
          z.union([z.object({ open: z.string(), close: z.string() }), z.null()]),
        )
        .optional()
        .describe("Per-day schedule override. Keys '0'-'6' (0=Sunday). Null means day off."),
    }),
    execute: async ({ name, role, service_ids, schedule_override }) => {
      const tenant_id = await getSessionTenantId(sessionId);
      if (!tenant_id) {
        return { error: "No tenant bound to this session. Call create_tenant first." };
      }
      const result = await addStaffMember({ tenant_id, name, role, service_ids, schedule_override });
      return { success: true, staff_id: result.id };
    },
  });
}
