import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCreateCustomerTool } from "../create-customer";

vi.mock("@/lib/db/queries", () => ({
  createCustomer: vi.fn(),
  linkCustomerToConversation: vi.fn(),
}));

import { createCustomer, linkCustomerToConversation } from "@/lib/db/queries";

const mockCreateCustomer = vi.mocked(createCustomer);
const mockLinkCustomerToConversation = vi.mocked(linkCustomerToConversation);

const baseCustomer = {
  id: "cust-new",
  tenant_id: "tenant-1",
  phone: null,
  source: "web" as const,
  status: "lead" as const,
  first_contact_at: null,
  last_interaction_at: null,
  last_visit_at: null,
  total_visits: 0,
  total_spent: 0,
  favorite_service: null,
  favorite_staff: null,
  tags: [],
  notes: null,
  consent_marketing: false,
  created_at: "2024-06-01T00:00:00Z",
};

describe("createCreateCustomerTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLinkCustomerToConversation.mockResolvedValue(undefined);
  });

  it("creates customer and links to conversation", async () => {
    const newCustomer = { ...baseCustomer, full_name: "Carlos Pérez", email: null };
    mockCreateCustomer.mockResolvedValue(newCustomer);

    const tool = createCreateCustomerTool("tenant-1", "session-abc");
    const result = await tool.execute!(
      { full_name: "Carlos Pérez" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockCreateCustomer).toHaveBeenCalledWith("tenant-1", {
      full_name: "Carlos Pérez",
      email: undefined,
    });
    expect(mockLinkCustomerToConversation).toHaveBeenCalledWith(
      "tenant-1",
      "session-abc",
      "cust-new"
    );
    expect(result).toMatchObject({
      id: "cust-new",
      full_name: "Carlos Pérez",
    });
  });

  it("creates customer with email", async () => {
    const newCustomer = {
      ...baseCustomer,
      full_name: "Laura Martínez",
      email: "laura@example.com",
    };
    mockCreateCustomer.mockResolvedValue(newCustomer);

    const tool = createCreateCustomerTool("tenant-1", "session-abc");
    const result = await tool.execute!(
      { full_name: "Laura Martínez", email: "laura@example.com" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockCreateCustomer).toHaveBeenCalledWith("tenant-1", {
      full_name: "Laura Martínez",
      email: "laura@example.com",
    });
    expect(result).toMatchObject({
      id: "cust-new",
      full_name: "Laura Martínez",
      email: "laura@example.com",
    });
  });

  it("creates customer without email", async () => {
    const newCustomer = { ...baseCustomer, full_name: "José Ramírez", email: null };
    mockCreateCustomer.mockResolvedValue(newCustomer);

    const tool = createCreateCustomerTool("tenant-1", "session-abc");
    const result = await tool.execute!(
      { full_name: "José Ramírez" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(mockCreateCustomer).toHaveBeenCalledWith("tenant-1", {
      full_name: "José Ramírez",
      email: undefined,
    });
    expect(result).toMatchObject({ full_name: "José Ramírez", email: null });
  });
});
