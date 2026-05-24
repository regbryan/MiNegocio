import type { Metadata } from "next";
import { Mermaid } from "@/components/dev/mermaid";

export const metadata: Metadata = {
  title: "Schema — Dev",
  robots: { index: false, follow: false },
};

const erDiagram = `
erDiagram
  TENANTS ||--o{ SERVICES : "1—N"
  TENANTS ||--o{ STAFF : "1—N"
  TENANTS ||--o{ CUSTOMERS : "1—N"
  TENANTS ||--o{ BOOKINGS : "1—N"
  TENANTS ||--o{ FAQ_ENTRIES : "1—N"
  TENANTS ||--o{ CONVERSATIONS : "1—N"
  CUSTOMERS ||--o{ BOOKINGS : "1—N"
  CUSTOMERS ||--o{ CONVERSATIONS : "1—N (nullable)"
  SERVICES ||--o{ BOOKINGS : "1—N"
  STAFF ||--o{ BOOKINGS : "0—N (nullable)"

  TENANTS {
    uuid id PK
    text slug UK
    text business_name
    text vertical
    text ai_language
    text ai_tone
    jsonb business_hours
    jsonb break_times
    int max_concurrent
  }
  SERVICES {
    uuid id PK
    uuid tenant_id FK
    text name
    decimal price
    int duration_minutes
    text_array available_days
  }
  STAFF {
    uuid id PK
    uuid tenant_id FK
    text name
    uuid_array service_ids
    jsonb schedule_override
  }
  CUSTOMERS {
    uuid id PK
    uuid tenant_id FK
    text full_name "PII"
    text phone "PII"
    text email "PII"
    text notes "PII (unstructured)"
    boolean consent_marketing "default false"
  }
  BOOKINGS {
    uuid id PK
    uuid tenant_id FK
    uuid customer_id FK
    uuid service_id FK
    uuid staff_id FK
    timestamptz start_time
    timestamptz end_time
    text status
  }
  FAQ_ENTRIES {
    uuid id PK
    uuid tenant_id FK
    text question
    text answer
  }
  CONVERSATIONS {
    uuid id PK
    uuid tenant_id FK
    uuid customer_id FK
    text session_id
    jsonb messages "PII risk"
  }
  DSAR_REQUESTS {
    uuid id PK
    uuid tenant_id FK
    text request_type
    text subject_name "PII"
    text subject_email "PII"
    text subject_phone "PII"
    text status
  }
`;

export default function SchemaPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Database Schema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Source of truth:{" "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">
            supabase/migrations/001_initial_schema.sql
          </code>
          {" + "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">
            002_consent_marketing_default_false.sql
          </code>
          . PII-bearing columns annotated inline.
        </p>
      </header>

      <Mermaid chart={erDiagram} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">RLS posture</h2>
        <p className="text-sm text-muted-foreground">
          All 8 tables have <code>ROW LEVEL SECURITY</code> enabled with a
          permissive &quot;service-role-only&quot; policy. The Next.js server
          uses the Supabase service-role key from{" "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
          ; no anon-key access path exists from client code. <strong>Phase 2
          will deepen this with per-tenant policies before public multi-tenancy.</strong>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">PII inventory</h2>
        <p className="text-sm text-muted-foreground">
          Detailed retention + lawful basis per column: see{" "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">
            docs/legal/pii-inventory.md
          </code>
          .
        </p>
      </section>
    </div>
  );
}
