import { tool } from "ai";
import { z } from "zod";
import { supabase } from "@/lib/db/client";
import { getServiceById, getStaffById } from "@/lib/db/queries";

export function createCreateBookingTool(tenantId: string) {
  return tool({
    description: "Create an appointment booking for a customer.",
    inputSchema: z.object({
      customer_id: z.string().describe("The customer's ID"),
      service_id: z.string().describe("The service ID to book"),
      start_time: z.string().describe("ISO timestamp for the appointment start"),
      staff_id: z.string().optional().describe("Preferred staff member ID"),
      notes: z.string().optional().describe("Any notes for the appointment"),
    }),
    execute: async ({ customer_id, service_id, start_time, staff_id, notes }) => {
      // Calculate end_time from service duration
      const service = await getServiceById(service_id);
      if (!service) {
        return { error: "Service not found" };
      }

      const startDate = new Date(start_time);
      const endDate = new Date(startDate.getTime() + service.duration_minutes * 60 * 1000);
      const end_time = endDate.toISOString();

      const result = await supabase.rpc("book_appointment", {
        p_tenant_id: tenantId,
        p_customer_id: customer_id,
        p_service_id: service_id,
        p_start_time: start_time,
        p_end_time: end_time,
        p_staff_id: staff_id ?? null,
        p_notes: notes ?? null,
      });

      if (result.error) {
        return { error: result.error.message };
      }

      const bookingId: string = result.data?.id ?? result.data;

      // Fetch confirmation details
      const staffName = staff_id
        ? (await getStaffById(staff_id))?.name ?? null
        : null;

      const startDateTime = new Date(start_time);
      const date = startDateTime.toISOString().slice(0, 10);
      const time = startDateTime.toISOString().slice(11, 16);

      return {
        id: bookingId,
        service_name: service.name,
        date,
        time,
        ...(staffName ? { staff_name: staffName } : {}),
      };
    },
  });
}
