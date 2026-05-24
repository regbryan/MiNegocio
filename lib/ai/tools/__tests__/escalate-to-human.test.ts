import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/onboarding-queries", () => ({
  recordEscalation: vi.fn(),
}));

import { recordEscalation } from "@/lib/db/onboarding-queries";
import { createEscalateToHumanTool } from "../escalate-to-human";

const mockRecord = vi.mocked(recordEscalation);

describe("createEscalateToHumanTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecord.mockResolvedValue({ id: "esc-1" });
  });

  it("records the escalation in the sealed table with tenant_id, reason, and summary", async () => {
    const tool = createEscalateToHumanTool("tenant-1", "session-abc");
    await tool.execute!(
      {
        reason: "Customer is upset about a billing issue",
        summary: "Customer claims they were charged twice for their last appointment",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal },
    );

    expect(mockRecord).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      sessionId: "session-abc",
      reason: "Customer is upset about a billing issue",
      summary:
        "Customer claims they were charged twice for their last appointment",
    });
  });

  it("returns a confirmation message indicating escalation occurred", async () => {
    const tool = createEscalateToHumanTool("tenant-1");
    const result = await tool.execute!(
      {
        reason: "Technical question beyond AI scope",
        summary: "Customer needs help with a complex account setup",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal },
    );

    expect(result).toEqual({
      escalated: true,
      message: expect.stringContaining("human agent"),
    });
  });

  it("still confirms escalation to the user even if DB write fails", async () => {
    mockRecord.mockRejectedValueOnce(new Error("db down"));
    const tool = createEscalateToHumanTool("tenant-1");
    const result = await tool.execute!(
      { reason: "test", summary: "test" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal },
    );
    if (Symbol.asyncIterator in (result as object)) {
      throw new Error("expected object, got AsyncIterable");
    }
    expect((result as { escalated: boolean }).escalated).toBe(true);
  });
});
