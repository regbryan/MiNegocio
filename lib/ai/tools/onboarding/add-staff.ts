import { tool } from "ai";
import { z } from "zod";
import { addStaffMember } from "@/lib/db/onboarding-queries";

export function createAddStaffTool() {
  return tool({
    description: "Add a team member to the business.",
    inputSchema: z.object({
      tenant_id: z.string(),
      name: z.string().describe("Staff member's name"),
      role: z
        .string()
        .optional()
        .describe("Their role, e.g. 'Estilista', 'Colorista', 'Barbero'"),
      service_ids: z
        .array(z.string())
        .optional()
        .describe("Array of service IDs they can perform"),
      schedule_override: z
        .record(
          z.string(),
          z.union([
            z.object({ open: z.string(), close: z.string() }),
            z.null(),
          ])
        )
        .optional()
        .describe(
          "Per-day schedule override. Keys '0'-'6' (0=Sunday). Null means day off."
        ),
    }),
    execute: async ({
      tenant_id,
      name,
      role,
      service_ids,
      schedule_override,
    }) => {
      const result = await addStaffMember({
        tenant_id,
        name,
        role,
        service_ids,
        schedule_override,
      });
      return { success: true, staff_id: result.id };
    },
  });
}
