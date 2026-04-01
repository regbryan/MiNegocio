import { tool } from "ai";
import { z } from "zod";
import { mockCalendarProvider } from "@/lib/calendar/mock-provider";

export function createCheckAvailabilityTool(tenantId: string) {
  return tool({
    description:
      "Check available appointment slots for a given date, optionally filtered by service and staff member.",
    inputSchema: z.object({
      date: z.string().describe("Date in YYYY-MM-DD format"),
      service_id: z.string().optional().describe("Filter by specific service"),
      staff_id: z.string().optional().describe("Filter by specific staff member"),
    }),
    execute: async ({ date, service_id, staff_id }) => {
      const slots = await mockCalendarProvider.getAvailableSlots(
        tenantId,
        date,
        service_id,
        staff_id
      );
      if (slots.length === 0) {
        return {
          available: false,
          message: "No availability found for the requested date.",
          slots: [],
        };
      }
      return {
        available: true,
        slots: slots.map((s) => ({ start: s.start, end: s.end })),
      };
    },
  });
}
