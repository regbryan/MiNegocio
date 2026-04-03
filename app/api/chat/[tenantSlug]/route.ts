import { createAgentUIStreamResponse } from "ai";
import { getTenantBySlug, upsertConversation } from "@/lib/db/queries";
import { createChatAgent } from "@/lib/ai/agent";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const sessionId = req.headers.get("X-Session-Id");

    console.log("[chat-api] POST /api/chat/" + tenantSlug, { sessionId });

    if (!sessionId) {
      return new Response("Missing X-Session-Id header", { status: 400 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    console.log("[chat-api] tenant:", tenant?.id ?? "NOT FOUND");

    if (!tenant) {
      return new Response("Business not found", { status: 404 });
    }

    const { messages } = await req.json();
    console.log("[chat-api] messages count:", messages?.length);

    const agent = await createChatAgent(tenant.id, sessionId);
    console.log("[chat-api] agent created, streaming response...");

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      onFinish: async ({ messages: finalMessages }) => {
        await upsertConversation(tenant.id, sessionId, finalMessages);
      },
    });
  } catch (error) {
    console.error("[chat-api] ERROR:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
