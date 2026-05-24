"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { AnonymizedBooking } from "@/lib/db/landing-queries";

/**
 * Section 3 — "Lo estás viendo en vivo."
 *
 * Renders the most recent confirmed bookings as styled WhatsApp-like cards.
 * Customer last names + emails + phone numbers are never sent client-side —
 * the server query already strips them. Each card fades in on scroll the
 * first time it enters the viewport (no looping).
 */
export function LiveTranscriptSection({
  bookings,
}: {
  bookings: AnonymizedBooking[];
}) {
  // Fewer than 3 anonymized bookings → hide the section per brief.
  if (bookings.length < 3) return null;

  return (
    <section
      aria-labelledby="live-title"
      className="border-t border-white/[0.06] bg-[#0a0a0a]"
    >
      <div className="mx-auto max-w-[1800px] px-6 py-24 md:px-10 md:py-32">
        <div className="mb-12 max-w-3xl">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#48a890]">
            Lo estás viendo en vivo
          </div>
          <h2
            id="live-title"
            className="mt-4 text-[36px] leading-[1.05] font-semibold tracking-[-0.03em] text-white md:text-[44px]"
          >
            Citas reales agendadas estos días.
          </h2>
          <p className="mt-5 max-w-[52ch] text-[15px] leading-[1.6] text-white/55 md:text-[16px]">
            Cada tarjeta es una conversación real con el agente. Nombres
            recortados y datos personales eliminados antes de mostrar.
          </p>
        </div>

        <ul
          role="list"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-5"
        >
          {bookings.map((b, i) => (
            <BookingCard key={i} index={i} booking={b} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function BookingCard({
  index,
  booking,
}: {
  index: number;
  booking: AnonymizedBooking;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.5,
        delay: reduce ? 0 : 0.05 * index,
        ease: [0.22, 1, 0.36, 1], // ease-out-quart
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl",
        "border border-white/8 bg-[#0f0f0f]",
        "px-5 py-5",
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
        <span className="inline-flex items-center gap-1.5 text-[#48a890]">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01a1.09 1.09 0 0 0-.79.371c-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
          </svg>
          WhatsApp
        </span>
        <span className="text-white/15">·</span>
        <span>agendada</span>
      </div>

      <div className="mt-4 text-[17px] leading-[1.4] tracking-[-0.005em] text-white">
        <span className="text-white/55">{booking.firstName}</span>{" "}
        reservó{" "}
        <span className="font-medium">{booking.serviceName.toLowerCase()}</span>{" "}
        para el{" "}
        <span className="font-medium text-white">
          {booking.weekdayEs} {booking.dateEs}
        </span>{" "}
        a las{" "}
        <span className="font-mono tabular-nums text-white">
          {booking.time}
        </span>
      </div>

      {/* Subtle teal accent line — DESIGN.md restrained, not a side stripe */}
      <div
        aria-hidden="true"
        className="mt-5 h-px w-12 bg-[#48a890]/30 transition-[width] duration-500 group-hover:w-20"
      />
    </motion.li>
  );
}
