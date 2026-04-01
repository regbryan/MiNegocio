import type { CalendarProvider, TimeSlot, BookingData } from "./provider";
import {
  getTenantById,
  getServiceById,
  getStaffById,
  getBookingsForDate,
} from "@/lib/db/queries";
import type { Booking, BusinessHours, BreakTime } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Combine a date string (YYYY-MM-DD) and HH:MM into an ISO datetime string. */
function toIsoString(date: string, hhmm: string): string {
  return `${date}T${hhmm}:00`;
}

// ---------------------------------------------------------------------------
// Mock CalendarProvider
// ---------------------------------------------------------------------------

export const mockCalendarProvider: CalendarProvider = {
  async getAvailableSlots(
    tenantId: string,
    date: string,
    serviceId?: string,
    staffId?: string
  ): Promise<TimeSlot[]> {
    // ------------------------------------------------------------------
    // Step 1: Resolve day-of-week (0=Sunday…6=Saturday)
    // ------------------------------------------------------------------
    // Parse date as local by appending T00:00:00 so it isn't shifted by UTC
    const dateObj = new Date(`${date}T00:00:00`);
    const dow = dateObj.getDay(); // 0–6

    // ------------------------------------------------------------------
    // Step 2: Load tenant
    // ------------------------------------------------------------------
    const tenant = await getTenantById(tenantId);
    if (!tenant) return [];

    // ------------------------------------------------------------------
    // Step 11 (early): max_advance_days check
    // ------------------------------------------------------------------
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(`${date}T00:00:00`);
    const diffDays = Math.round(
      (requestedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0 || diffDays > tenant.max_advance_days) return [];

    // ------------------------------------------------------------------
    // Step 3: Determine base hours window (business_hours or staff override)
    // ------------------------------------------------------------------
    let hoursSource: BusinessHours = tenant.business_hours;

    // Step 5: If staffId provided, load staff and use schedule_override
    let staffRecord = null;
    if (staffId) {
      staffRecord = await getStaffById(staffId);
      if (staffRecord?.schedule_override) {
        hoursSource = staffRecord.schedule_override;
      }
    }

    const dayHours = hoursSource[String(dow)];
    if (!dayHours) return []; // closed

    const openMin = timeToMinutes(dayHours.open);
    const closeMin = timeToMinutes(dayHours.close);

    // ------------------------------------------------------------------
    // Step 4: Load service duration
    // ------------------------------------------------------------------
    let durationMin = 60; // default
    let serviceRecord = null;
    if (serviceId) {
      serviceRecord = await getServiceById(serviceId);
      if (serviceRecord) {
        durationMin = serviceRecord.duration_minutes;

        // Step 12: Check service available_days
        if (!serviceRecord.available_days.includes(dow)) return [];
      }
    }

    // Step 9 (staff service check): staff must offer this service
    if (staffId && serviceId && staffRecord) {
      if (!staffRecord.service_ids.includes(serviceId)) return [];
    }

    // ------------------------------------------------------------------
    // Step 6: Load existing confirmed bookings
    // ------------------------------------------------------------------
    const existingBookings = await getBookingsForDate(tenantId, date);

    // Convert bookings to [startMin, endMin] windows (relative to midnight)
    const bookedWindows = existingBookings.map((b: Booking) => ({
      start: timeToMinutes(b.start_time.slice(11, 16)),
      end: timeToMinutes(b.end_time.slice(11, 16)),
    }));

    // ------------------------------------------------------------------
    // Step 3b: Identify break windows for this day
    // ------------------------------------------------------------------
    const breakWindows = tenant.break_times
      .filter((bt: BreakTime) => bt.days.includes(dow))
      .map((bt: BreakTime) => ({
        start: timeToMinutes(bt.start),
        end: timeToMinutes(bt.end),
      }));

    // ------------------------------------------------------------------
    // Step 9: Generate candidate slots at 30-minute intervals
    // ------------------------------------------------------------------
    const INTERVAL = 30;
    const slots: TimeSlot[] = [];
    const nowMs = Date.now();
    const minNoticeMs = tenant.min_notice_hours * 60 * 60 * 1000;

    for (
      let startMin = openMin;
      startMin + durationMin <= closeMin;
      startMin += INTERVAL
    ) {
      const endMin = startMin + durationMin;

      // ------------------------------------------------------------------
      // Step 10: min_notice_hours filter
      // ------------------------------------------------------------------
      const slotStartMs = new Date(toIsoString(date, minutesToTime(startMin))).getTime();
      if (slotStartMs < nowMs + minNoticeMs) continue;

      // ------------------------------------------------------------------
      // Step 3c: Break time overlap check
      // ------------------------------------------------------------------
      const overlapsBreak = breakWindows.some(
        (bw) => startMin < bw.end && endMin > bw.start
      );
      if (overlapsBreak) continue;

      // ------------------------------------------------------------------
      // Steps 7 & 8: Booking conflict + buffer + max_concurrent
      // ------------------------------------------------------------------
      const { buffer_minutes: bufferMin, max_concurrent: maxConcurrent } = tenant;

      // Count how many bookings overlap this candidate slot (considering buffer on booked end)
      let concurrentCount = 0;
      for (const bw of bookedWindows) {
        // Booked window including buffer after it
        const blockedUntil = bw.end + bufferMin;
        // A booking overlaps the candidate slot if:
        //   booked_start < slot_end  AND  slot_start < blockedUntil
        if (bw.start < endMin && startMin < blockedUntil) {
          concurrentCount++;
        }
      }

      if (concurrentCount >= maxConcurrent) continue;

      slots.push({
        start: toIsoString(date, minutesToTime(startMin)),
        end: toIsoString(date, minutesToTime(endMin)),
      });
    }

    return slots;
  },

  async createEvent(_tenantId: string, _booking: BookingData): Promise<string> {
    return ""; // no-op in mock
  },

  async cancelEvent(_tenantId: string, _eventId: string): Promise<void> {
    // no-op in mock
  },
};
