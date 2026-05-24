import { ToolLoopAgent, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { buildSystemPrompt } from "./prompt-builder";
import { createLookupCustomerTool } from "./tools/lookup-customer";
import { createCreateCustomerTool } from "./tools/create-customer";
import { createListServicesTool } from "./tools/list-services";
import { createCheckAvailabilityTool } from "./tools/check-availability";
import { createCreateBookingTool } from "./tools/create-booking";
import { createEscalateToHumanTool } from "./tools/escalate-to-human";

export type ChatAgentSource = "web" | "whatsapp";

export async function createChatAgent(
  tenantId: string,
  sessionId: string,
  options?: { source?: ChatAgentSource },
) {
  const systemPrompt = await buildSystemPrompt(tenantId);

  // Sonnet 4.6 (current, not the deprecated 4.0). Reasons more naturally
  // than Haiku from a lean persona-led prompt — fewer "don't do X" rules
  // needed. Slower by 2-3s per turn but still fits Twilio's 15s webhook
  // timeout for typical booking flows.
  const modelId = process.env.AGENT_MODEL_OVERRIDE ?? "claude-sonnet-4-6";

  return new ToolLoopAgent({
    model: anthropic(modelId),
    instructions: systemPrompt,
    tools: {
      lookup_customer: createLookupCustomerTool(tenantId, sessionId),
      create_customer: createCreateCustomerTool(tenantId, sessionId),
      list_services: createListServicesTool(tenantId),
      check_availability: createCheckAvailabilityTool(tenantId),
      create_booking: createCreateBookingTool(tenantId, {
        source: options?.source ?? "web",
      }),
      escalate_to_human: createEscalateToHumanTool(tenantId, sessionId),
    },
    stopWhen: stepCountIs(8),
  });
}
