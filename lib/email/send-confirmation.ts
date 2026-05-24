import "server-only";

import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { buildIcs, icsFilename } from "@/lib/calendar/build-ics";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// During portfolio-demo phase the sender is Resend's default
// `onboarding@resend.dev` (no domain verification required). Override with
// RESEND_FROM once a domain is verified (e.g. `MiNegocio <hola@minegocio.app>`).
const FROM_ADDRESS = process.env.RESEND_FROM ?? "MiNegocio <onboarding@resend.dev>";

// Operator who always gets CC'd for portfolio-demo visibility. Empty string disables.
const OPERATOR_CC = process.env.RESEND_OPERATOR_CC ?? "reggieebryant@gmail.com";

export type BookingConfirmationInput = {
  /** Stable booking identifier — used as the ICS UID. */
  bookingId: string;
  customerEmail: string | null | undefined;
  customerName?: string | null;
  businessName: string;
  businessPhone?: string | null;
  serviceName: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** HH:MM, 24h, business-local time. */
  time: string;
  /** ISO timestamp with offset — preferred over date/time for the calendar invite. */
  startIso?: string | null;
  endIso?: string | null;
  staffName?: string | null;
  addressLine?: string | null;
  source?: "web" | "whatsapp";
};

/**
 * Sends a booking confirmation email via Resend. Best-effort: returns null
 * (after logging) if Resend isn't configured or if there's no recipient.
 * Never throws — booking success must not depend on email delivery.
 */
export async function sendBookingConfirmation(
  input: BookingConfirmationInput,
): Promise<{ id: string } | null> {
  const recipients = collectRecipients(input.customerEmail);
  if (recipients.length === 0) {
    logger.info("email.booking.skipped", { reason: "no_recipient" });
    return null;
  }

  if (!resend) {
    logger.warn("email.booking.skipped", {
      reason: "missing_resend_api_key",
      would_send_to: recipients,
    });
    return null;
  }

  const subject = `Tu cita en ${input.businessName} está confirmada`;
  const html = renderBookingEmail(input);
  const text = renderBookingEmailText(input);

  // ICS attachment — universal calendar invite. Best-effort: if start/end
  // ISO timestamps weren't supplied, skip the attachment but still send the email.
  const attachments = buildAttachments(input);

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
      text,
      headers: { "X-Source": input.source ?? "web" },
      attachments,
    });
    if (result.error) {
      logger.error("email.booking.send_failed", {
        recipients,
        message: result.error.message,
      });
      return null;
    }
    logger.info("email.booking.sent", {
      id: result.data?.id,
      recipients,
      source: input.source,
    });
    return result.data ? { id: result.data.id } : null;
  } catch (err) {
    logger.error("email.booking.threw", {
      recipients,
      message: (err as Error)?.message,
    });
    return null;
  }
}

function buildAttachments(
  input: BookingConfirmationInput,
):
  | { filename: string; content: string; contentType?: string }[]
  | undefined {
  if (!input.startIso || !input.endIso) return undefined;
  try {
    const ics = buildIcs({
      uid: input.bookingId,
      businessName: input.businessName,
      serviceName: input.serviceName,
      startIso: input.startIso,
      endIso: input.endIso,
      location: input.addressLine ?? null,
      staffName: input.staffName ?? null,
      customerName: input.customerName ?? null,
      customerEmail: input.customerEmail ?? null,
      operatorEmail: OPERATOR_CC || null,
      contactPhone: input.businessPhone ?? null,
      appUrl: "https://minegocio-plum.vercel.app",
    });
    return [
      {
        filename: icsFilename(input.bookingId),
        content: Buffer.from(ics, "utf-8").toString("base64"),
        contentType: "text/calendar; method=REQUEST; charset=utf-8",
      },
    ];
  } catch (err) {
    logger.warn("email.booking.ics_build_failed", {
      booking_id: input.bookingId,
      message: (err as Error)?.message,
    });
    return undefined;
  }
}

function collectRecipients(customerEmail: string | null | undefined): string[] {
  const set = new Set<string>();
  if (customerEmail && isValidEmail(customerEmail)) {
    set.add(customerEmail.toLowerCase());
  }
  if (OPERATOR_CC && isValidEmail(OPERATOR_CC)) {
    set.add(OPERATOR_CC.toLowerCase());
  }
  return [...set];
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// ---------------------------------------------------------------------------
// Templates — inlined HTML for max email-client compatibility. Brand colors
// pulled from DESIGN.md (teal #48a890, dark canvas #0f0f0f, ink #ffffff).
// ---------------------------------------------------------------------------

function renderBookingEmail(input: BookingConfirmationInput): string {
  const {
    businessName,
    serviceName,
    date,
    time,
    staffName,
    addressLine,
    source,
  } = input;

  const niceDate = formatSpanishDate(date);
  const sourceBadge =
    source === "whatsapp"
      ? '<span style="display:inline-block;background:#0f0f0f;color:#48a890;font-size:12px;padding:4px 10px;border-radius:9999px;letter-spacing:0.04em;text-transform:uppercase">Vía WhatsApp</span>'
      : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(businessName)} — Cita confirmada</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.55">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0f0f0f;border:1px solid #262626;border-radius:20px;overflow:hidden">
          <tr>
            <td style="padding:32px 32px 8px">
              ${sourceBadge}
              <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.2;letter-spacing:-0.02em;color:#ffffff">Tu cita está confirmada</h1>
              <p style="margin:0;color:#a3a3a3;font-size:15px">${escapeHtml(businessName)} te espera el <strong style="color:#ffffff">${escapeHtml(niceDate)}</strong> a las <strong style="color:#ffffff">${escapeHtml(time)}</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#171717;border-radius:12px">
                <tr><td style="padding:16px 18px;border-bottom:1px solid #262626"><div style="color:#737373;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:4px">Servicio</div><div style="color:#ffffff;font-size:15px">${escapeHtml(serviceName)}</div></td></tr>
                <tr><td style="padding:16px 18px;${staffName ? "border-bottom:1px solid #262626" : ""}"><div style="color:#737373;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:4px">Cuándo</div><div style="color:#ffffff;font-size:15px">${escapeHtml(niceDate)} · ${escapeHtml(time)} h</div></td></tr>
                ${staffName ? `<tr><td style="padding:16px 18px;${addressLine ? "border-bottom:1px solid #262626" : ""}"><div style="color:#737373;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:4px">Con</div><div style="color:#ffffff;font-size:15px">${escapeHtml(staffName)}</div></td></tr>` : ""}
                ${addressLine ? `<tr><td style="padding:16px 18px"><div style="color:#737373;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:4px">Dónde</div><div style="color:#ffffff;font-size:15px">${escapeHtml(addressLine)}</div></td></tr>` : ""}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px">
              <p style="margin:16px 0 0;color:#a3a3a3;font-size:14px">Adjunto encontrarás un archivo <strong style="color:#ffffff">.ics</strong>. Ábrelo para guardar esta cita en tu calendario (Google, Apple o Outlook).</p>
              <p style="margin:12px 0 0;color:#a3a3a3;font-size:14px">¿Necesitas cambiar la cita? Respóndele al asistente de ${escapeHtml(businessName)} por el mismo canal donde la agendaste.</p>
              <p style="margin:24px 0 0;color:#525252;font-size:12px;border-top:1px solid #262626;padding-top:16px">Este correo lo manda <strong style="color:#737373;font-weight:500">MiNegocio</strong>, la plataforma que ${escapeHtml(businessName)} usa para atender por WhatsApp y agendar citas.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderBookingEmailText(input: BookingConfirmationInput): string {
  const { businessName, serviceName, date, time, staffName, addressLine } =
    input;
  const niceDate = formatSpanishDate(date);
  const lines = [
    `Tu cita en ${businessName} está confirmada.`,
    "",
    `Servicio: ${serviceName}`,
    `Cuándo: ${niceDate} · ${time} h`,
  ];
  if (staffName) lines.push(`Con: ${staffName}`);
  if (addressLine) lines.push(`Dónde: ${addressLine}`);
  lines.push(
    "",
    `¿Necesitas cambiar la cita? Respóndele al asistente de ${businessName} por el mismo canal donde la agendaste.`,
    "",
    "— MiNegocio",
  );
  return lines.join("\n");
}

function formatSpanishDate(iso: string): string {
  // Parses "YYYY-MM-DD" without timezone surprises.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("es-419", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
