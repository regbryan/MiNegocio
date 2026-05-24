import "server-only";

/**
 * Generates a single-event ICS file (RFC 5545) for a booking.
 *
 * Plain string output; the caller is responsible for attaching it (e.g. to a
 * Resend email) with content-type `text/calendar; method=REQUEST; charset=utf-8`.
 *
 * Time semantics: `startIso` / `endIso` are full ISO timestamps with a timezone
 * offset (e.g. "2026-05-25T11:00:00-06:00"). They are emitted as UTC `Z` values
 * in DTSTART/DTEND, which is the most portable form for calendar clients.
 */
export type BuildIcsInput = {
  /** Stable identifier — Supabase booking row id is ideal. */
  uid: string;
  /** Brand / business name shown as event title prefix. */
  businessName: string;
  /** Service / appointment type, e.g. "Corte de cabello". */
  serviceName: string;
  /** ISO timestamp with offset. */
  startIso: string;
  /** ISO timestamp with offset. */
  endIso: string;
  /** Street + city, single line. */
  location?: string | null;
  /** Staff member name, if any. */
  staffName?: string | null;
  /** Customer's full name, used inside DESCRIPTION. */
  customerName?: string | null;
  /** Customer's email — becomes ATTENDEE if provided. */
  customerEmail?: string | null;
  /** Operator (Reggie) email — second ATTENDEE so it lands on his calendar too. */
  operatorEmail?: string | null;
  /** Phone number to call for changes, included in DESCRIPTION. */
  contactPhone?: string | null;
  /** Public app URL — appears in DESCRIPTION as a reschedule hint. */
  appUrl?: string | null;
};

export function buildIcs(input: BuildIcsInput): string {
  const {
    uid,
    businessName,
    serviceName,
    startIso,
    endIso,
    location,
    staffName,
    customerName,
    customerEmail,
    operatorEmail,
    contactPhone,
    appUrl,
  } = input;

  const dtstamp = toIcsUtc(new Date().toISOString());
  const dtstart = toIcsUtc(startIso);
  const dtend = toIcsUtc(endIso);

  const summary = staffName
    ? `${serviceName} con ${staffName} · ${businessName}`
    : `${serviceName} · ${businessName}`;

  const descriptionLines = [
    `Tu cita en ${businessName} está confirmada.`,
    "",
    `Servicio: ${serviceName}`,
    ...(staffName ? [`Con: ${staffName}`] : []),
    ...(customerName ? [`Cliente: ${customerName}`] : []),
    "",
    contactPhone
      ? `Para cambios o cancelaciones, responde por WhatsApp o llama a ${contactPhone}.`
      : "Para cambios o cancelaciones, responde por WhatsApp.",
    ...(appUrl ? ["", appUrl] : []),
  ];

  const attendees: string[] = [];
  if (customerEmail) {
    attendees.push(attendeeLine(customerEmail, customerName));
  }
  if (operatorEmail && operatorEmail !== customerEmail) {
    attendees.push(attendeeLine(operatorEmail, businessName));
  }

  // RFC 5545 requires CRLF line endings.
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MiNegocio//Booking//ES",
    "METHOD:REQUEST",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(uid)}@minegocio`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeIcs(summary)}`,
    ...(location ? [`LOCATION:${escapeIcs(location)}`] : []),
    `DESCRIPTION:${escapeIcs(descriptionLines.join("\n"))}`,
    `ORGANIZER;CN=${escapeIcs(businessName)}:mailto:noreply@minegocio.app`,
    ...attendees,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.flatMap(foldIcsLine).join("\r\n") + "\r\n";
}

function attendeeLine(email: string, name?: string | null): string {
  const cn = name ? `CN=${escapeIcs(name)};` : "";
  return `ATTENDEE;${cn}RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${email}`;
}

function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid ISO date for ICS: ${iso}`);
  }
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mi = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC 5545 §3.1: lines must be folded at 75 octets, continuation prefixed
// with a single space. We split on bytes, not chars, to handle UTF-8 safely.
function foldIcsLine(line: string): string[] {
  const bytes = Buffer.from(line, "utf-8");
  if (bytes.length <= 75) return [line];

  const folded: string[] = [];
  let offset = 0;
  let first = true;
  while (offset < bytes.length) {
    const chunkBytes = first ? 75 : 74; // continuation line has a leading space
    const slice = bytes.subarray(offset, offset + chunkBytes);
    folded.push(first ? slice.toString("utf-8") : " " + slice.toString("utf-8"));
    offset += chunkBytes;
    first = false;
  }
  return folded;
}

export function icsFilename(uid: string): string {
  const safe = uid.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 32) || "booking";
  return `cita-${safe}.ics`;
}
