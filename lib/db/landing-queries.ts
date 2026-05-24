import "server-only";

import { supabase } from "@/lib/db/client";

/**
 * Queries used only by the marketing landing page. Read-only, best-effort,
 * always return safe fallbacks so the page never fails to render if Supabase
 * is unavailable.
 */

export async function getConfirmedBookingsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");
    if (error || count === null) return 0;
    return count;
  } catch {
    return 0;
  }
}

export type AnonymizedBooking = {
  /** First name only — last names redacted. */
  firstName: string;
  serviceName: string;
  /** Localized day label, e.g. "lunes". */
  weekdayEs: string;
  /** Localized date, e.g. "25 de mayo". */
  dateEs: string;
  /** "HH:MM" 24h, business local time. */
  time: string;
  /** Source channel for badge: "whatsapp" or "web". */
  source: "whatsapp" | "web";
};

const WEEKDAY_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MONTH_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function firstNameOnly(fullName: string | null | undefined): string {
  if (!fullName) return "Cliente";
  const first = fullName.trim().split(/\s+/)[0];
  return first || "Cliente";
}

/**
 * Returns the most recent N confirmed bookings, with customer first names
 * only and dates rendered in Spanish. Used for the "Lo estás viendo en vivo"
 * section. We never expose last names, emails, phone numbers, or anything
 * that could re-identify a customer.
 */
export async function getRecentAnonymizedBookings(
  limit = 4,
): Promise<AnonymizedBooking[]> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `id,
         start_time,
         created_at,
         customer:customers ( full_name ),
         service:services ( name )`,
      )
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    // Supabase typed PostgREST joins as nested objects; runtime shape varies.
    type Row = {
      id: string;
      start_time: string;
      created_at: string;
      customer: { full_name: string | null } | null;
      service: { name: string | null } | null;
    };
    const rows = data as unknown as Row[];

    return rows.map((row) => {
      const startUtc = new Date(row.start_time);
      // Render in Mexico City local time (UTC-6 standard, no DST).
      const local = new Date(
        startUtc.getTime() - 6 * 60 * 60 * 1000,
      );
      const weekday = WEEKDAY_ES[local.getUTCDay()] ?? "día";
      const day = local.getUTCDate();
      const month = MONTH_ES[local.getUTCMonth()] ?? "";
      const hh = String(local.getUTCHours()).padStart(2, "0");
      const mm = String(local.getUTCMinutes()).padStart(2, "0");

      return {
        firstName: firstNameOnly(row.customer?.full_name),
        serviceName: row.service?.name ?? "servicio",
        weekdayEs: weekday,
        dateEs: `${day} de ${month}`,
        time: `${hh}:${mm}`,
        // We don't store a source column; default to whatsapp for the demo.
        // When channel attribution lands, key off bookings.source.
        source: "whatsapp",
      };
    });
  } catch {
    return [];
  }
}
