import { createAgentUIStreamResponse } from "ai";
import { createOnboardingAgent } from "@/lib/ai/onboarding-agent";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.headers.get("X-Session-Id");

    if (!sessionId) {
      return new Response("Missing X-Session-Id header", { status: 400 });
    }

    const { messages } = await req.json();
    const agent = await createOnboardingAgent();

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
    });
  } catch (error) {
    console.error("[onboard-api] ERROR:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
