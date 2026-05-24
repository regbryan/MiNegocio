import "server-only";

import { logger } from "@/lib/logger";

/**
 * Sends a WhatsApp text message via Kapso's Meta-compatible API.
 *
 * POST https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages
 * Auth: X-API-Key header (preferred) — recommended over Bearer for our use.
 *
 * Required env vars:
 *   KAPSO_API_KEY              — project API key (X-API-Key)
 *   KAPSO_PHONE_NUMBER_ID      — Kapso phone-number-id used to scope the URL
 *
 * Kapso's API mirrors Meta's WhatsApp Cloud API shape, so the request body
 * uses messaging_product / to / type / text.body verbatim. This is intentional
 * by Kapso — anyone already targeting Meta's API can swap host + auth header.
 */

export type SendWhatsAppInput = {
  /**
   * Destination phone in plain digits, NO "whatsapp:" prefix, NO leading "+".
   * Example: "19175551234". Kapso accepts E.164 with or without "+", but the
   * Meta convention used in their docs strips the "+", so we normalize.
   */
  to: string;
  /** Message body (plain text). 1600-char Meta cap; we trim defensively. */
  body: string;
};

export type SendWhatsAppResult = {
  ok: boolean;
  messageSid?: string;
  errorMessage?: string;
  status?: number;
};

const KAPSO_API_BASE = "https://api.kapso.ai/meta/whatsapp/v24.0";
const MAX_BODY_LEN = 1500;

function normalizePhone(raw: string): string {
  // Strip the "whatsapp:" prefix some sources include, then strip leading "+",
  // then strip any non-digit characters. Kapso/Meta want plain digits like
  // "15551234567".
  return raw.replace(/^whatsapp:/i, "").replace(/^\+/, "").replace(/\D/g, "");
}

export async function sendWhatsAppMessage(
  input: SendWhatsAppInput,
): Promise<SendWhatsAppResult> {
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    const missing = [
      !apiKey && "KAPSO_API_KEY",
      !phoneNumberId && "KAPSO_PHONE_NUMBER_ID",
    ]
      .filter(Boolean)
      .join(", ");
    logger.error("kapso.outbound.missing_env", { missing });
    return { ok: false, errorMessage: `Missing env vars: ${missing}` };
  }

  const trimmed =
    input.body.length > MAX_BODY_LEN
      ? input.body.slice(0, MAX_BODY_LEN - 1) + "…"
      : input.body;

  const url = `${KAPSO_API_BASE}/${encodeURIComponent(phoneNumberId)}/messages`;
  const to = normalizePhone(input.to);

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: trimmed },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error("kapso.outbound.failed", {
        to_redacted: to.slice(0, 4) + "***",
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
      messages?: { id: string }[];
      error?: { message: string; code?: number };
    } | null;

    if (json?.error) {
      logger.error("kapso.outbound.api_error", {
        code: json.error.code,
        error_message: json.error.message,
      });
      return { ok: false, errorMessage: json.error.message };
    }

    const messageSid = json?.messages?.[0]?.id;
    logger.info("kapso.outbound.sent", {
      message_sid: messageSid,
      body_len: trimmed.length,
    });
    return { ok: true, messageSid };
  } catch (err) {
    logger.error("kapso.outbound.threw", {
      message: (err as Error)?.message,
    });
    return { ok: false, errorMessage: (err as Error)?.message };
  }
}
