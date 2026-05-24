-- Phase 4.5 BLOCKER #1: bind tenant_id to onboarding session so the LLM
-- can no longer choose which tenant to mutate. Phase 4.5 BLOCKER #4: store
-- escalation summaries in a sealed table instead of stdout.
BEGIN;

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  session_id  text        PRIMARY KEY,
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON onboarding_sessions;
CREATE POLICY "Service role full access" ON onboarding_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS escalations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id  text,
  reason      text        NOT NULL,
  summary     text        NOT NULL,
  status      text        NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON escalations;
CREATE POLICY "Service role full access" ON escalations
  FOR ALL USING (true) WITH CHECK (true);

COMMIT;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_onboarding_sessions_tenant
  ON onboarding_sessions (tenant_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escalations_tenant_created
  ON escalations (tenant_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_escalations_open
  ON escalations (status, created_at DESC)
  WHERE status = 'open';
