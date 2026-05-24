import "server-only";

/**
 * Best-effort PII scrubbing before sending end-user content to a third-party
 * LLM provider. NOT a substitute for proper DPA + retention controls — but
 * stops the worst classes of unintended leakage (payment cards, government
 * IDs, long unbroken digit runs) from leaving our boundary as plain text.
 *
 * Patterns covered:
 *   - Luhn-valid 13–19 digit numbers (credit/debit cards)
 *   - Mexican RFC (12-13 char tax id with letters + digits + check)
 *   - Mexican CURP (18 char personal id)
 *   - Long bare digit runs (≥11 digits without separators) — likely account
 *     numbers or CLABE-like sequences
 *
 * Intentionally NOT scrubbed: names, emails, phones in standard formats —
 * the booking agent needs those to function. Those are covered by the
 * Aviso de Privacidad + sub-processor DPAs instead.
 */

const RFC_RE = /\b([A-ZÑ&]{3,4})\d{6}([A-Z\d]{3})\b/gi;
const CURP_RE =
  /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d\b/gi;
// Capture digit sequences 13-19 long, optionally with -, spaces, or dots
const CARD_RE = /\b(?:\d[ \-.]?){12,18}\d\b/g;
// Bare digit runs ≥ 11 digits (CLABE = 18, generic account)
const LONG_DIGITS_RE = /\b\d{11,}\b/g;

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0 && digits.length >= 13;
}

export function scrubPii(input: string): string {
  if (!input) return input;
  let out = input;

  out = out.replace(CARD_RE, (match) => {
    const digits = match.replace(/[ \-.]/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits)) {
      return "[REDACTED_CARD]";
    }
    return match;
  });

  out = out.replace(CURP_RE, "[REDACTED_CURP]");
  out = out.replace(RFC_RE, "[REDACTED_RFC]");

  // Apply bare-digit-run scrubbing AFTER the more specific patterns so we
  // don't double-redact what's already been replaced.
  out = out.replace(LONG_DIGITS_RE, (m) => {
    // Keep the first 2 and last 2 digits to preserve some signal.
    if (m.length <= 4) return m;
    return `${m.slice(0, 2)}…${m.slice(-2)}`;
  });

  return out;
}

/**
 * Walk a UIMessage shape and scrub all user-supplied text. Assistant + system
 * messages are passed through untouched.
 */
export function scrubMessagesForLlm<T extends { role: string }>(
  messages: T[],
): T[] {
  return messages.map((m) => {
    if (m.role !== "user") return m;
    return scrubOneMessage(m);
  });
}

function scrubOneMessage<T extends { role: string }>(m: T): T {
  // Try common shapes: { content: string }, { content: [{type:'text', text}] },
  // { parts: [{type:'text', text}] }.
  const anyM = m as unknown as Record<string, unknown>;

  if (typeof anyM.content === "string") {
    return { ...m, content: scrubPii(anyM.content) } as T;
  }

  if (Array.isArray(anyM.content)) {
    anyM.content = anyM.content.map((part) => scrubPart(part));
    return { ...m, content: anyM.content } as T;
  }

  if (Array.isArray(anyM.parts)) {
    anyM.parts = anyM.parts.map((part) => scrubPart(part));
    return { ...m, parts: anyM.parts } as T;
  }

  return m;
}

function scrubPart(part: unknown): unknown {
  if (!part || typeof part !== "object") return part;
  const p = part as Record<string, unknown>;
  if (typeof p.text === "string") {
    return { ...p, text: scrubPii(p.text) };
  }
  return p;
}
