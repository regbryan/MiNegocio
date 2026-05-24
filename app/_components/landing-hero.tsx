"use client";

import { ChatInterface } from "@/app/chat/[tenantSlug]/_components/chat-interface";
import { cn } from "@/lib/utils";

/**
 * Landing hero — editorial split.
 *
 * Composition logic: the chat is the protagonist on this page, not the
 * headline. So the right column is wider and visually heavier (warmer
 * surface, teal cast), and the left column is a quiet editorial rail
 * (mascot, one strong sentence, a single CTA, a spec sheet).
 *
 * What is deliberately absent:
 * - No "Probar aquí" button. The chat IS right there.
 * - No traffic-light dots, no presence pulses, no launch-badge pill.
 * - No "↓ aquí abajo" caption — the spatial relationship reads on its own
 *   because the chat is the bright object on the page.
 * - No gradient text, no centered hero, no dual-CTA pattern.
 */

const WHATSAPP_SANDBOX_NUMBER = "+1 415 523 8886";
const WHATSAPP_DEEP_LINK =
  "https://wa.me/14155238886?text=" +
  encodeURIComponent("hola, quiero hacer una cita");

export function LandingHero(_props: { bookingsCount: number }) {
  // bookingsCount intentionally unused — the chat asserts legitimacy, not a
  // counter pill. Prop is kept so the server caller doesn't change.
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
    >
      {/* Ambient backlight — a tight teal pool offstage right, behind the
          chat panel. Just enough that the page has a felt light source. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_15%,rgba(72,168,144,0.10),transparent_60%)]"
      />

      <div className="mx-auto max-w-[1800px] px-6 pt-10 pb-20 md:px-10 md:pt-14 md:pb-28 lg:pt-16 lg:pb-32">
        <div
          className={cn(
            "grid grid-cols-1 gap-12",
            // Editorial split — the chat is wider than the text rail.
            "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16",
            "xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:gap-20",
          )}
        >
          {/* ── Left rail: editorial ─────────────────────────────────── */}
          <div className="flex flex-col">
            {/* Mascot + headline as a single composition — the mascot is the
                first letter of the brand, set adjacent to (not floating
                above) the wordmark-sized type. */}
            <div className="flex items-end gap-4 md:gap-5 lg:gap-6">
              <img
                src="/mascot.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                className={cn(
                  "shrink-0 select-none",
                  "h-44 w-auto",
                  "md:h-56",
                  "lg:h-60",
                  "xl:h-72",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mb-2 hidden font-mono uppercase tracking-[0.18em] text-[#48a890]/70",
                  "text-[10px] lg:inline-block",
                )}
              >
                MiNegocio · piloto
              </span>
            </div>

            <h1
              id="hero-title"
              className={cn(
                "mt-8 max-w-[16ch]",
                "text-[44px] leading-[0.98] font-semibold tracking-[-0.035em] text-white",
                "md:text-[58px]",
                "lg:text-[62px]",
                "xl:text-[72px]",
              )}
            >
              Tu negocio responde{" "}
              <span className="text-white/45">aunque tú no estés.</span>
            </h1>

            <p
              className={cn(
                "mt-8 max-w-[42ch]",
                "text-[16px] leading-[1.6] text-white/65",
                "md:text-[17px]",
              )}
            >
              Un asistente que contesta WhatsApp, agenda citas y manda la
              confirmación por correo. Está despierto a las 11 de la noche y
              a las 6 de la mañana. Pruébalo a la derecha, o mándale un
              mensaje al número de prueba.
            </p>

            <div className="mt-10">
              <a
                href={WHATSAPP_DEEP_LINK}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "group inline-flex items-center gap-2.5 rounded-md",
                  "bg-[#48a890] px-5 py-3 text-[15px] font-medium text-black",
                  "transition-colors duration-150 hover:bg-[#54bda1]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48a890]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
                )}
              >
                <WhatsAppGlyph />
                Agendar por WhatsApp
              </a>
            </div>

            <SpecSheet number={WHATSAPP_SANDBOX_NUMBER} />
          </div>

          {/* ── Right area: the live chat ────────────────────────────── */}
          <ChatPanel />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Chat panel                                                                */
/* -------------------------------------------------------------------------- */

function ChatPanel() {
  return (
    <div className="flex flex-col">
      {/* Tiny editorial label so the right column has a kicker that reads
          before the chat content paints — quiet, not a launch pill. */}
      <div className="mb-4 flex items-baseline justify-between gap-6">
        <p className="text-[15px] leading-snug text-white md:text-[16px]">
          <span className="font-medium">Salúdalo tú.</span>{" "}
          <span className="text-white/55">
            Te contesta como una persona, en segundos.
          </span>
        </p>
      </div>

      <div
        id="embedded-chat"
        className={cn(
          "relative w-full overflow-hidden rounded-2xl",
          // The chat is the bright object on the page. It sits on a lifted
          // surface, with a single hairline. No traffic-light header chrome,
          // no double-card stacking — the ChatInterface owns its own header.
          "border border-white/[0.10] bg-[#0f0f0f]",
          // Outer shadow only on the panel edge per DESIGN.md panel-floating.
          // The teal cast is the page's light source, not a halo decoration.
          "shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7),0_0_60px_-20px_rgba(72,168,144,0.18)]",
        )}
      >
        <ChatInterface
          tenantSlug="salon-maria"
          businessName="Salon Maria"
          containerClassName="h-[580px] md:h-[620px] lg:h-[640px]"
        />
      </div>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Spec sheet — quiet typographic block of operational facts                 */
/* -------------------------------------------------------------------------- */

function SpecSheet({ number }: { number: string }) {
  return (
    <dl
      className={cn(
        "mt-12 grid grid-cols-1 gap-y-4 border-t border-white/[0.08] pt-6",
        "sm:grid-cols-2 sm:gap-x-10",
        "lg:grid-cols-3 lg:gap-x-8",
      )}
    >
      <SpecRow label="Número de prueba" value={number} mono />
      <SpecRow
        label="Quien responde"
        value="El agente que ves al lado"
      />
      <SpecRow label="Confirmación" value="Por correo, con .ics" />
    </dl>
  );
}

function SpecRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/35">
        {label}
      </dt>
      <dd
        className={cn(
          "text-[14px] text-white/80",
          mono && "font-mono tracking-[0.02em]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inline glyph — WhatsApp icon for the CTA only                             */
/* -------------------------------------------------------------------------- */

function WhatsAppGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01a1.09 1.09 0 0 0-.79.371c-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  );
}
