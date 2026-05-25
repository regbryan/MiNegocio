import { tool } from "ai";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";
import { supabase } from "@/lib/db/client";
import {
  getCustomerById,
  getServiceById,
  getStaffById,
  getTenantById,
} from "@/lib/db/queries";
import { sendBookingConfirmation } from "@/lib/email/send-confirmation";
import { createCalendarEvent } from "@/lib/calendar/google";
import { logger } from "@/lib/logger";

export function createCreateBookingTool(
  tenantId: string,
  options?: { source?: "web" | "whatsapp" },
) {
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

      // Look up tenant for timezone (defensive: agent may pass a naive ISO
      // string like "2026-05-25T11:00:00" without an offset; that should be
      // interpreted as the tenant's local time, NOT as UTC).
      const tenantForTz = await getTenantById(tenantId);
      const tenantTz = tenantForTz?.timezone ?? "America/Mexico_City";

      const startDate = parseAsTenantTimezone(start_time, tenantTz);
      const endDate = new Date(
        startDate.getTime() + service.duration_minutes * 60 * 1000,
      );
      const normalizedStartIso = startDate.toISOString();
      const end_time = endDate.toISOString();

      const result = await supabase.rpc("book_appointment", {
        p_tenant_id: tenantId,
        p_customer_id: customer_id,
        p_service_id: service_id,
        p_start_time: normalizedStartIso,
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

      // Render the booked date/time back in the TENANT's local timezone so
      // the email + WhatsApp confirmation messages reflect what the customer
      // actually agreed to ("lunes 25 a las 11"), not whatever UTC happens
      // to be at that moment.
      const localParts = renderInTimezone(startDate, tenantTz);
      const date = localParts.date;
      const time = localParts.time;

      // Fire email + calendar in parallel, best-effort, never block agent reply.
      // waitUntil tells Vercel to keep the lambda warm just long enough to
      // finish these I/O calls AFTER the response has already been sent.
      // Without this, the runtime may freeze the function as soon as
      // create_booking returns to the agent loop, killing the email/calendar
      // promises mid-flight.
      waitUntil((async () => {
        try {
          const [customer, tenant] = await Promise.all([
            getCustomerById(customer_id),
            getTenantById(tenantId),
          ]);
          const addressLine = tenant
            ? [
                tenant.address_street,
                tenant.address_colonia,
                tenant.address_city,
              ]
                .filter(Boolean)
                .join(", ")
            : null;

          // Calendar invite + actual Google Calendar event share these timestamps.
          const calendarDescription = [
            `Servicio: ${service.name}`,
            ...(staffName ? [`Con: ${staffName}`] : []),
            ...(customer?.full_name ? [`Cliente: ${customer.full_name}`] : []),
            ...(customer?.phone ? [`Teléfono cliente: ${customer.phone}`] : []),
            "",
            `Agendado vía ${options?.source === "whatsapp" ? "WhatsApp" : "web"} con el asistente de ${tenant?.business_name ?? "MiNegocio"}.`,
          ].join("\n");

          await Promise.all([
            sendBookingConfirmation({
              bookingId,
              customerEmail: customer?.email ?? null,
              customerName: customer?.full_name ?? null,
              businessName: tenant?.business_name ?? "tu negocio",
              businessPhone: tenant?.phone ?? null,
              serviceName: service.name,
              date,
              time,
              startIso: normalizedStartIso,
              endIso: end_time,
              staffName,
              addressLine: addressLine || null,
              source: options?.source ?? "web",
            }),
            createCalendarEvent({
              bookingId,
              summary: staffName
                ? `${service.name} con ${staffName} · ${tenant?.business_name ?? ""}`.trim()
                : `${service.name} · ${tenant?.business_name ?? ""}`.trim(),
              description: calendarDescription,
              location: addressLine || null,
              startIso: normalizedStartIso,
              endIso: end_time,
              attendeeEmail: customer?.email ?? null,
              attendeeName: customer?.full_name ?? null,
            }),
          ]);
        } catch (err) {
          logger.error("create_booking.dispatch_failed", {
            booking_id: bookingId,
            message: (err as Error)?.message,
          });
        }
      })());

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

// ---------------------------------------------------------------------------
// Timezone helpers
//
// The agent often emits naive ISO strings ("2026-05-25T11:00:00") because
// it's not aware of the tenant's timezone. Naive ISO parses to UTC on the
// server, which then displays wrong in everyone's calendar. We defensively
// re-interpret naive timestamps as the tenant's local time.
// ---------------------------------------------------------------------------

/** Matches an ISO 8601 string that has an explicit timezone (Z or ±HH:MM). */
const HAS_TZ = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parse a possibly-naive ISO timestamp and return a Date object representing
 * the moment in UTC. If the input already carries a timezone, the offset is
 * trusted as-is. If the input is naive, it's treated as wall-clock time in
 * the provided IANA timezone.
 */
function parseAsTenantTimezone(input: string, timezone: string): Date {
  // Trust explicit offsets.
  if (HAS_TZ.test(input)) return new Date(input);

  // Naive — interpret in the tenant's timezone. Strategy: parse as if UTC,
  // then ask Intl for what offset the target timezone has at that moment,
  // and shift by that offset so the wall-clock time in the target tz matches
  // what the agent typed.
  const asIfUtc = new Date(input + "Z");
  if (Number.isNaN(asIfUtc.getTime())) {
    throw new Error(`Invalid ISO timestamp from agent: ${input}`);
  }
  const offsetMin = tzOffsetMinutes(asIfUtc, timezone);
  // Subtract: if the tenant tz is UTC-6 (Mexico City), offsetMin = -360.
  // The agent's "11:00" means 11:00 in Mexico City, which is 17:00 UTC.
  // asIfUtc = 11:00 UTC. We need to subtract -360 = add 360 → 17:00 UTC.
  return new Date(asIfUtc.getTime() - offsetMin * 60_000);
}

/**
 * Returns the offset (minutes from UTC) that `timezone` has at the moment
 * represented by `date`. Positive = ahead of UTC, negative = behind.
 * E.g. America/Mexico_City returns -360 year-round (no DST as of 2023).
 */
function tzOffsetMinutes(date: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const asLocalUtcMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asLocalUtcMs - date.getTime()) / 60_000);
}

/**
 * Renders a Date in the tenant's timezone as { date: 'YYYY-MM-DD', time: 'HH:MM' }
 * strings. Used so confirmation copy ("a las 11:00") reflects the wall-clock
 * time the customer agreed to, not whatever UTC happens to be at that moment.
 */
function renderInTimezone(
  date: Date,
  timezone: string,
): { date: string; time: string } {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  // en-CA formats YYYY-MM-DD by default.
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}
