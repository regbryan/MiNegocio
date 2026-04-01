import { ToolLoopAgent, stepCountIs } from "ai";
import { buildSystemPrompt } from "./prompt-builder";
import { createLookupCustomerTool } from "./tools/lookup-customer";
import { createCreateCustomerTool } from "./tools/create-customer";
import { createListServicesTool } from "./tools/list-services";
import { createCheckAvailabilityTool } from "./tools/check-availability";
import { createCreateBookingTool } from "./tools/create-booking";
import { createEscalateToHumanTool } from "./tools/escalate-to-human";

export async function createChatAgent(tenantId: string, sessionId: string) {
  const systemPrompt = await buildSystemPrompt(tenantId);

  return new ToolLoopAgent({
    model: "anthropic/claude-haiku-3.5",
    instructions: systemPrompt,
    tools: {
      lookup_customer: createLookupCustomerTool(tenantId, sessionId),
      create_customer: createCreateCustomerTool(tenantId, sessionId),
      list_services: createListServicesTool(tenantId),
      check_availability: createCheckAvailabilityTool(tenantId),
      create_booking: createCreateBookingTool(tenantId),
      escalate_to_human: createEscalateToHumanTool(tenantId),
    },
    stopWhen: stepCountIs(8),
  });
}
