# PII Inventory & Retention (MiNegocio)

> Internal document supporting the public Aviso de Privacidad. Update when
> schema or data flow changes; link from `/legal/privacidad` only by reference,
> not by direct exposure.

Last updated: 2026-05-18

## Table-by-table inventory

| Table | Column | Category | Lawful basis | Retention |
|---|---|---|---|---|
| `tenants` | `business_name`, `address_*`, `phone`, `whatsapp_number`, `social_links` | Business contact (LFPDPPP "datos de identificación" of legal person) | Contract | Active + 24 months |
| `customers` | `full_name` | PII (identification) | Legitimate interest (booking service for tenant) | 24 months from last interaction, then anonymize |
| `customers` | `phone`, `email` | PII (contact) | Legitimate interest | Same as above |
| `customers` | `notes`, `tags`, `favorite_*` | PII (behavioral) | Legitimate interest | Same as above |
| `customers` | `consent_marketing` | Consent record | Consent (must be explicit opt-in) | Indefinite while account exists |
| `bookings` | indirectly: links to `customers` via FK | PII via association | Contract | 5 years (fiscal) |
| `conversations` | `messages` (jsonb) | Potentially any PII the user types | Legitimate interest | 18 months, then purge |
| `staff` | `name`, `role` | Employment data of tenant's staff | Tenant's lawful basis (we are processor) | Active + 12 months |
| `dsar_requests` | `subject_name`, `subject_email`, `subject_phone`, `details` | PII (must keep proof of compliance) | Legal obligation | 5 years |

## Sensitive data exposure surfaces

- `conversations.messages` is **unstructured JSONB** — end users may paste anything (medical info, payment data, credentials). Mitigations:
  - System prompt instructs the agent not to request sensitive data.
  - Phase 4.5 LLM review will require PII scrubbing before sending to Anthropic.
  - 18-month retention with automated purge job (not yet implemented — tracked as engineering follow-up).
- `customers.notes` — same risk profile, lower volume.

## Data flow / cross-border transfers

| From | To | Why | Cross-border? |
|---|---|---|---|
| Browser (user) | Vercel edge (Next.js) | Render UI, handle form submits | Yes — US/global edge |
| Vercel function | Supabase Postgres | Persist customers, bookings, conversations | Yes — region depends on Supabase project |
| Vercel function | Anthropic via AI Gateway | LLM completion for assistant | Yes — US |

All three providers are listed under `/legal/subprocesadores` with their DPA links.

## Open follow-ups

- [ ] Implement nightly cron that anonymizes `customers` rows with `last_interaction_at < now() - interval '24 months'`.
- [ ] Implement scheduled purge of `conversations` older than 18 months.
- [ ] Add admin UI for tenant to honor their customers' ARCO requests (currently only DSAR endpoint exists).
- [ ] Confirm Supabase project region (EU vs US) and pin in env/docs.
