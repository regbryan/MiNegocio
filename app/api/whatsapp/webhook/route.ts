import { NextRequest } from "next/server";
import crypto from "node:crypto";
import { waitUntil } from "@vercel/functions";

import { createChatAgent } from "@/lib/ai/agent";
import {
  getConversation,
  getTenantBySlug,
  upsertConversation,
} from "@/lib/db/queries";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";
import { logger } from "@/lib/logger";

// Vercel function timeout. Default is 10s on Hobby (too tight for tool-loop
// agents). With the async pattern below the function returns TwiML instantly,
// and the agent work happens in waitUntil — but we still need maxDuration to
// be generous so the background promise has time to finish.
export const maxDuration = 60;

// Twilio's WhatsApp sandbox / Business API POSTs form-encoded payloads to
// this endpoint. We acknowledge synchronously with empty TwiML so Twilio
// considers the webhook delivered (well inside its 15s window). The actual
// AI reply is generated in the background and sent back to the user via
// Twilio's outbound Messages API. This decouples agent latency from Twilio's
// webhook timeout — tool-loop bookings that take 20-30s no longer fail.
//
// Required env vars:
//   TWILIO_ACCOUNT_SID         (outbound + signature validation)
//   TWILIO_AUTH_TOKEN          (outbound + signature validation)
//   TWILIO_WHATSAPP_FROM       (outbound "From")
//   WHATSAPP_DEMO_TENANT_SLUG  (default: "salon-maria")
//
// Optional env vars:
//   WHATSAPP_VALIDATE_SIGNATURE  ("false" disables validation for local testing)

const DEFAULT_TENANT_SLUG =
  process.env.WHATSAPP_DEMO_TENANT_SLUG ?? "salon-maria";

// Max recent messages we feed back into the agent for context. WhatsApp
// conversations can run long; keeping the last ~20 turns is plenty for booking
// flows and keeps prompt tokens bounded.
const MAX_HISTORY_MESSAGES = 20;

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    logger.warn("whatsapp.bad_body", { message: (err as Error)?.message });
    return twimlEmpty();
  }

  // Signature validation rejects synchronously. Anything past here is a
  // trusted Twilio request.
  if (!isSignatureValid(req, form)) {
    logger.warn("whatsapp.invalid_signature");
    return new Response("Forbidden", { status: 403 });
  }

  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "").trim();
  const profileName = String(form.get("ProfileName") ?? "");
  const messageSid = String(form.get("MessageSid") ?? "");

  if (!from || !body) {
    // Twilio status callbacks and other empty deliveries land here. Nothing
    // to process; ack and move on.
    logger.info("whatsapp.empty_message", { from, messageSid });
    return twimlEmpty();
  }

  const phone = from.replace(/^whatsapp:/, "");
  const sessionId = `wa:${phone}`;

  logger.info("whatsapp.incoming", {
    from_hash: hashPhone(phone),
    message_sid: messageSid,
    profile_name: profileName || null,
  });

  // Hand off the heavy lifting to a background promise. Vercel keeps the
  // function alive long enough for waitUntil's promise to resolve, up to
  // maxDuration. We return TwiML to Twilio immediately so its 15s clock
  // does not run against us.
  waitUntil(
    processAgentTurn({
      from,
      phone,
      body,
      sessionId,
      messageSid,
    }).catch((err) => {
      logger.error("whatsapp.background_failed", {
        from_hash: hashPhone(phone),
        message_sid: messageSid,
        message: (err as Error)?.message,
      });
    }),
  );

  return twimlEmpty();
}

// ---------------------------------------------------------------------------
// Background processing
// ---------------------------------------------------------------------------

type ProcessInput = {
  from: string;
  phone: string;
  body: string;
  sessionId: string;
  messageSid: string;
};

async function processAgentTurn(input: ProcessInput): Promise<void> {
  const { from, phone, body, sessionId, messageSid } = input;

  // Resolve tenant. For now there is a single demo tenant; future versions
  // will route by inbound number.
  const tenant = await getTenantBySlug(DEFAULT_TENANT_SLUG);
  if (!tenant) {
    logger.error("whatsapp.tenant_not_found", { slug: DEFAULT_TENANT_SLUG });
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

  // Per-step instrumentation so we can spot redundant tool calls in logs.
  const agentT0 = Date.now();
  let stepIndex = 0;
  let result;
  try {
    result = await agent.generate({
      messages: [...history, { role: "user", content: body }],
      onStepFinish: ({ toolCalls }) => {
        stepIndex += 1;
        const calls = (toolCalls ?? []).map((c) => c.toolName);
        logger.info("whatsapp.step", {
          step: stepIndex,
          elapsed_ms: Date.now() - agentT0,
          tool_calls: calls,
        });
      },
    });
  } catch (err) {
    logger.error("whatsapp.agent_threw", {
      from_hash: hashPhone(phone),
      message_sid: messageSid,
      message: (err as Error)?.message,
    });
    await sendWhatsAppMessage({ to: from, body: fallbackReply() });
    return;
  }

  const totalMs = Date.now() - agentT0;
  logger.info("whatsapp.agent_done", {
    total_ms: totalMs,
    steps: stepIndex,
  });

  const replyText = result.text?.trim() || fallbackReply();

  // Send the outbound WhatsApp reply BEFORE we worry about persistence.
  // The visible user experience matters more than transcript bookkeeping.
  const sendResult = await sendWhatsAppMessage({ to: from, body: replyText });
  if (!sendResult.ok) {
    logger.error("whatsapp.outbound_send_failed", {
      from_hash: hashPhone(phone),
      message_sid: messageSid,
      error: sendResult.errorMessage,
    });
  }

  // Persist the updated transcript so the next turn has context.
  const updated = [
    ...history,
    { role: "user", content: body },
    { role: "assistant", content: replyText },
  ].slice(-MAX_HISTORY_MESSAGES * 2);

  try {
    await upsertConversation(tenant.id, sessionId, updated);
  } catch (persistErr) {
    logger.error("whatsapp.persist_failed", {
      tenant_id: tenant.id,
      from_hash: hashPhone(phone),
      message: (persistErr as Error)?.message,
    });
  }
}

// ---------------------------------------------------------------------------
// TwiML helpers
// ---------------------------------------------------------------------------

function twimlEmpty(): Response {
  // Empty TwiML response: Twilio receives this as a successful webhook
  // delivery and does NOT send anything to the user. The actual reply goes
  // via Twilio's outbound Messages API after the agent finishes.
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function fallbackReply(): string {
  return "Disculpa, tuvimos un problema técnico. ¿Puedes intentarlo de nuevo en un minuto?";
}

// ---------------------------------------------------------------------------
// Signature validation — https://www.twilio.com/docs/usage/webhooks/webhooks-security
// ---------------------------------------------------------------------------

function isSignatureValid(req: NextRequest, form: FormData): boolean {
  if (process.env.WHATSAPP_VALIDATE_SIGNATURE === "false") return true;

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers.get("x-twilio-signature");

  if (!authToken) return false;
  if (!signature) return false;

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}${url.search}`;

  const params: string[] = [];
  for (const [k, v] of form.entries()) {
    params.push(`${k}${typeof v === "string" ? v : ""}`);
  }
  params.sort();
  const signedData = baseUrl + params.join("");

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(signedData, "utf-8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf-8"),
      Buffer.from(signature, "utf-8"),
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

export async function GET() {
  return new Response(
    "MiNegocio WhatsApp webhook. POST-only in production.",
    { status: 200 },
  );
}
