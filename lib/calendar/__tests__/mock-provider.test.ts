import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Tenant, Service, Staff, Booking } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock DB queries module BEFORE importing the provider
// ---------------------------------------------------------------------------
vi.mock("@/lib/db/queries", () => ({
  getTenantById: vi.fn(),
  getServiceById: vi.fn(),
  getStaffById: vi.fn(),
  getBookingsForDate: vi.fn(),
}));

import {
  getTenantById,
  getServiceById,
  getStaffById,
  getBookingsForDate,
} from "@/lib/db/queries";
import { mockCalendarProvider } from "@/lib/calendar/mock-provider";

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------
const mockGetTenantById = vi.mocked(getTenantById);
const mockGetServiceById = vi.mocked(getServiceById);
const mockGetStaffById = vi.mocked(getStaffById);
const mockGetBookingsForDate = vi.mocked(getBookingsForDate);

// ---------------------------------------------------------------------------
// Salon María seed fixtures
// Business hours: Mon–Sat 09:00–19:00, Sunday closed
// Lunch break: Mon–Fri 14:00–15:00
// buffer_minutes: 10, min_notice_hours: 1, max_advance_days: 30, max_concurrent: 1
// ---------------------------------------------------------------------------

const TENANT_ID = "tenant-salon-maria";
const SERVICE_ID = "svc-corte-basic";
const STAFF_ID = "staff-ana";

const baseTenant: Tenant = {
  id: TENANT_ID,
  slug: "salon-maria",
  business_name: "Salón María",
  vertical: "salon",
  description: "A test salon",
  address_street: "Calle Falsa 123",
  address_colonia: "Centro",
  address_city: "CDMX",
  address_state: "CDMX",
  address_zip: "06600",
  phone: null,
  whatsapp_number: null,
  social_links: null,
  // Mon–Sat open 09:00–19:00, Sunday (0) closed
  business_hours: {
    "0": null,
    "1": { open: "09:00", close: "19:00" },
    "2": { open: "09:00", close: "19:00" },
    "3": { open: "09:00", close: "19:00" },
    "4": { open: "09:00", close: "19:00" },
    "5": { open: "09:00", close: "19:00" },
    "6": { open: "09:00", close: "19:00" },
  },
  // Lunch Mon–Fri 14:00–15:00
  break_times: [
    { days: [1, 2, 3, 4, 5], start: "14:00", end: "15:00", label: "Lunch" },
  ],
  max_advance_days: 30,
  min_notice_hours: 1,
  buffer_minutes: 10,
  max_concurrent: 1,
  ai_language: "es",
  ai_tone: "friendly",
  ai_greeting: null,
  ai_signoff: null,
  ai_forbidden_topics: [],
  complaint_handling: null,
  auto_escalate_complaints: false,
  booking_mode: "auto",
  payment_methods: ["cash"],
  tax_included: true,
  extra_fee_notes: null,
  first_visit_instructions: null,
  created_at: "2024-01-01T00:00:00Z",
};

const baseService: Service = {
  id: SERVICE_ID,
  tenant_id: TENANT_ID,
  name: "Corte básico",
  description: null,
  price: 150,
  currency: "MXN",
  duration_minutes: 60,
  category: "corte",
  // Available Mon–Sat (1–6)
  available_days: [1, 2, 3, 4, 5, 6],
  active: true,
  created_at: "2024-01-01T00:00:00Z",
};

const baseStaff: Staff = {
  id: STAFF_ID,
  tenant_id: TENANT_ID,
  name: "Ana",
  role: "stylist",
  service_ids: [SERVICE_ID],
  schedule_override: null,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick a future weekday so tests stay valid as the clock advances.
 *  Targets 7+ days out so we're inside max_advance_days but past min_notice_hours. */
function nextWeekdayDate(targetDow: number, daysOutMin = 7): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const today = d.getUTCDay();
  let delta = (targetDow - today + 7) % 7;
  if (delta < daysOutMin) delta += 7 * Math.ceil((daysOutMin - delta) / 7);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
const MONDAY = nextWeekdayDate(1); // next Monday at least a week out
const SUNDAY = nextWeekdayDate(0); // next Sunday at least a week out
const SATURDAY_NEXT = nextWeekdayDate(6); // next Saturday at least a week out

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    tenant_id: TENANT_ID,
    customer_id: "cust-1",
    service_id: SERVICE_ID,
    staff_id: null,
    start_time: `${MONDAY}T10:00:00`,
    end_time: `${MONDAY}T11:00:00`,
    status: "confirmed",
    source: "web",
    notes: null,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Default: open tenant, 60-min service, no staff override, no bookings
  mockGetTenantById.mockResolvedValue(baseTenant);
  mockGetServiceById.mockResolvedValue(baseService);
  mockGetStaffById.mockResolvedValue(baseStaff);
  mockGetBookingsForDate.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mockCalendarProvider.getAvailableSlots", () => {
  // 1. Closed day returns empty
  it("returns empty array for a closed day (Sunday)", async () => {
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      SUNDAY
    );
    expect(slots).toEqual([]);
  });

  // 2. Open day returns slots within business hours
  it("returns slots within 09:00–19:00 for Monday", async () => {
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      MONDAY
    );
    // All starts must be >= 09:00 and all ends <= 19:00
    for (const s of slots) {
      const start = s.start.slice(11, 16); // "HH:MM"
      const end = s.end.slice(11, 16);
      expect(start >= "09:00").toBe(true);
      expect(end <= "19:00").toBe(true);
    }
    expect(slots.length).toBeGreaterThan(0);
  });

  // 3. Break times excluded (no slot overlapping 14:00–15:00 on Monday)
  it("excludes slots during break time 14:00–15:00 on Monday", async () => {
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      MONDAY
    );
    for (const s of slots) {
      const startMin = timeToMinutes(s.start.slice(11, 16));
      const endMin = timeToMinutes(s.end.slice(11, 16));
      const breakStart = timeToMinutes("14:00");
      const breakEnd = timeToMinutes("15:00");
      // Slot must not overlap [breakStart, breakEnd)
      const overlaps = startMin < breakEnd && endMin > breakStart;
      expect(overlaps).toBe(false);
    }
  });

  // 4. Excludes already-booked slots
  it("excludes slots that overlap a confirmed booking", async () => {
    // Booking: 10:00–11:00
    mockGetBookingsForDate.mockResolvedValue([makeBooking()]);
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      MONDAY
    );
    for (const s of slots) {
      const startMin = timeToMinutes(s.start.slice(11, 16));
      const endMin = timeToMinutes(s.end.slice(11, 16));
      const bookedStart = timeToMinutes("10:00");
      const bookedEnd = timeToMinutes("11:00");
      const overlaps = startMin < bookedEnd && endMin > bookedStart;
      expect(overlaps).toBe(false);
    }
  });

  // 5. Buffer minutes respected after a booking
  it("respects buffer_minutes (10 min) after a booked slot", async () => {
    // Booking ends at 11:00; with 10-min buffer, next slot can start at 11:10 earliest
    mockGetBookingsForDate.mockResolvedValue([makeBooking()]);
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      MONDAY
    );
    // No slot should start between 11:00 and 11:10 (exclusive)
    for (const s of slots) {
      const startMin = timeToMinutes(s.start.slice(11, 16));
      const bookedEnd = timeToMinutes("11:00");
      if (startMin >= bookedEnd) {
        expect(startMin >= bookedEnd + 10).toBe(true);
      }
    }
  });

  // 6. min_notice_hours: no slot sooner than now + min_notice_hours
  it("respects min_notice_hours (no slots too soon from now)", async () => {
    // Use today's real date/time to verify no past-or-too-soon slots appear
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    // Re-mock tenant and bookings for today
    mockGetBookingsForDate.mockResolvedValue([]);
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      todayStr
    );
    const minNoticeMs = baseTenant.min_notice_hours * 60 * 60 * 1000;
    const earliest = new Date(Date.now() + minNoticeMs);
    for (const s of slots) {
      const slotStart = new Date(s.start);
      expect(slotStart.getTime()).toBeGreaterThanOrEqual(earliest.getTime() - 60000); // 1-min tolerance
    }
  });

  // 7. max_advance_days: no slots beyond today + max_advance_days
  it("returns empty for a date beyond max_advance_days", async () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + baseTenant.max_advance_days + 1);
    const farDate = farFuture.toISOString().slice(0, 10);
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      farDate
    );
    expect(slots).toEqual([]);
  });

  // 8. max_concurrent > 1: only blocks when concurrent limit reached
  it("allows slots when max_concurrent=2 and only 1 overlapping booking exists", async () => {
    const tenant2 = { ...baseTenant, max_concurrent: 2 };
    mockGetTenantById.mockResolvedValue(tenant2);
    // One booking 10:00–11:00
    mockGetBookingsForDate.mockResolvedValue([makeBooking()]);
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      MONDAY
    );
    // The 10:00 slot should still be available (only 1 booking, limit is 2)
    const tenOclock = slots.find((s) => s.start.slice(11, 16) === "10:00");
    expect(tenOclock).toBeDefined();
  });

  // 9. Staff schedule_override used when staffId provided
  it("uses staff schedule_override instead of business hours when staffId provided", async () => {
    // Staff only works 10:00–12:00 on Monday
    const staffWithOverride: Staff = {
      ...baseStaff,
      schedule_override: {
        "0": null,
        "1": { open: "10:00", close: "12:00" },
        "2": null,
        "3": null,
        "4": null,
        "5": null,
        "6": null,
      },
    };
    mockGetStaffById.mockResolvedValue(staffWithOverride);
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      MONDAY,
      SERVICE_ID,
      STAFF_ID
    );
    for (const s of slots) {
      const start = s.start.slice(11, 16);
      const end = s.end.slice(11, 16);
      expect(start >= "10:00").toBe(true);
      expect(end <= "12:00").toBe(true);
    }
    expect(slots.length).toBeGreaterThan(0);
  });

  // 10. Service available_days filter
  it("returns empty if service is not available on requested day", async () => {
    // Service only available Mon (1) — test Saturday (6)
    const saturdayService: Service = {
      ...baseService,
      available_days: [1],
    };
    mockGetServiceById.mockResolvedValue(saturdayService);
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      SATURDAY_NEXT,
      SERVICE_ID
    );
    expect(slots).toEqual([]);
  });

  // 11. 30-minute interval slots fitting service duration
  it("generates 30-minute interval slots that fit service duration (60 min)", async () => {
    const slots = await mockCalendarProvider.getAvailableSlots(
      TENANT_ID,
      MONDAY,
      SERVICE_ID
    );
    for (const s of slots) {
      const startMin = timeToMinutes(s.start.slice(11, 16));
      const endMin = timeToMinutes(s.end.slice(11, 16));
      // Duration = 60 min
      expect(endMin - startMin).toBe(60);
      // Start must be on 30-min boundary
      expect(startMin % 30).toBe(0);
    }
  });
});

describe("mockCalendarProvider.createEvent", () => {
  it("returns a string (even empty) without throwing", async () => {
    const result = await mockCalendarProvider.createEvent(TENANT_ID, {
      tenant_id: TENANT_ID,
      customer_id: "cust-1",
      service_id: SERVICE_ID,
      start_time: `${MONDAY}T10:00:00`,
      end_time: `${MONDAY}T11:00:00`,
    });
    expect(typeof result).toBe("string");
  });
});

describe("mockCalendarProvider.cancelEvent", () => {
  it("resolves without throwing", async () => {
    await expect(
      mockCalendarProvider.cancelEvent(TENANT_ID, "evt-123")
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
