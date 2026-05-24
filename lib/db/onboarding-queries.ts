import "server-only";

import { supabase } from "@/lib/db/client";

// ---------------------------------------------------------------------------
// Session ↔ tenant binding (Phase 4.5 BLOCKER #1)
// ---------------------------------------------------------------------------

/** Persist that this onboarding session owns this tenant. Idempotent. */
export async function bindSessionTenantId(
  sessionId: string,
  tenantId: string,
): Promise<void> {
  const { error } = await supabase
    .from("onboarding_sessions")
    .upsert(
      { session_id: sessionId, tenant_id: tenantId, last_seen_at: new Date().toISOString() },
      { onConflict: "session_id" },
    );
  if (error) throw error;
}

/** Resolve the tenant id this session created during onboarding. */
export async function getSessionTenantId(
  sessionId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("onboarding_sessions")
    .select("tenant_id")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return (data?.tenant_id as string | undefined) ?? null;
}

/** Record an AI escalation in a sealed table instead of stdout. */
export async function recordEscalation(data: {
  tenantId: string;
  sessionId?: string | null;
  reason: string;
  summary: string;
}): Promise<{ id: string }> {
  const { data: created, error } = await supabase
    .from("escalations")
    .insert({
      tenant_id: data.tenantId,
      session_id: data.sessionId ?? null,
      reason: data.reason,
      summary: data.summary,
    })
    .select("id")
    .single();
  if (error) throw error;
  return created as { id: string };
}

// Generate a URL-safe slug from a business name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Create a new tenant with minimal required data
export async function createTenant(data: {
  business_name: string;
  vertical: string;
  description: string;
}): Promise<{ id: string; slug: string }> {
  const slug = generateSlug(data.business_name);
  const { data: created, error } = await supabase
    .from("tenants")
    .insert({
      slug,
      business_name: data.business_name,
      vertical: data.vertical,
      description: data.description,
      // Sensible defaults
      business_hours: {},
      break_times: [],
      max_advance_days: 30,
      min_notice_hours: 2,
      buffer_minutes: 15,
      max_concurrent: 1,
      ai_language: "es",
      ai_tone: "friendly",
      ai_forbidden_topics: [],
      auto_escalate_complaints: true,
      booking_mode: "auto",
      payment_methods: [],
      tax_included: true,
      address_city: "",
      address_state: "",
    })
    .select("id, slug")
    .single();

  if (error) throw error;
  return created as { id: string; slug: string };
}

// Update tenant fields (partial update)
export async function updateTenant(
  tenantId: string,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .update(data)
    .eq("id", tenantId);
  if (error) throw error;
}

// Add a service
export async function addService(data: {
  tenant_id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description?: string;
  category?: string;
}): Promise<{ id: string }> {
  const { data: created, error } = await supabase
    .from("services")
    .insert({
      tenant_id: data.tenant_id,
      name: data.name,
      price: data.price,
      duration_minutes: data.duration_minutes,
      description: data.description ?? null,
      category: data.category ?? null,
      currency: "MXN",
      available_days: [1, 2, 3, 4, 5, 6], // Mon-Sat default
      active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created as { id: string };
}

// Add a staff member
export async function addStaffMember(data: {
  tenant_id: string;
  name: string;
  role?: string;
  service_ids?: string[];
  schedule_override?: Record<string, { open: string; close: string } | null>;
}): Promise<{ id: string }> {
  const { data: created, error } = await supabase
    .from("staff")
    .insert({
      tenant_id: data.tenant_id,
      name: data.name,
      role: data.role ?? null,
      service_ids: data.service_ids ?? [],
      schedule_override: data.schedule_override ?? null,
      active: true,
    })
    .select("id")
    .single();

  if (error) throw error;
  return created as { id: string };
}

// Add an FAQ entry
export async function addFaqEntry(data: {
  tenant_id: string;
  question: string;
  answer: string;
  category?: string;
}): Promise<{ id: string }> {
  const { data: created, error } = await supabase
    .from("faq_entries")
    .insert({
      tenant_id: data.tenant_id,
      question: data.question,
      answer: data.answer,
      category: data.category ?? "faq",
    })
    .select("id")
    .single();

  if (error) throw error;
  return created as { id: string };
}

// Get onboarding progress (what's been filled so far)
export async function getOnboardingProgress(tenantId: string): Promise<{
  tenant: Record<string, unknown> | null;
  serviceCount: number;
  staffCount: number;
  faqCount: number;
}> {
  const [tenantResult, servicesResult, staffResult, faqResult] = await Promise.all([
    supabase.from("tenants").select("*").eq("id", tenantId).single(),
    supabase.from("services").select("id").eq("tenant_id", tenantId),
    supabase.from("staff").select("id").eq("tenant_id", tenantId),
    supabase.from("faq_entries").select("id").eq("tenant_id", tenantId),
  ]);

  return {
    tenant: tenantResult.data as Record<string, unknown> | null,
    serviceCount: servicesResult.data?.length ?? 0,
    staffCount: staffResult.data?.length ?? 0,
    faqCount: faqResult.data?.length ?? 0,
  };
}
