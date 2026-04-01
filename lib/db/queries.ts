import { supabase } from "@/lib/db/client";
import type {
  Tenant,
  Service,
  Staff,
  Customer,
  Booking,
  FaqEntry,
  Conversation,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Tenants
// ---------------------------------------------------------------------------

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data as Tenant;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export async function getServices(
  tenantId: string,
  category?: string
): Promise<Service[]> {
  let query = supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true);

  if (category !== undefined) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function getServiceById(
  serviceId: string
): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", serviceId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Service;
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export async function getStaff(tenantId: string): Promise<Staff[]> {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true);

  if (error) throw error;
  return (data ?? []) as Staff[];
}

export async function getStaffById(staffId: string): Promise<Staff | null> {
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("id", staffId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Staff;
}

// ---------------------------------------------------------------------------
// FAQ Entries
// ---------------------------------------------------------------------------

export async function getFaqEntries(
  tenantId: string,
  category?: string
): Promise<FaqEntry[]> {
  let query = supabase
    .from("faq_entries")
    .select("*")
    .eq("tenant_id", tenantId);

  if (category !== undefined) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FaqEntry[];
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function getConversation(
  tenantId: string,
  sessionId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("session_id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Conversation;
}

export async function upsertConversation(
  tenantId: string,
  sessionId: string,
  messages: unknown[]
): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .upsert(
      {
        tenant_id: tenantId,
        session_id: sessionId,
        messages,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,session_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as Conversation;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function getCustomerById(
  customerId: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Customer;
}

export async function getCustomerBySession(
  tenantId: string,
  sessionId: string
): Promise<Customer | null> {
  const conversation = await getConversation(tenantId, sessionId);
  if (!conversation?.customer_id) return null;
  return getCustomerById(conversation.customer_id);
}

export async function createCustomer(
  tenantId: string,
  data: { full_name: string; email?: string }
): Promise<Customer> {
  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      tenant_id: tenantId,
      full_name: data.full_name,
      email: data.email ?? null,
      source: "web",
      status: "lead",
    })
    .select("*")
    .single();

  if (error) throw error;
  return created as Customer;
}

export async function linkCustomerToConversation(
  tenantId: string,
  sessionId: string,
  customerId: string
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ customer_id: customerId })
    .eq("tenant_id", tenantId)
    .eq("session_id", sessionId);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function getBookingsForDate(
  tenantId: string,
  date: string
): Promise<Booking[]> {
  // Build next-day boundary for range filter
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDayStr = nextDay.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "confirmed")
    .gte("start_time", date)
    .lt("start_time", nextDayStr);

  if (error) throw error;
  return (data ?? []) as Booking[];
}

export async function createBooking(data: {
  tenant_id: string;
  customer_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  staff_id?: string;
  notes?: string;
}): Promise<Booking> {
  const { data: created, error } = await supabase
    .from("bookings")
    .insert({
      tenant_id: data.tenant_id,
      customer_id: data.customer_id,
      service_id: data.service_id,
      start_time: data.start_time,
      end_time: data.end_time,
      staff_id: data.staff_id ?? null,
      notes: data.notes ?? null,
      status: "confirmed",
      source: "web",
    })
    .select("*")
    .single();

  if (error) throw error;
  return created as Booking;
}
