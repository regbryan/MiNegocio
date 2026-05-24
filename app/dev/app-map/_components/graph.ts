export type NodeRole = "edge" | "api" | "agent" | "data" | "external" | "client";

export type GraphNode = {
  id: string;
  title: string;
  role: NodeRole;
  owner: string;
  summary: string;
  breaks: string[];
  x: number;
  y: number;
};

export type GraphEdge = { from: string; to: string };

export const NODES: GraphNode[] = [
  {
    id: "user-browser",
    title: "End-customer browser",
    role: "client",
    owner: "n/a",
    summary:
      "End user lands on /chat/[tenantSlug] or the embedded /widget. React renders a chat UI driven by useChat from @ai-sdk/react.",
    breaks: [
      "If JS fails to load, the chat doesn't render — fall back to the tenant's phone/WhatsApp link.",
    ],
    x: 40,
    y: 200,
  },
  {
    id: "tenant-browser",
    title: "Tenant SMB browser",
    role: "client",
    owner: "n/a",
    summary:
      "Owner of a business opens /onboard to register. Chat-driven onboarding agent gathers business info and writes to tenants/services/staff/faq_entries.",
    breaks: [
      "Onboarding broken means no new tenants — landing-page CTA should warn instead of erroring.",
    ],
    x: 40,
    y: 60,
  },
  {
    id: "chat-page",
    title: "/chat/[tenantSlug] page",
    role: "edge",
    owner: "frontend",
    summary:
      "Server component resolves tenant by slug, then mounts ChatInterface client component. Mounts the Article-14 AiDisclosure banner.",
    breaks: [
      "Tenant not found → 404. Stale slug → user sees Mexican-Spanish 404.",
      "If client bundle blows up, useChat won't connect to /api/chat.",
    ],
    x: 240,
    y: 200,
  },
  {
    id: "onboard-page",
    title: "/onboard page",
    role: "edge",
    owner: "frontend",
    summary:
      "Server component renders OnboardChat client UI for new-tenant signup. Mounts AiDisclosure banner.",
    breaks: ["Same JS-failure mode as /chat. No tenant created → recoverable."],
    x: 240,
    y: 60,
  },
  {
    id: "widget-page",
    title: "/widget page",
    role: "edge",
    owner: "frontend",
    summary:
      "iframe-friendly chat embed that a tenant pastes into their own site.",
    breaks: [
      "X-Frame-Options / CSP misconfig blocks embedding — Phase 2 will lock this down.",
    ],
    x: 240,
    y: 340,
  },
  {
    id: "chat-api",
    title: "/api/chat/[tenantSlug]",
    role: "api",
    owner: "backend",
    summary:
      "Streaming route handler. Builds the per-tenant system prompt and proxies the user's messages to a ToolLoopAgent.",
    breaks: [
      "If AI Gateway down → 500, chat unresponsive.",
      "If Supabase queries fail in tools, the agent surfaces an error message inline.",
    ],
    x: 460,
    y: 200,
  },
  {
    id: "onboard-api",
    title: "/api/onboard",
    role: "api",
    owner: "backend",
    summary:
      "Streaming route handler for tenant onboarding. Same Agent infrastructure as /api/chat with a different system prompt and toolset.",
    breaks: ["Same failure modes as /api/chat."],
    x: 460,
    y: 60,
  },
  {
    id: "dsar-api",
    title: "/api/dsar",
    role: "api",
    owner: "backend / legal",
    summary:
      "POST endpoint that records a Data Subject Access Request from the /legal/derechos-arco form. Zod-validated. Writes to dsar_requests.",
    breaks: [
      "If write fails, the user is told to email privacidad@minegocio.digital — compliance fallback.",
    ],
    x: 460,
    y: 340,
  },
  {
    id: "agent",
    title: "ToolLoopAgent",
    role: "agent",
    owner: "ai",
    summary:
      "Factory in lib/ai. Loads system prompt, registers 6 tools (lookup_customer, create_customer, list_services, check_availability, create_booking, escalate_to_human).",
    breaks: [
      "Tool typing drift breaks one tool → the agent may silently degrade. Vitest suite covers each tool.",
    ],
    x: 680,
    y: 130,
  },
  {
    id: "ai-gateway",
    title: "Vercel AI Gateway → Anthropic",
    role: "external",
    owner: "vercel + anthropic",
    summary:
      "Hosted gateway authenticated with VERCEL_OIDC_TOKEN. Routes to Claude via @ai-sdk/anthropic.",
    breaks: [
      "Anthropic outage / rate limit → user sees error in stream.",
      "OIDC token expiry → 401s from gateway.",
    ],
    x: 900,
    y: 130,
  },
  {
    id: "supabase",
    title: "Supabase Postgres",
    role: "data",
    owner: "supabase",
    summary:
      "Primary data store: tenants, services, staff, customers, bookings, conversations, faq, dsar_requests. RLS enabled, service-role policy.",
    breaks: [
      "Region outage → bookings can't write. Pool exhaustion → 500s.",
      "Migration drift between staging and prod → run migrations 001 + 002 before launch.",
    ],
    x: 680,
    y: 330,
  },
  {
    id: "book-rpc",
    title: "book_appointment() RPC",
    role: "data",
    owner: "backend",
    summary:
      "Concurrency-safe SQL RPC. Locks overlapping confirmed bookings, validates staff↔service, inserts booking, updates customer stats.",
    breaks: [
      "Returns {error} on slot collision or staff/service mismatch. UI shows the message.",
    ],
    x: 900,
    y: 330,
  },
];

export const EDGES: GraphEdge[] = [
  { from: "tenant-browser", to: "onboard-page" },
  { from: "user-browser", to: "chat-page" },
  { from: "user-browser", to: "widget-page" },
  { from: "user-browser", to: "dsar-api" },
  { from: "chat-page", to: "chat-api" },
  { from: "widget-page", to: "chat-api" },
  { from: "onboard-page", to: "onboard-api" },
  { from: "chat-api", to: "agent" },
  { from: "onboard-api", to: "agent" },
  { from: "agent", to: "ai-gateway" },
  { from: "agent", to: "supabase" },
  { from: "agent", to: "book-rpc" },
  { from: "book-rpc", to: "supabase" },
  { from: "dsar-api", to: "supabase" },
];

export const ROLE_COLOR: Record<NodeRole, string> = {
  client: "#a78bfa",
  edge: "#60a5fa",
  api: "#34d399",
  agent: "#f59e0b",
  data: "#f472b6",
  external: "#f87171",
};
