import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCheckAvailabilityTool } from "../check-availability";

vi.mock("@/lib/calendar/mock-provider", () => ({
  mockCalendarProvider: {
    getAvailableSlots: vi.fn(),
  },
}));

import { mockCalendarProvider } from "@/lib/calendar/mock-provider";

const mockGetAvailableSlots = vi.mocked(mockCalendarProvider.getAvailableSlots);

describe("createCheckAvailabilityTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available slots when slots exist", async () => {
    const slots = [
      { start: "2024-06-10T09:00:00", end: "2024-06-10T09:30:00" },
      { start: "2024-06-10T09:30:00", end: "2024-06-10T10:00:00" },
      { start: "2024-06-10T10:00:00", end: "2024-06-10T10:30:00" },
    ];
    mockGetAvailableSlots.mockResolvedValue(slots);

    const tool = createCheckAvailabilityTool("tenant-1");
    const result = await tool.execute!(
      { date: "2024-06-10" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({
      available: true,
      slots: [
        { start: "2024-06-10T09:00:00", end: "2024-06-10T09:30:00" },
        { start: "2024-06-10T09:30:00", end: "2024-06-10T10:00:00" },
        { start: "2024-06-10T10:00:00", end: "2024-06-10T10:30:00" },
      ],
    });
    expect(mockGetAvailableSlots).toHaveBeenCalledWith(
      "tenant-1",
      "2024-06-10",
      undefined,
      undefined
    );
  });

  it("returns no-availability message when no slots available", async () => {
    mockGetAvailableSlots.mockResolvedValue([]);

    const tool = createCheckAvailabilityTool("tenant-1");
    const result = await tool.execute!(
      { date: "2024-06-10" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({
      available: false,
      message: "No availability found for the requested date.",
      slots: [],
    });
  });

  it("passes optional service_id and staff_id to provider", async () => {
    const slots = [{ start: "2024-06-10T14:00:00", end: "2024-06-10T15:30:00" }];
    mockGetAvailableSlots.mockResolvedValue(slots);

    const tool = createCheckAvailabilityTool("tenant-1");
    const result = await tool.execute!(
      { date: "2024-06-10", service_id: "svc-1", staff_id: "staff-2" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockGetAvailableSlots).toHaveBeenCalledWith(
      "tenant-1",
      "2024-06-10",
      "svc-1",
      "staff-2"
    );
    expect(result).toMatchObject({ available: true, slots: expect.any(Array) });
  });
});
