// ============================================================
// MiNegocio — Shared TypeScript Types
// Matches the database schema exactly. All date/timestamp
// fields are typed as string (DB returns ISO strings).
// ============================================================

// ------------------------------------------------------------
// Primitive building blocks
// ------------------------------------------------------------

export interface BreakTime {
  days: number[];
  start: string;
  end: string;
  label?: string;
}

/** Keys "0"–"6" where 0 = Sunday. Null means closed that day. */
export type BusinessHours = Record<string, { open: string; close: string } | null>;

// ------------------------------------------------------------
// Tenant
// ------------------------------------------------------------

export interface Tenant {
  id: string;
  slug: string;
  business_name: string;
  vertical: string;
  description: string;
  address_street: string | null;
  address_colonia: string | null;
  address_city: string;
  address_state: string;
  address_zip: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  social_links: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    google_maps?: string;
  } | null;
  /** Keys "0"–"6", 0 = Sunday. Null value means closed that day. */
  business_hours: BusinessHours;
  break_times: BreakTime[];
  max_advance_days: number;
  min_notice_hours: number;
  buffer_minutes: number;
  max_concurrent: number;
  ai_language: string;
  ai_tone: string;
  ai_greeting: string | null;
  ai_signoff: string | null;
  ai_forbidden_topics: string[];
  complaint_handling: string | null;
  auto_escalate_complaints: boolean;
  booking_mode: 'auto' | 'manual' | 'conditional';
  payment_methods: string[];
  tax_included: boolean;
  extra_fee_notes: string | null;
  first_visit_instructions: string | null;
  created_at: string;
}

// ------------------------------------------------------------
// Service
// ------------------------------------------------------------

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  category: string | null;
  /** Day-of-week numbers (0 = Sunday) when this service is available. */
  available_days: number[];
  active: boolean;
  created_at: string;
}

// ------------------------------------------------------------
// Staff
// ------------------------------------------------------------

export interface Staff {
  id: string;
  tenant_id: string;
  name: string;
  role: string | null;
  service_ids: string[];
  /** Per-staff schedule override; same shape as business_hours. Null = use tenant default. */
  schedule_override: BusinessHours | null;
  active: boolean;
  created_at: string;
}

// ------------------------------------------------------------
// Customer
// ------------------------------------------------------------

export interface Customer {
  id: string;
  tenant_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  source: 'web' | 'whatsapp' | 'manual';
  status: 'lead' | 'active' | 'inactive' | 'lost';
  first_contact_at: string | null;
  last_interaction_at: string | null;
  last_visit_at: string | null;
  total_visits: number;
  total_spent: number;
  favorite_service: string | null;
  favorite_staff: string | null;
  tags: string[];
  notes: string | null;
  consent_marketing: boolean;
  created_at: string;
}

// ------------------------------------------------------------
// Booking
// ------------------------------------------------------------

export interface Booking {
  id: string;
  tenant_id: string;
  customer_id: string;
  service_id: string;
  staff_id: string | null;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  source: 'web' | 'whatsapp';
  notes: string | null;
  created_at: string;
}

// ------------------------------------------------------------
// FaqEntry
// ------------------------------------------------------------

export interface FaqEntry {
  id: string;
  tenant_id: string;
  question: string;
  answer: string;
  category: 'faq' | 'policy' | 'first-visit' | 'access';
  created_at: string;
}

// ------------------------------------------------------------
// Conversation
// ------------------------------------------------------------

export interface Conversation {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  session_id: string;
  channel: 'web' | 'whatsapp';
  /** Raw JSONB message array — shape is intentionally open. */
  messages: unknown[];
  started_at: string;
  last_message_at: string;
}

// ------------------------------------------------------------
// Calendar / Availability helpers
// ------------------------------------------------------------

export interface TimeSlot {
  start: string;
  end: string;
  staffId?: string;
  staffName?: string;
}

export interface BookingData {
  tenant_id: string;
  customer_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  staff_id?: string;
  notes?: string;
}

export interface CalendarProvider {
  /** Returns available time slots for a given tenant/date, optionally filtered by service and staff. */
  getAvailableSlots(
    tenantId: string,
    date: string,
    serviceId?: string,
    staffId?: string
  ): Promise<TimeSlot[]>;

  /** Creates a calendar event for a booking and returns the external event ID. */
  createEvent(tenantId: string, booking: BookingData): Promise<string>;

  /** Cancels / removes a previously created calendar event. */
  cancelEvent(tenantId: string, eventId: string): Promise<void>;
}
