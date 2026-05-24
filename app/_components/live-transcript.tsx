"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { AnonymizedBooking } from "@/lib/db/landing-queries";

/**
 * Section 3 — "Lo estás viendo en vivo."
 *
 * Hidden when there are fewer than 3 confirmed bookings so the page doesn't
 * ship with a thin column. Warm-lane styling to match the rest of the
 * landing.
 */
export function LiveTranscriptSection({
  bookings,
}: {
  bookings: AnonymizedBooking[];
}) {
  if (bookings.length < 3) return null;

  return (
    <section
      aria-labelledby="live-title"
      className="bg-[#f5ebd8] text-[#2a1f15]"
    >
      <div className="mx-auto max-w-[1800px] px-6 py-24 md:px-10 md:py-32">
        <div className="mb-14 max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a8552f]">
            Lo estás viendo en vivo
          </p>
          <h2
            id="live-title"
            className={cn(
              "font-spectral",
              "mt-5 max-w-[16ch]",
              "text-[36px] leading-[1.05] font-medium tracking-[-0.015em]",
              "md:text-[42px] lg:text-[46px]",
            )}
          >
            Citas reales agendadas estos días.
          </h2>
          <p
            className={cn(
              "font-spectral italic",
              "mt-5 max-w-[52ch]",
              "text-[15px] leading-[1.6] text-[#6b594a]",
              "md:text-[16px]",
            )}
          >
            Cada tarjeta es una conversación real con el agente. Apellidos y
            datos personales eliminados antes de mostrar.
          </p>
        </div>

        <ul
          role="list"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6"
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
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.5,
        delay: reduce ? 0 : 0.05 * index,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "border border-[#c4ad84]/60 bg-[#fff8ed]",
        "px-6 py-6",
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a8552f]">
        Vía WhatsApp · agendada
      </div>

      <p
        className={cn(
          "font-spectral",
          "mt-4 text-[18px] leading-[1.4] tracking-[-0.005em] text-[#2a1f15]",
        )}
      >
        <span className="italic text-[#6b594a]">{booking.firstName}</span>{" "}
        reservó{" "}
        <span className="font-medium">{booking.serviceName.toLowerCase()}</span>{" "}
        para el{" "}
        <span className="font-medium">
          {booking.weekdayEs} {booking.dateEs}
        </span>{" "}
        a las{" "}
        <span className="font-mono tabular-nums text-[#2a1f15]">
          {booking.time}
        </span>
        .
      </p>

      <div
        aria-hidden="true"
        className="mt-6 h-px w-12 bg-[#c66c4a]/35 transition-[width] duration-500 group-hover:w-20"
      />
    </motion.li>
  );
}
