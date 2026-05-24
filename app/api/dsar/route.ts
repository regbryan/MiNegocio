import { NextRequest } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import {
  checkRateLimit,
  clientKeyFromRequest,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const DsarSchema = z.object({
  request_type: z.enum([
    "access",
    "rectification",
    "cancellation",
    "opposition",
    "deletion",
    "portability",
  ]),
  subject_name: z.string().min(1).max(200),
  subject_email: z.string().email().max(200),
  subject_phone: z.string().max(40).nullable().optional(),
  details: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const limit = checkRateLimit({
    key: clientKeyFromRequest(req, "dsar"),
    limit: 5,
    windowSeconds: 60 * 60, // 5 requests per IP per hour
  });
  if (!limit.ok) {
    logger.warn("dsar.rate_limited", { retry: limit.retryAfterSeconds });
    return rateLimitResponse(limit);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DsarSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("dsar_requests")
    .insert({
      request_type: parsed.data.request_type,
      subject_name: parsed.data.subject_name,
      subject_email: parsed.data.subject_email,
      subject_phone: parsed.data.subject_phone ?? null,
      details: parsed.data.details,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("dsar.insert_failed", { message: error.message });
    return Response.json(
      { error: "Could not record request. Email privacidad@minegocio.digital." },
      { status: 500 },
    );
  }

  logger.info("dsar.received", { id: data.id, request_type: parsed.data.request_type });
  return Response.json({ id: data.id, status: "received" }, { status: 201 });
}
