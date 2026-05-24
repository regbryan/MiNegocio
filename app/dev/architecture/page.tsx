import type { Metadata } from "next";
import { Mermaid } from "@/components/dev/mermaid";

export const metadata: Metadata = {
  title: "Architecture — Dev",
  robots: { index: false, follow: false },
};

const systemDiagram = `
flowchart LR
  user["End customer<br/>browser + widget"]
  tenant["Tenant SMB<br/>onboarding"]

  subgraph vercel ["Vercel Edge / Functions"]
    chatPage["/chat/[tenantSlug]"]
    onboardPage["/onboard"]
    widgetPage["/widget"]
    chatApi["/api/chat/[tenantSlug]"]
    onboardApi["/api/onboard"]
    dsarApi["/api/dsar"]
    agent["ToolLoopAgent<br/>lib/ai"]
  end

  subgraph supabase ["Supabase Postgres"]
    db[("tenants · services · staff<br/>customers · bookings<br/>conversations · faq · dsar")]
    rpc{{"book_appointment RPC"}}
  end

  subgraph aigw ["Vercel AI Gateway"]
    anthropic["Anthropic Claude<br/>via @ai-sdk/anthropic"]
  end

  user --> chatPage
  user --> widgetPage
  tenant --> onboardPage
  user --> dsarApi
  chatPage --> chatApi
  widgetPage --> chatApi
  onboardPage --> onboardApi
  chatApi --> agent
  onboardApi --> agent
  agent --> anthropic
  agent --> db
  agent --> rpc
  rpc --> db
  dsarApi --> db
`;

const adrPlaceholder = `
| ADR | Decision | Status |
|---|---|---|
| 0001 | Next.js 16 + React 19 App Router | Accepted |
| 0002 | Supabase as primary datastore + RLS posture (service-role-only in MVP) | Accepted |
| 0003 | AI SDK v6 + Vercel AI Gateway for Claude | Accepted |
| 0004 | Per-tenant slug routing for chat (\`/chat/[tenantSlug]\`) | Accepted |
| 0005 | Embed widget as iframe-friendly route (\`/widget\`) | Accepted |
`;

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">System Architecture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live diagram regenerated from{" "}
          <code className="rounded bg-muted/40 px-1.5 py-0.5">docs/architecture.md</code>
          . Click any node to learn what breaks when it&apos;s down (see{" "}
          <a className="underline" href="/dev/app-map">
            /dev/app-map
          </a>
          ).
        </p>
      </header>

      <Mermaid chart={systemDiagram} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Architecture Decision Records</h2>
        <p className="text-sm text-muted-foreground">
          Stub list — populate <code>docs/adr/</code> with full ADRs before launch.
        </p>
        <div
          className="prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: markdownTableToHtml(adrPlaceholder) }}
        />
      </section>
    </div>
  );
}

function markdownTableToHtml(md: string): string {
  const lines = md.trim().split("\n").filter((l) => l.trim());
  const [header, , ...rows] = lines;
  const cols = header.split("|").slice(1, -1).map((c) => c.trim());
  const head = `<tr>${cols.map((c) => `<th class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border/40">${c}</th>`).join("")}</tr>`;
  const body = rows
    .map(
      (r) =>
        `<tr class="border-b border-border/40">${r
          .split("|")
          .slice(1, -1)
          .map((c) => `<td class="px-3 py-2 align-top">${c.trim()}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  return `<table class="w-full text-sm">${head}${body}</table>`;
}
