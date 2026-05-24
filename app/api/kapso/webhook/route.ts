import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { waitUntil } from "@vercel/functions";

import { createChatAgent } from "@/lib/ai/agent";
import {
  getConversation,
  getTenantBySlug,
  upsertConversation,
} from "@/lib/db/queries";
import { sendWhatsAppMessage } from "@/lib/kapso/send-message";
import { logger } from "@/lib/logger";

// Kapso's WhatsApp webhook handler. Mirrors the Twilio webhook we already
// have (app/api/whatsapp/webhook/route.ts) but speaks Kapso's payload and
// signature format. Both routes can coexist during migration — point the
// Kapso dashboard at /api/kapso/webhook, leave the Twilio sandbox webhook
// alone, and we can decommission Twilio once Kapso is verified green.
//
// Required env vars:
//   KAPSO_API_KEY                  — outbound auth (used by send-message.ts)
//   KAPSO_PHONE_NUMBER_ID          — outbound URL scope
//   KAPSO_WEBHOOK_SECRET           — inbound HMAC-SHA256 signature key
//   WHATSAPP_DEMO_TENANT_SLUG      — default tenant (default: "salon-maria")
//
// Optional:
//   KAPSO_VALIDATE_SIGNATURE       — "false" disables sig validation (debug only)

export const maxDuration = 60;

const DEFAULT_TENANT_SLUG =
  process.env.WHATSAPP_DEMO_TENANT_SLUG ?? "salon-maria";
const MAX_HISTORY_MESSAGES = 20;

// Events we care about. Delivery/read/failed events fire here too but we
// don't need to run the agent for them — just log and exit.
const INBOUND_EVENT = "whatsapp.message.received";

export async function POST(req: NextRequest) {
  // Read the body as raw text first so we can verify the signature against
  // the bytes Kapso signed. JSON.parse only after the signature check.
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    logger.warn("kapso.bad_body", { message: (err as Error)?.message });
    return new Response("Bad Request", { status: 400 });
  }

  if (!isSignatureValid(req, rawBody)) {
    logger.warn("kapso.invalid_signature");
    return new Response("Forbidden", { status: 403 });
  }

  let payload: KapsoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as KapsoWebhookPayload;
  } catch (err) {
    logger.warn("kapso.invalid_json", { message: (err as Error)?.message });
    return new Response("Bad Request", { status: 400 });
  }

  // Non-inbound events (delivered/read/failed) — log and ack. Kapso retries
  // if we return a non-2xx so we always 200 unless the request is malformed.
  const eventType =
    payload.event_type ?? payload.event ?? payload.type ?? "";
  if (eventType !== INBOUND_EVENT) {
    logger.info("kapso.event_ignored", { event_type: eventType });
    return new Response(null, { status: 204 });
  }

  const msg = payload.message;
  const body = msg?.text?.body?.trim() ?? "";
  const fromRaw = msg?.from ?? "";
  if (!fromRaw || !body) {
    // Diagnostic: log the actual shape so we can fix field-name guesses
    // when Kapso's payload doesn't match what we expected.
    logger.info("kapso.empty_message", {
      event_type: eventType,
      payload_keys: Object.keys(payload as object),
      message_keys: msg ? Object.keys(msg as object) : null,
      raw_preview: rawBody.slice(0, 800),
    });
    return new Response(null, { status: 204 });
  }

  // Normalize phone — Kapso sends digits (e.g. "19175551234"), but to keep
  // session_id format stable across both Twilio and Kapso we re-prefix with
  // "+" so the session key remains "wa:+1...".
  const phone = fromRaw.startsWith("+") ? fromRaw : `+${fromRaw}`;
  const sessionId = `wa:${phone}`;

  logger.info("kapso.incoming", {
    from_hash: hashPhone(phone),
    message_id: msg?.id,
    is_new_conversation: payload.is_new_conversation ?? null,
  });

  // Hand off heavy work to the background so we ack Kapso in <100ms.
  waitUntil(
    processAgentTurn({
      from: phone,
      phone,
      body,
      sessionId,
      messageId: msg?.id ?? "",
    }).catch((err) => {
      logger.error("kapso.background_failed", {
        from_hash: hashPhone(phone),
        message: (err as Error)?.message,
      });
    }),
  );

  return new Response(null, { status: 200 });
}

// ---------------------------------------------------------------------------
// Background processing
// ---------------------------------------------------------------------------

type ProcessInput = {
  from: string;
  phone: string;
  body: string;
  sessionId: string;
  messageId: string;
};

async function processAgentTurn(input: ProcessInput): Promise<void> {
  const { from, phone, body, sessionId, messageId } = input;

  const tenant = await getTenantBySlug(DEFAULT_TENANT_SLUG);
  if (!tenant) {
    logger.error("kapso.tenant_not_found", { slug: DEFAULT_TENANT_SLUG });
    await sendWhatsAppMessage({
      to: from,
      body: "Lo sentimos, el demo no está disponible en este momento.",
    });
    return;
  }

  const prior = await getConversation(tenant.id, sessionId);
  const history = sanitizeHistory(prior?.messages);

  const agent = await createChatAgent(tenant.id, sessionId, {
    source: "whatsapp",
  });

  const agentT0 = Date.now();
  let stepIndex = 0;
  let result;
  try {
    result = await agent.generate({
      messages: [...history, { role: "user", content: body }],
      onStepFinish: ({ toolCalls }) => {
        stepIndex += 1;
        const calls = (toolCalls ?? []).map((c) => c.toolName);
        logger.info("kapso.step", {
          step: stepIndex,
          elapsed_ms: Date.now() - agentT0,
          tool_calls: calls,
        });
      },
    });
  } catch (err) {
    logger.error("kapso.agent_threw", {
      from_hash: hashPhone(phone),
      message_id: messageId,
      message: (err as Error)?.message,
    });
    await sendWhatsAppMessage({ to: from, body: fallbackReply() });
    return;
  }

  logger.info("kapso.agent_done", {
    total_ms: Date.now() - agentT0,
    steps: stepIndex,
  });

  const replyText = result.text?.trim() || fallbackReply();

  const sendResult = await sendWhatsAppMessage({ to: from, body: replyText });
  if (!sendResult.ok) {
    logger.error("kapso.outbound_send_failed", {
      from_hash: hashPhone(phone),
      message_id: messageId,
      error: sendResult.errorMessage,
    });
  }

  const updated = [
    ...history,
    { role: "user", content: body },
    { role: "assistant", content: replyText },
  ].slice(-MAX_HISTORY_MESSAGES * 2);

  try {
    await upsertConversation(tenant.id, sessionId, updated);
  } catch (persistErr) {
    logger.error("kapso.persist_failed", {
      tenant_id: tenant.id,
      from_hash: hashPhone(phone),
      message: (persistErr as Error)?.message,
    });
  }
}

// ---------------------------------------------------------------------------
// Signature validation — HMAC-SHA256 over the raw JSON body
// ---------------------------------------------------------------------------

function isSignatureValid(req: NextRequest, rawBody: string): boolean {
  if (process.env.KAPSO_VALIDATE_SIGNATURE === "false") return true;

  const secret = process.env.KAPSO_WEBHOOK_SECRET;
  const signature = req.headers.get("x-webhook-signature");

  if (!secret) return false;
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf-8")
    .digest("hex");

  // Some platforms prefix the signature with "sha256=" — accept both.
  const provided = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf-8"),
      Buffer.from(provided, "utf-8"),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// History sanitization
// ---------------------------------------------------------------------------

type HistoryMessage = { role: "user" | "assistant"; content: string };

function sanitizeHistory(raw: unknown): HistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: HistoryMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      continue;
    }
    out.push({ role, content });
  }
  return out.slice(-MAX_HISTORY_MESSAGES);
}

function hashPhone(phone: string): string {
  return crypto.createHash("sha256").update(phone).digest("hex").slice(0, 12);
}

function fallbackReply(): string {
  return "Disculpa, tuvimos un problema técnico. ¿Puedes intentarlo de nuevo en un minuto?";
}

// ---------------------------------------------------------------------------
// Types — Kapso webhook payload (best-effort; see docs.kapso.ai for full spec)
// ---------------------------------------------------------------------------

type KapsoWebhookPayload = {
  // Kapso's docs reference "event_type" in some places and "event"/"type" in
  // others; we accept any of the three.
  event_type?: string;
  event?: string;
  type?: string;
  is_new_conversation?: boolean;
  phone_number_id?: string;
  message?: {
    id?: string;
    timestamp?: number;
    type?: string;
    from?: string;
    from_user_id?: string;
    username?: string;
    text?: { body?: string };
  };
  conversation?: {
    id?: string;
    phone_number?: string;
  };
};

export async function GET() {
  return new Response(
    "MiNegocio Kapso webhook. POST-only in production.",
    { status: 200 },
  );
}
