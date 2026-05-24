# Phase 2 deferred security follow-ups

These are tracked **before public multi-tenant launch**. Phase 2 of `/app-review`
closed the immediately exploitable items; the entries below need product-level
decisions or schema changes that exceeded the review's scope.

Last updated: 2026-05-18

## 1. Per-tenant RLS policies

**Status:** open. `001_initial_schema.sql` lines 166–195 still use a single
permissive `FOR ALL USING (true)` policy across every table, with all server
code going through the service-role key. A single missing
`.eq("tenant_id", x)` in any future query would leak cross-tenant data.

**Plan:**
- Adopt JWT-based Supabase auth where the JWT `app_metadata.tenant_id` is
  the per-tenant identifier.
- Replace each table's `FOR ALL USING (true)` with `USING (tenant_id =
  (auth.jwt() ->> 'tenant_id')::uuid)` policies for `SELECT/UPDATE/DELETE`
  and a matching `WITH CHECK` for `INSERT`.
- Keep a separate `service_role` policy for the small set of cross-tenant
  ops (admin tools, DSAR resolution flow).
- Add a vitest suite that runs the same query as anon + as service-role +
  as tenant-A-jwt + as tenant-B-jwt against a seeded test DB to prove
  isolation.

**Trigger to do this now:** any time we onboard a second real tenant.

## 2. Per-tenant `/widget` CSP allowlist

**Status:** open. `next.config.ts` currently serves
`Content-Security-Policy: frame-ancestors *` on `/widget/*` so tenants can
embed the chat in their own site. The wildcard means any origin in the
world can embed it.

**Plan:**
- Add `allowed_origins text[]` column to `tenants` (`['https://salon-maria.mx']`).
- In Next.js middleware, read `request.nextUrl.searchParams.get('tenant')`
  for `/widget`, look up the tenant's allowed_origins, and emit a CSP that
  whitelists exactly those origins.
- Cache the lookup with a short TTL to avoid a DB hit per request.

**Trigger to do this now:** before turning on public widget embedding for
non-demo tenants.

## 3. Rate-limit store backed by Vercel KV / Upstash

**Status:** scaffolding shipped. `lib/security/rate-limit.ts` is an
**in-memory** limiter — every Vercel function instance has its own
counters, so the per-IP limits are effectively per-instance.

**Plan:**
- Provision Vercel KV (or Upstash Redis).
- Swap the `store` Map in `rate-limit.ts` for a sliding-window Lua script
  on the KV client. Keep the interface (`checkRateLimit({ key, limit,
  windowSeconds })`) unchanged.
- Add a smoke test that hits an endpoint from 2+ instances and verifies
  cross-instance counting.

**Trigger to do this now:** before launching beyond a single Vercel region.

## 4. Captcha / proof-of-work on `/api/dsar`

**Status:** open. The DSAR endpoint has IP-based rate-limiting (5/hour)
but no captcha. Automated submitters could still pollute the
`dsar_requests` table over time.

**Plan:**
- Add Cloudflare Turnstile token verification on the DSAR form submit.
- Optionally email-verify the `subject_email` before persisting (out-of-band
  confirmation link).

**Trigger to do this now:** first time we see > 5 spam DSARs in a week.

## 5. SBOM publishing

**Status:** open. Phase 2 surfaced this as a WARN. Generate with
`syft . -o spdx-json=sbom.spdx.json` on every release build and publish
the SBOM artifact alongside the deployment.

## 6. `SESSION_SECRET` provisioning

**Status:** code shipped, secret not provisioned. `lib/security/session.ts`
requires a 32+ char `SESSION_SECRET` env var in production and falls back
to a deterministic dev secret otherwise.

**Plan:** generate with `openssl rand -base64 48` and add to Vercel project
env (production + preview, NOT development unless overriding).
