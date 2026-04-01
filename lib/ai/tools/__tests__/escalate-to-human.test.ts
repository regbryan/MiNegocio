import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEscalateToHumanTool } from "../escalate-to-human";

describe("createEscalateToHumanTool", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("logs escalation details with tenant_id, reason, and summary", async () => {
    const tool = createEscalateToHumanTool("tenant-1");
    await tool.execute(
      {
        reason: "Customer is upset about a billing issue",
        summary: "Customer claims they were charged twice for their last appointment",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[ESCALATION]",
      expect.objectContaining({
        tenant_id: "tenant-1",
        reason: "Customer is upset about a billing issue",
        summary: "Customer claims they were charged twice for their last appointment",
      })
    );
  });

  it("returns a confirmation message indicating escalation occurred", async () => {
    const tool = createEscalateToHumanTool("tenant-1");
    const result = await tool.execute(
      {
        reason: "Technical question beyond AI scope",
        summary: "Customer needs help with a complex account setup",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({
      escalated: true,
      message: expect.stringContaining("human agent"),
    });
  });
});
