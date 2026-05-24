import "server-only";

const isProd = process.env.NODE_ENV === "production";

// Fields we redact unconditionally; never log raw values.
const REDACT_KEYS = new Set([
  "sessionId",
  "session_id",
  "X-Session-Id",
  "email",
  "phone",
  "full_name",
  "customer_id",
  "subject_email",
  "subject_phone",
  "subject_name",
  "messages",
  "prompt",
  "completion",
]);

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (REDACT_KEYS.has(k)) {
      out[k] = typeof v === "string" && v.length > 0 ? `<redacted:${k}>` : v;
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}

function emit(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const redacted = redact(fields) as Record<string, unknown>;
  const payload = {
    level,
    event,
    at: new Date().toISOString(),
    ...redacted,
  };
  // Structured one-line JSON; Vercel + most log shippers handle it natively.
  if (isProd) {
    console[level === "error" ? "error" : "log"](JSON.stringify(payload));
  } else {
    console[level === "error" ? "error" : "log"](`[${level}] ${event}`, payload);
  }
}

export const logger = {
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
