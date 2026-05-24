import type { Metadata } from "next";
import { Mermaid } from "@/components/dev/mermaid";

export const metadata: Metadata = {
  title: "User Flows — Dev",
  robots: { index: false, follow: false },
};

const onboardFlow = `
flowchart TD
  start["Tenant lands on /onboard"] --> disclosure["Article-14 AI disclosure shown"]
  disclosure --> chat["useChat posts to /api/onboard"]
  chat --> agent["OnboardingAgent system prompt"]
  agent --> q1{"All required fields collected?"}
  q1 -- "no" --> ask["Ask one question at a time"]
  ask --> chat
  q1 -- "yes" --> persist["Agent writes tenant + services + staff + faq"]
  persist --> ok{"DB writes ok?"}
  ok -- "no" --> err1["Show error in stream"] --> chat
  ok -- "yes" --> done["Tenant + slug created; redirect to /chat/&lt;slug&gt;"]
`;

const chatBookingFlow = `
sequenceDiagram
  autonumber
  participant U as End user
  participant Page as /chat/[tenantSlug]
  participant API as /api/chat/[tenantSlug]
  participant Agent as ToolLoopAgent
  participant DB as Supabase
  participant AI as Anthropic via AI Gateway

  U->>Page: Open URL or click widget
  Page->>U: Render AiDisclosure + chat UI
  U->>API: POST messages (useChat)
  API->>Agent: Build system prompt for tenant
  Agent->>AI: stream chat completion
  Agent->>DB: lookup_customer(session_id)
  alt no customer
    Agent->>U: Ask name (one question)
    U->>API: name
    Agent->>DB: create_customer(...)
  end
  U->>API: "quiero una cita el viernes"
  Agent->>DB: list_services / check_availability
  Agent->>U: Offer slots
  U->>API: Pick slot
  Agent->>DB: book_appointment RPC
  alt slot taken
    DB-->>Agent: {error: "Time slot is no longer available"}
    Agent->>U: Apologize + offer next slot
  else booked
    DB-->>Agent: {id: bookingId}
    Agent->>U: Confirmation (service, date, time)
  end
`;

const widgetFlow = `
flowchart LR
  embed["Tenant pastes iframe pointing at /widget?tenant=slug"] --> page["/widget page loads"]
  page --> sameApi["POST /api/chat/[tenantSlug] — same backend"]
  sameApi --> agent["ToolLoopAgent"]
  agent --> rest["See chat-booking flow"]
`;

type FlowChecklist = {
  title: string;
  items: { ok: boolean; label: string }[];
};

const checklists: FlowChecklist[] = [
  {
    title: "Onboarding flow (tenant SMB)",
    items: [
      { ok: true, label: "Entry point: /onboard (linked from landing CTA)" },
      { ok: true, label: "Happy path: chat-driven, one-question-at-a-time" },
      { ok: false, label: "Branch: returning tenant (login) — NOT YET BUILT" },
      { ok: true, label: "Error: DB write fail surfaced in stream" },
      { ok: false, label: "Recovery: 'pick up where you left off' — NOT YET BUILT" },
      { ok: false, label: "Off-boarding: cancel/delete tenant — NOT YET BUILT" },
      { ok: false, label: "Lifecycle email: 'tenant created' confirmation — NOT YET BUILT" },
      { ok: false, label: "Analytics events: tenant_created, services_count — NOT YET WIRED" },
    ],
  },
  {
    title: "End-user booking flow",
    items: [
      { ok: true, label: "Entry points: /chat/[slug], /widget?tenant=[slug]" },
      { ok: true, label: "Article-14 AI disclosure shown before first message" },
      { ok: true, label: "Happy path: lookup → name → service → slot → confirm" },
      { ok: true, label: "Branch: returning customer (lookup_customer hits)" },
      { ok: true, label: "Error: slot collision → 'no longer available' + reoffer" },
      { ok: true, label: "Error: staff/service mismatch → reoffer compatible staff" },
      { ok: true, label: "Escalate-to-human tool wired for complex/sensitive cases" },
      { ok: false, label: "Empty/loading/success UI states fully designed — Phase 3 audit" },
      { ok: false, label: "Booking confirmation email/WhatsApp — NOT YET WIRED" },
      { ok: false, label: "Cancel/reschedule from end-user side — NOT YET BUILT" },
    ],
  },
  {
    title: "Embedded widget flow",
    items: [
      { ok: true, label: "Entry point: <iframe src=/widget?tenant=...> on tenant's site" },
      { ok: true, label: "Same backend as standalone chat" },
      { ok: false, label: "X-Frame-Options / CSP allowlist per tenant — NOT YET CONFIGURED" },
      { ok: false, label: "Origin-based ratelimit on /api/chat — NOT YET WIRED (Phase 2)" },
    ],
  },
];

export default function FlowsPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-2xl font-semibold">User Flows</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every user-facing flow with entry points, happy path, branches,
          errors, and what&apos;s still missing. Acceptance test: a new PM can
          read these cold and predict what the user sees at any step.
        </p>
      </header>

      <FlowSection
        title="1. Onboarding (tenant SMB)"
        chart={onboardFlow}
        checklist={checklists[0]}
      />
      <FlowSection
        title="2. End-user booking"
        chart={chatBookingFlow}
        checklist={checklists[1]}
      />
      <FlowSection
        title="3. Embedded widget"
        chart={widgetFlow}
        checklist={checklists[2]}
      />
    </div>
  );
}

function FlowSection({
  title,
  chart,
  checklist,
}: {
  title: string;
  chart: string;
  checklist: FlowChecklist;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Mermaid chart={chart} />
      <div className="rounded-md border border-border/40 bg-card/30 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {checklist.title} — coverage
        </h3>
        <ul className="space-y-1.5 text-sm">
          {checklist.items.map((i, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span
                role="img"
                aria-label={i.ok ? "covered" : "not yet"}
                className={
                  i.ok
                    ? "mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                    : "mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-amber-500"
                }
              />
              <span className={i.ok ? "" : "text-muted-foreground"}>
                {i.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
