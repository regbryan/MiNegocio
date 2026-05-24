import { NextRequest } from "next/server";
import crypto from "node:crypto";

import { createChatAgent } from "@/lib/ai/agent";

// Vercel function timeout. Default is 10s on Hobby (too tight for tool-loop
// agents). Twilio's own webhook timeout is 15s, so we set this just under
// that. Pro/Enterprise plans cap at 60s. See:
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 30;
import {
  getConversation,
  getTenantBySlug,
  upsertConversation,
} from "@/lib/db/queries";
import { logger } from "@/lib/logger";

// Twilio's WhatsApp sandbox / Business API POSTs form-encoded payloads to
// this endpoint. We respond with TwiML so Twilio sends the reply over WhatsApp.
// Required env vars:
//   TWILIO_AUTH_TOKEN          (for request-signature validation)
//   WHATSAPP_DEMO_TENANT_SLUG  (default: "salon-maria")
//
// Optional env vars:
//   WHATSAPP_VALIDATE_SIGNATURE  ("false" disables validation for local testing)

const DEFAULT_TENANT_SLUG =
  process.env.WHATSAPP_DEMO_TENANT_SLUG ?? "salon-maria";

// Max recent messages we feed back into the agent for context. WhatsApp
// conversations can run long; keeping the last ~20 turns is plenty for booking flows
// and keeps prompt tokens bounded.
const MAX_HISTORY_MESSAGES = 20;

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    logger.warn("whatsapp.bad_body", { message: (err as Error)?.message });
    return twimlEmpty();
  }

  // ---------- Twilio signature validation ----------
  if (!isSignatureValid(req, form)) {
    logger.warn("whatsapp.invalid_signature");
    return new Response("Forbidden", { status: 403 });
  }

  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "").trim();
  const profileName = String(form.get("ProfileName") ?? "");
  const messageSid = String(form.get("MessageSid") ?? "");

  if (!from || !body) {
    logger.info("whatsapp.empty_message", { from, messageSid });
    return twimlEmpty();
  }

  const phone = from.replace(/^whatsapp:/, "");

  try {
    const tenant = await getTenantBySlug(DEFAULT_TENANT_SLUG);
    if (!tenant) {
      logger.error("whatsapp.tenant_not_found", { slug: DEFAULT_TENANT_SLUG });
      return twiml(
        "Lo sentimos, el demo no está disponible en este momento. Inténtalo más tarde.",
      );
    }

    // Session = phone number. One WhatsApp number → one continuing conversation per tenant.
    const sessionId = `wa:${phone}`;

    // Pull prior conversation messages, trimmed to the most recent slice.
    const prior = await getConversation(tenant.id, sessionId);
    const history = sanitizeHistory(prior?.messages);

    logger.info("whatsapp.incoming", {
      tenant_id: tenant.id,
      from_hash: hashPhone(phone),
      message_sid: messageSid,
      profile_name: profileName || null,
      history_count: history.length,
    });

    const agent = await createChatAgent(tenant.id, sessionId, {
      source: "whatsapp",
    });

    // Instrumentation: log every tool call + its latency so we can spot
    // redundant work in the agent loop (the main cause of slow turns).
    const agentT0 = Date.now();
    let stepIndex = 0;
    const result = await agent.generate({
      messages: [...history, { role: "user", content: body }],
      onStepFinish: ({ toolCalls }) => {
        stepIndex += 1;
        const elapsedMs = Date.now() - agentT0;
        const calls = (toolCalls ?? []).map((c) => c.toolName);
        logger.info("whatsapp.step", {
          step: stepIndex,
          elapsed_ms: elapsedMs,
          tool_calls: calls,
        });
      },
    });
    const agentTotalMs = Date.now() - agentT0;
    logger.info("whatsapp.agent_done", {
      total_ms: agentTotalMs,
      steps: stepIndex,
    });

    const replyText = result.text?.trim() || fallbackReply();

    // Persist the updated transcript (history + this user turn + the assistant reply).
    const updated = [
      ...history,
      { role: "user", content: body },
      { role: "assistant", content: replyText },
    ].slice(-MAX_HISTORY_MESSAGES * 2); // keep headroom

    try {
      await upsertConversation(tenant.id, sessionId, updated);
    } catch (persistErr) {
      logger.error("whatsapp.persist_failed", {
        tenant_id: tenant.id,
        message: (persistErr as Error)?.message,
      });
    }

    return twiml(replyText);
  } catch (err) {
    logger.error("whatsapp.unhandled", {
      from_hash: hashPhone(phone),
      message: (err as Error)?.message,
    });
    return twiml(fallbackReply());
  }
}

// ---------------------------------------------------------------------------
// TwiML helpers
// ---------------------------------------------------------------------------

function twiml(messageText: string): Response {
  const escaped = escapeXml(messageText);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function twimlEmpty(): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

  if (!authToken) {
    // Until the env var is set we reject — better than accepting unsigned
    // traffic to a tool-loop agent.
    return false;
  }
  if (!signature) return false;

  // Twilio's algorithm: concatenate the full URL + the form params sorted
  // by key (key+value, no separator), HMAC-SHA1 with auth token, base64.
  const url = new URL(req.url);
  // Twilio uses the publicly-visible URL (protocol + host + path). When deployed
  // behind a proxy, NextRequest.url already reflects the public URL.
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
  // Don't log raw phone numbers. Hash for correlation only.
  return crypto.createHash("sha256").update(phone).digest("hex").slice(0, 12);
}

// Twilio expects an explicit GET response too (used during webhook setup probes).
export async function GET() {
  return new Response(
    "MiNegocio WhatsApp webhook. POST-only in production.",
    { status: 200 },
  );
}
