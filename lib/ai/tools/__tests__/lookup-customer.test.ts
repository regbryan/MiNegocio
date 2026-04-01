import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLookupCustomerTool } from "../lookup-customer";

vi.mock("@/lib/db/queries", () => ({
  getCustomerBySession: vi.fn(),
}));

import { getCustomerBySession } from "@/lib/db/queries";

const mockGetCustomerBySession = vi.mocked(getCustomerBySession);

const mockCustomer = {
  id: "cust-1",
  tenant_id: "tenant-1",
  full_name: "Ana García",
  phone: "+52 55 1234 5678",
  email: "ana@example.com",
  source: "web" as const,
  status: "active" as const,
  first_contact_at: "2024-01-01T00:00:00Z",
  last_interaction_at: "2024-06-01T00:00:00Z",
  last_visit_at: "2024-05-15T10:00:00Z",
  total_visits: 5,
  total_spent: 1500,
  favorite_service: "Corte de cabello",
  favorite_staff: "María López",
  tags: ["vip"],
  notes: "Prefers morning appointments",
  consent_marketing: true,
  created_at: "2024-01-01T00:00:00Z",
};

describe("createLookupCustomerTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns customer data when session has a linked customer", async () => {
    mockGetCustomerBySession.mockResolvedValue(mockCustomer);

    const tool = createLookupCustomerTool("tenant-1", "session-abc");
    const result = await tool.execute(
      { session_id: "session-abc" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({
      found: true,
      customer: {
        id: "cust-1",
        full_name: "Ana García",
        email: "ana@example.com",
        total_visits: 5,
        favorite_service: "Corte de cabello",
        favorite_staff: "María López",
        notes: "Prefers morning appointments",
        last_visit_at: "2024-05-15T10:00:00Z",
      },
    });
    expect(mockGetCustomerBySession).toHaveBeenCalledWith("tenant-1", "session-abc");
  });

  it("returns {found: false} when no linked customer", async () => {
    mockGetCustomerBySession.mockResolvedValue(null);

    const tool = createLookupCustomerTool("tenant-1", "session-xyz");
    const result = await tool.execute(
      { session_id: "session-xyz" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({ found: false, customer: null });
  });

  it("returns {found: false} when conversation does not exist", async () => {
    mockGetCustomerBySession.mockResolvedValue(null);

    const tool = createLookupCustomerTool("tenant-1", "nonexistent-session");
    const result = await tool.execute(
      { session_id: "nonexistent-session" },
      { messages: [], toolCallId: "call-1", abortSignal: new AbortController().signal }
    );

    expect(result).toEqual({ found: false, customer: null });
    expect(mockGetCustomerBySession).toHaveBeenCalledWith(
      "tenant-1",
      "nonexistent-session"
    );
  });
});
