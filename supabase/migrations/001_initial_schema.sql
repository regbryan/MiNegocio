-- MiNegocio Initial Schema Migration
-- Creates all 7 core tables, indexes, RLS policies, and booking RPC function

-- ============================================================
-- 1. TENANTS
-- ============================================================
CREATE TABLE tenants (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                      text        UNIQUE NOT NULL,
  business_name             text        NOT NULL,
  vertical                  text        NOT NULL,
  description               text        NOT NULL,
  address_street            text,
  address_colonia           text,
  address_city              text        NOT NULL,
  address_state             text        NOT NULL,
  address_zip               text,
  phone                     text,
  whatsapp_number           text,
  social_links              jsonb       DEFAULT '{}',
  business_hours            jsonb       NOT NULL,
  break_times               jsonb       DEFAULT '[]',
  max_advance_days          int         DEFAULT 30,
  min_notice_hours          int         DEFAULT 2,
  buffer_minutes            int         DEFAULT 0,
  max_concurrent            int         DEFAULT 1,
  ai_language               text        DEFAULT 'es',
  ai_tone                   text        DEFAULT 'friendly',
  ai_greeting               text,
  ai_signoff                text,
  ai_forbidden_topics       text[]      DEFAULT '{}',
  complaint_handling        text,
  auto_escalate_complaints  boolean     DEFAULT true,
  booking_mode              text        DEFAULT 'auto',
  payment_methods           text[]      DEFAULT '{cash}',
  tax_included              boolean     DEFAULT true,
  extra_fee_notes           text,
  first_visit_instructions  text,
  created_at                timestamptz DEFAULT now()
);

-- ============================================================
-- 2. SERVICES
-- ============================================================
CREATE TABLE services (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  description      text,
  price            decimal     NOT NULL,
  currency         text        DEFAULT 'MXN',
  duration_minutes int         NOT NULL,
  category         text,
  available_days   int[]       DEFAULT '{1,2,3,4,5,6}',
  active           boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- 3. STAFF
-- ============================================================
CREATE TABLE staff (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  role              text,
  service_ids       uuid[]      DEFAULT '{}',
  schedule_override jsonb,
  active            boolean     DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

-- ============================================================
-- 4. CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name            text        NOT NULL,
  phone                text,
  email                text,
  source               text        DEFAULT 'web',
  status               text        DEFAULT 'lead',
  first_contact_at     timestamptz DEFAULT now(),
  last_interaction_at  timestamptz DEFAULT now(),
  last_visit_at        timestamptz,
  total_visits         int         DEFAULT 0,
  total_spent          decimal     DEFAULT 0,
  favorite_service     text,
  favorite_staff       text,
  tags                 text[]      DEFAULT '{}',
  notes                text,
  consent_marketing    boolean     DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  CONSTRAINT customers_tenant_phone_unique UNIQUE NULLS NOT DISTINCT (tenant_id, phone)
);

-- Partial unique index to enforce uniqueness only when phone is not null
-- (belt-and-suspenders alongside the constraint above)
CREATE UNIQUE INDEX idx_customers_tenant_phone_unique
  ON customers (tenant_id, phone)
  WHERE phone IS NOT NULL;

-- ============================================================
-- 5. BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  service_id  uuid        NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  staff_id    uuid        REFERENCES staff(id) ON DELETE SET NULL,
  start_time  timestamptz NOT NULL,
  end_time    timestamptz NOT NULL,
  status      text        DEFAULT 'confirmed',
  source      text        DEFAULT 'web',
  notes       text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 6. FAQ_ENTRIES
-- ============================================================
CREATE TABLE faq_entries (
  id        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question  text        NOT NULL,
  answer    text        NOT NULL,
  category  text        DEFAULT 'faq',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     uuid        REFERENCES customers(id) ON DELETE SET NULL,
  session_id      text        NOT NULL,
  channel         text        DEFAULT 'web',
  messages        jsonb       DEFAULT '[]',
  started_at      timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  CONSTRAINT conversations_tenant_session_unique UNIQUE (tenant_id, session_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_bookings_tenant_time
  ON bookings (tenant_id, start_time, status);

CREATE INDEX idx_customers_tenant_phone
  ON customers (tenant_id, phone)
  WHERE phone IS NOT NULL;

-- Additional useful indexes
CREATE INDEX idx_services_tenant_active   ON services (tenant_id, active);
CREATE INDEX idx_staff_tenant_active      ON staff (tenant_id, active);
CREATE INDEX idx_faq_entries_tenant       ON faq_entries (tenant_id);
CREATE INDEX idx_conversations_tenant     ON conversations (tenant_id, last_message_at DESC);
CREATE INDEX idx_bookings_customer        ON bookings (customer_id);

-- ============================================================
-- ROW LEVEL SECURITY (Phase 1: service_role full access)
-- ============================================================
ALTER TABLE tenants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON tenants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON services
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON staff
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON bookings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON faq_entries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- RPC: book_appointment
-- Transactional booking with concurrency check and staff validation
-- ============================================================
CREATE OR REPLACE FUNCTION book_appointment(
  p_tenant_id   uuid,
  p_customer_id uuid,
  p_service_id  uuid,
  p_start_time  timestamptz,
  p_end_time    timestamptz,
  p_staff_id    uuid    DEFAULT NULL,
  p_notes       text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_concurrent     int;
  v_max_concurrent int;
  v_booking_id     uuid;
  v_staff_services uuid[];
BEGIN
  -- Lock overlapping confirmed bookings for this tenant to prevent race conditions
  SELECT count(*) INTO v_concurrent
  FROM bookings
  WHERE tenant_id = p_tenant_id
    AND status    = 'confirmed'
    AND start_time < p_end_time
    AND end_time   > p_start_time
  FOR UPDATE;

  SELECT max_concurrent INTO v_max_concurrent
  FROM tenants
  WHERE id = p_tenant_id;

  IF v_concurrent >= v_max_concurrent THEN
    RETURN jsonb_build_object('error', 'Time slot is no longer available');
  END IF;

  -- Validate staff can perform the requested service
  IF p_staff_id IS NOT NULL THEN
    SELECT service_ids INTO v_staff_services
    FROM staff
    WHERE id = p_staff_id AND tenant_id = p_tenant_id;

    IF NOT (p_service_id = ANY(v_staff_services)) THEN
      RETURN jsonb_build_object('error', 'Selected staff member does not perform this service');
    END IF;
  END IF;

  -- Insert the booking
  INSERT INTO bookings (tenant_id, customer_id, service_id, staff_id, start_time, end_time, notes)
  VALUES (p_tenant_id, p_customer_id, p_service_id, p_staff_id, p_start_time, p_end_time, p_notes)
  RETURNING id INTO v_booking_id;

  -- Update customer stats
  UPDATE customers SET
    total_visits        = total_visits + 1,
    last_visit_at       = p_start_time,
    last_interaction_at = now(),
    status              = 'active'
  WHERE id = p_customer_id;

  RETURN jsonb_build_object('id', v_booking_id);
END;
$$;
