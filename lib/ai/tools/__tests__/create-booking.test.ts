import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCreateBookingTool } from "../create-booking";

vi.mock("@/lib/db/queries", () => ({
  getServiceById: vi.fn(),
  getStaffById: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { getServiceById, getStaffById } from "@/lib/db/queries";
import { supabase } from "@/lib/db/client";

const mockGetServiceById = vi.mocked(getServiceById);
const mockGetStaffById = vi.mocked(getStaffById);
const mockRpc = vi.mocked(supabase.rpc);

const mockService = {
  id: "svc-1",
  tenant_id: "tenant-1",
  name: "Corte de cabello",
  description: "Corte clásico",
  price: 150,
  currency: "MXN",
  duration_minutes: 30,
  category: "cabello",
  available_days: [1, 2, 3, 4, 5, 6],
  active: true,
  created_at: "2024-01-01T00:00:00Z",
};

const mockStaff = {
  id: "staff-1",
  tenant_id: "tenant-1",
  name: "María López",
  role: "Estilista",
  service_ids: ["svc-1"],
  schedule_override: null,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
};

describe("createCreateBookingTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates booking when slot is available", async () => {
    mockGetServiceById.mockResolvedValue(mockService);
    mockGetStaffById.mockResolvedValue(null);
    mockRpc.mockResolvedValue({ data: { id: "booking-123" }, error: null } as never);

    const tool = createCreateBookingTool("tenant-1");
    const result = await tool.execute!(
      {
        customer_id: "cust-1",
        service_id: "svc-1",
        start_time: "2024-06-10T10:00:00.000Z",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockRpc).toHaveBeenCalledWith("book_appointment", {
      p_tenant_id: "tenant-1",
      p_customer_id: "cust-1",
      p_service_id: "svc-1",
      p_start_time: "2024-06-10T10:00:00.000Z",
      p_end_time: "2024-06-10T10:30:00.000Z",
      p_staff_id: null,
      p_notes: null,
    });
    expect(result).toMatchObject({
      id: "booking-123",
      service_name: "Corte de cabello",
    });
  });

  it("calculates end_time from service duration", async () => {
    // 90-minute service
    const longService = { ...mockService, duration_minutes: 90, name: "Tinte" };
    mockGetServiceById.mockResolvedValue(longService);
    mockGetStaffById.mockResolvedValue(null);
    mockRpc.mockResolvedValue({ data: { id: "booking-456" }, error: null } as never);

    const tool = createCreateBookingTool("tenant-1");
    await tool.execute!(
      {
        customer_id: "cust-1",
        service_id: "svc-1",
        start_time: "2024-06-10T14:00:00.000Z",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockRpc).toHaveBeenCalledWith(
      "book_appointment",
      expect.objectContaining({
        p_start_time: "2024-06-10T14:00:00.000Z",
        p_end_time: "2024-06-10T15:30:00.000Z",
      })
    );
  });

  it("returns confirmation with service name", async () => {
    mockGetServiceById.mockResolvedValue(mockService);
    mockGetStaffById.mockResolvedValue(null);
    mockRpc.mockResolvedValue({ data: { id: "booking-789" }, error: null } as never);

    const tool = createCreateBookingTool("tenant-1");
    const result = await tool.execute!(
      {
        customer_id: "cust-1",
        service_id: "svc-1",
        start_time: "2024-06-10T09:00:00.000Z",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toMatchObject({
      id: "booking-789",
      service_name: "Corte de cabello",
      date: "2024-06-10",
      time: "09:00",
    });
  });

  it("returns error when slot is taken", async () => {
    mockGetServiceById.mockResolvedValue(mockService);
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Slot is already booked" },
    } as never);

    const tool = createCreateBookingTool("tenant-1");
    const result = await tool.execute!(
      {
        customer_id: "cust-1",
        service_id: "svc-1",
        start_time: "2024-06-10T10:00:00.000Z",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({ error: "Slot is already booked" });
  });

  it("returns error when staff cannot perform service", async () => {
    mockGetServiceById.mockResolvedValue(mockService);
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Staff cannot perform this service" },
    } as never);

    const tool = createCreateBookingTool("tenant-1");
    const result = await tool.execute!(
      {
        customer_id: "cust-1",
        service_id: "svc-1",
        start_time: "2024-06-10T10:00:00.000Z",
        staff_id: "staff-2",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({ error: "Staff cannot perform this service" });
  });

  it("includes staff_name in confirmation when staff_id is provided", async () => {
    mockGetServiceById.mockResolvedValue(mockService);
    mockGetStaffById.mockResolvedValue(mockStaff);
    mockRpc.mockResolvedValue({ data: { id: "booking-999" }, error: null } as never);

    const tool = createCreateBookingTool("tenant-1");
    const result = await tool.execute!(
      {
        customer_id: "cust-1",
        service_id: "svc-1",
        start_time: "2024-06-10T10:00:00.000Z",
        staff_id: "staff-1",
      },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toMatchObject({
      id: "booking-999",
      service_name: "Corte de cabello",
      staff_name: "María López",
    });
  });
});
