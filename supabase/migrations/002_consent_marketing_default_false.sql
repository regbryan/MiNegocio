-- LFPDPPP Art. 8 / GDPR Art. 7 compliance:
-- marketing consent must be opt-in, not opt-out.
BEGIN;

ALTER TABLE customers
  ALTER COLUMN consent_marketing SET DEFAULT false;

UPDATE customers
   SET consent_marketing = false
 WHERE consent_marketing = true
   AND first_contact_at >= now() - interval '30 days';

-- Audit trail for ARCO rights (LFPDPPP) and GDPR DSAR requests.
CREATE TABLE IF NOT EXISTS dsar_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid         REFERENCES tenants(id) ON DELETE SET NULL,
  request_type text         NOT NULL CHECK (request_type IN ('access','rectification','cancellation','opposition','deletion','portability')),
  subject_name text         NOT NULL,
  subject_email text        NOT NULL,
  subject_phone text,
  details      text,
  status       text         NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_progress','completed','rejected')),
  received_at  timestamptz  NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  resolution_notes text
);

ALTER TABLE dsar_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON dsar_requests;
CREATE POLICY "Service role full access" ON dsar_requests
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;

-- Indexes created CONCURRENTLY must run outside the transaction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dsar_requests_received
  ON dsar_requests (received_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dsar_requests_status
  ON dsar_requests (status, received_at DESC);
