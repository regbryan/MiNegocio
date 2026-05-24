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

  // Haiku is ~3x faster than Sonnet. For the WhatsApp portfolio demo we
  // need to fit the entire tool loop within Twilio's 15s webhook timeout,
  // which Sonnet 4 was busting (~25s end-to-end). Booking flows don't need
  // Sonnet's reasoning depth. Override per-tenant in a future migration if
  // a more complex flow needs the upgrade.
  const modelId =
    process.env.AGENT_MODEL_OVERRIDE ?? "claude-haiku-4-5-20251001";

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
