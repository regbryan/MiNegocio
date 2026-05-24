import "server-only";

import { google } from "googleapis";
import { logger } from "@/lib/logger";

// Service-account-based Google Calendar integration. The portfolio demo uses
// a single calendar (Reggie's) shared explicitly with the service account.
// In the future, each tenant will link their own calendar via OAuth or Nylas.
//
// Required env vars:
//   GOOGLE_SERVICE_ACCOUNT_JSON  — the full JSON key, base64-encoded
//                                 (so multi-line JSON survives Vercel env storage)
//   GOOGLE_CALENDAR_ID           — calendar email/ID to write events to
//                                  (e.g. "reggieebryant@gmail.com")
//
// Reggie's calendar must be shared with the service-account email
// ("Make changes to events" permission) for inserts to succeed.

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

export type CreateCalendarEventInput = {
  /** Idempotency key — pass the Supabase booking row id. */
  bookingId: string;
  summary: string;
  description: string;
  location?: string | null;
  /** Full ISO timestamp with offset. */
  startIso: string;
  endIso: string;
  /** Customer email — added as attendee if provided. */
  attendeeEmail?: string | null;
  /** Customer name for the attendee record. */
  attendeeName?: string | null;
};

export type CreateCalendarEventResult = {
  eventId: string;
  htmlLink: string | null;
};

function getServiceAccountCredentials(): {
  client_email: string;
  private_key: string;
} | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const decoded = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (!parsed.client_email || !parsed.private_key) {
      logger.error("calendar.invalid_credentials", {
        reason: "missing_required_fields",
      });
      return null;
    }
    return {
      client_email: parsed.client_email,
      // Vercel sometimes mangles newlines in env vars; normalize them.
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch (err) {
    logger.error("calendar.parse_credentials_failed", {
      message: (err as Error)?.message,
    });
    return null;
  }
}

function getCalendarClient() {
  const creds = getServiceAccountCredentials();
  if (!creds) return null;

  const jwt = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: SCOPES,
  });

  return google.calendar({ version: "v3", auth: jwt });
}

/**
 * Insert a Google Calendar event. Best-effort: never throws, returns null
 * on any failure (with a logger.error). Booking flows must not depend on
 * calendar success.
 */
export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CreateCalendarEventResult | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    logger.info("calendar.skipped", { reason: "no_calendar_id" });
    return null;
  }

  const calendar = getCalendarClient();
  if (!calendar) {
    logger.info("calendar.skipped", { reason: "no_service_account" });
    return null;
  }

  try {
    const attendees =
      input.attendeeEmail
        ? [{ email: input.attendeeEmail, displayName: input.attendeeName ?? undefined }]
        : undefined;

    const response = await calendar.events.insert({
      calendarId,
      // Pass the booking id so retries are idempotent if we ever add them.
      requestBody: {
        // Google Calendar event IDs must be base32hex-ish; sanitize the booking UUID.
        id: sanitizeEventId(input.bookingId),
        summary: input.summary,
        description: input.description,
        location: input.location ?? undefined,
        start: { dateTime: input.startIso },
        end: { dateTime: input.endIso },
        attendees,
        source: { title: "MiNegocio", url: "https://minegocio-plum.vercel.app" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 60 },
            { method: "email", minutes: 24 * 60 },
          ],
        },
      },
      // sendUpdates=all → Google emails the attendees an invite; we already
      // send our own branded confirmation, so default to "none" to avoid
      // double-emailing. Override via env var if desired.
      sendUpdates:
        (process.env.GOOGLE_CALENDAR_SEND_UPDATES as
          | "all"
          | "externalOnly"
          | "none") ?? "none",
    });

    const eventId = response.data.id ?? null;
    if (!eventId) {
      logger.error("calendar.no_event_id", { booking_id: input.bookingId });
      return null;
    }
    logger.info("calendar.created", {
      booking_id: input.bookingId,
      event_id: eventId,
    });
    return { eventId, htmlLink: response.data.htmlLink ?? null };
  } catch (err) {
    const e = err as Error & { errors?: unknown };
    logger.error("calendar.insert_failed", {
      booking_id: input.bookingId,
      message: e?.message,
    });
    return null;
  }
}

function sanitizeEventId(bookingId: string): string {
  // Google Calendar event IDs: lowercase a-v, 0-9, length 5–1024.
  // Map common UUID chars to the allowed set.
  return bookingId
    .toLowerCase()
    .replace(/[^0-9a-v]/g, (c) => {
      // Hex chars w–z become a–d.
      const map: Record<string, string> = { w: "a", x: "b", y: "c", z: "d", "-": "0" };
      return map[c] ?? "0";
    })
    .padEnd(5, "0")
    .slice(0, 1024);
}
