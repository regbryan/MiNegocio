import { createAgentUIStreamResponse } from "ai";
import { getTenantBySlug, upsertConversation } from "@/lib/db/queries";
import { createChatAgent } from "@/lib/ai/agent";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;
  const sessionId = req.headers.get("X-Session-Id");

  if (!sessionId) {
    return new Response("Missing X-Session-Id header", { status: 400 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return new Response("Business not found", { status: 404 });
  }

  const { messages } = await req.json();
  const agent = await createChatAgent(tenant.id, sessionId);

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      await upsertConversation(tenant.id, sessionId, finalMessages);
    },
  });
}
