import "server-only";

import { logger } from "@/lib/logger";

/**
 * Sends a WhatsApp message via Twilio's outbound Messages API.
 *
 * We use this instead of (or in addition to) the TwiML inline-reply path so
 * the webhook can return immediately and the AI agent can take longer than
 * Twilio's 15s webhook timeout. The agent runs in `waitUntil`; once it has a
 * reply, this helper sends it as a fresh outbound message.
 *
 * Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *
 * Twilio sandbox caveat: the sandbox only delivers outbound messages to phone
 * numbers that have previously joined the sandbox via the "join <code>" step.
 * If we try to send to an un-joined number, the API returns a 21408-class
 * error and the message silently disappears from the user's perspective.
 */
export type SendWhatsAppInput = {
  /** Destination in Twilio E.164-prefixed form, e.g. "whatsapp:+19175551234". */
  to: string;
  /** Message body (plain text). Twilio caps at 1600 chars for WhatsApp. */
  body: string;
};

export type SendWhatsAppResult = {
  ok: boolean;
  messageSid?: string;
  errorMessage?: string;
  status?: number;
};

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";
const MAX_BODY_LEN = 1500; // leave headroom below Twilio's 1600 cap

export async function sendWhatsAppMessage(
  input: SendWhatsAppInput,
): Promise<SendWhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    const missing = [
      !accountSid && "TWILIO_ACCOUNT_SID",
      !authToken && "TWILIO_AUTH_TOKEN",
      !from && "TWILIO_WHATSAPP_FROM",
    ]
      .filter(Boolean)
      .join(", ");
    logger.error("whatsapp.outbound.missing_env", { missing });
    return { ok: false, errorMessage: `Missing env vars: ${missing}` };
  }

  // Trim overly long messages defensively so we never get a 400 from Twilio.
  const trimmed =
    input.body.length > MAX_BODY_LEN
      ? input.body.slice(0, MAX_BODY_LEN - 1) + "…"
      : input.body;

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const url = `${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`;
  const formBody = new URLSearchParams({
    From: from,
    To: input.to,
    Body: trimmed,
  }).toString();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error("whatsapp.outbound.failed", {
        to_redacted: input.to.slice(0, 12) + "…",
        status: res.status,
        body_preview: text.slice(0, 200),
      });
      return {
        ok: false,
        status: res.status,
        errorMessage: text.slice(0, 500),
      };
    }

    const json = (await res.json().catch(() => null)) as {
      sid?: string;
      error_code?: number;
      error_message?: string;
    } | null;

    if (json?.error_code) {
      logger.error("whatsapp.outbound.twilio_error", {
        error_code: json.error_code,
        error_message: json.error_message,
      });
      return {
        ok: false,
        errorMessage: json.error_message ?? `error_code=${json.error_code}`,
      };
    }

    logger.info("whatsapp.outbound.sent", {
      message_sid: json?.sid,
      body_len: trimmed.length,
    });
    return { ok: true, messageSid: json?.sid };
  } catch (err) {
    logger.error("whatsapp.outbound.threw", {
      message: (err as Error)?.message,
    });
    return { ok: false, errorMessage: (err as Error)?.message };
  }
}
