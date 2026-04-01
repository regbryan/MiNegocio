import { describe, it, expect, vi, beforeEach } from "vitest";
import { createListServicesTool } from "../list-services";

vi.mock("@/lib/db/queries", () => ({
  getServices: vi.fn(),
}));

import { getServices } from "@/lib/db/queries";

const mockGetServices = vi.mocked(getServices);

const mockServices = [
  {
    id: "svc-1",
    tenant_id: "tenant-1",
    name: "Corte de cabello",
    description: "Corte clásico para caballero",
    price: 150,
    currency: "MXN",
    duration_minutes: 30,
    category: "cabello",
    available_days: [1, 2, 3, 4, 5, 6],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "svc-2",
    tenant_id: "tenant-1",
    name: "Tinte",
    description: "Coloración completa",
    price: 400,
    currency: "MXN",
    duration_minutes: 90,
    category: "cabello",
    available_days: [1, 2, 3, 4, 5],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "svc-3",
    tenant_id: "tenant-1",
    name: "Manicure",
    description: "Manicure básico",
    price: 120,
    currency: "MXN",
    duration_minutes: 45,
    category: "unas",
    available_days: [1, 2, 3, 4, 5, 6],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

describe("createListServicesTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all active services when no category filter", async () => {
    mockGetServices.mockResolvedValue(mockServices);

    const tool = createListServicesTool("tenant-1");
    const result = await tool.execute(
      {},
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockGetServices).toHaveBeenCalledWith("tenant-1", undefined);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: "svc-1",
      name: "Corte de cabello",
      description: "Corte clásico para caballero",
      price: 150,
      currency: "MXN",
      duration_minutes: 30,
      category: "cabello",
    });
  });

  it("filters services by category", async () => {
    const hairServices = mockServices.filter((s) => s.category === "cabello");
    mockGetServices.mockResolvedValue(hairServices);

    const tool = createListServicesTool("tenant-1");
    const result = await tool.execute(
      { category: "cabello" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockGetServices).toHaveBeenCalledWith("tenant-1", "cabello");
    expect(result).toHaveLength(2);
    expect(result.every((s: { category: string | null }) => s.category === "cabello")).toBe(true);
  });

  it("returns formatted service info with all required fields", async () => {
    mockGetServices.mockResolvedValue([mockServices[2]]);

    const tool = createListServicesTool("tenant-1");
    const result = await tool.execute(
      { category: "unas" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result[0]).toMatchObject({
      id: "svc-3",
      name: "Manicure",
      description: "Manicure básico",
      price: 120,
      currency: "MXN",
      duration_minutes: 45,
      category: "unas",
    });
    // Should not include internal fields like tenant_id, active, available_days
    expect(result[0]).not.toHaveProperty("tenant_id");
    expect(result[0]).not.toHaveProperty("active");
    expect(result[0]).not.toHaveProperty("available_days");
  });
});
