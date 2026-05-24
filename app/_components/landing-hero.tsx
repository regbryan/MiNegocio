"use client";

import { ChatInterface } from "@/app/chat/[tenantSlug]/_components/chat-interface";
import { cn } from "@/lib/utils";

/**
 * Landing hero — warm hospitality lane (Lane A from the visual probes).
 *
 * Completely off the dark-developer-tool track. Cream canvas, clay-red CTA,
 * sage detail, Spectral serif display. Mascot is illustration-scale on the
 * left, chat lives inside a phone-frame on the right (phone screens being
 * dark in context is the only reason the embedded chat doesn't fight the
 * page — it reads as "what your customer sees on their phone").
 *
 * Palette (warm-hospitality, NOT in DESIGN.md — per-page brand exception):
 *   canvas        #f5ebd8   cream paper, slightly warmer than oat
 *   canvas-deep   #ead8b6   secondary panel tone
 *   ink           #2a1f15   warm dark instead of pure black
 *   ink-muted     #6b594a   warm body text
 *   clay          #c66c4a   primary CTA / accent
 *   clay-deep     #a8552f   clay hover
 *   sage          #7a9474   secondary accent (used VERY sparingly)
 */

// Email used for "request WhatsApp demo access" — until Kapso moves out of
// sandbox the number can't accept cold inbound, so visitors who want to
// experience it from WhatsApp send a quick email and we whitelist their phone.
const REQUEST_WHATSAPP_EMAIL = "reggie@inspiredideationstrategies.com";
const REQUEST_WHATSAPP_MAILTO =
  `mailto:${REQUEST_WHATSAPP_EMAIL}` +
  "?subject=" +
  encodeURIComponent("Quiero probar el demo de MiNegocio por WhatsApp") +
  "&body=" +
  encodeURIComponent(
    "Hola Reggie,\n\nQuiero probar el demo. Mi número de WhatsApp es +___ — agrégalo a tu sandbox y te escribo.\n\nGracias.",
  );

export function LandingHero(_props: { bookingsCount: number }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-[#f5ebd8] text-[#2a1f15]"
    >
      {/* Warm paper texture suggestion — a very faint radial sand-color
          wash; never gradient text, never AI mesh. Just unevenness so the
          cream doesn't read as a flat fill. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(233,210,170,0.5),transparent_60%),radial-gradient(50%_40%_at_100%_100%,rgba(198,108,74,0.06),transparent_70%)]"
      />

      <div className="mx-auto max-w-[1800px] px-6 pt-6 pb-10 md:px-10 md:pt-8 md:pb-12 lg:pt-10 lg:pb-14">
        <div
          className={cn(
            "grid grid-cols-1 gap-8",
            "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16",
          )}
        >
          {/* ── Left: editorial column ───────────────────────────────── */}
          <div className="flex flex-col items-start">
            <p
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#a8552f]"
              aria-hidden="true"
            >
              MiNegocio · piloto en CDMX
            </p>

            <div className="mt-4 flex items-end gap-4 md:gap-6">
              <img
                src="/mascot.png"
                alt=""
                aria-hidden="true"
                draggable={false}
                className={cn(
                  "shrink-0 select-none drop-shadow-[0_8px_24px_rgba(42,31,21,0.18)]",
                  "h-32 w-auto",
                  "md:h-40",
                  "lg:h-44",
                  "xl:h-52",
                )}
              />
              <h1
                id="hero-title"
                className={cn(
                  "font-spectral",
                  "max-w-[14ch]",
                  "text-[36px] leading-[1.02] font-medium tracking-[-0.015em] text-[#2a1f15]",
                  "md:text-[48px]",
                  "lg:text-[52px]",
                  "xl:text-[58px]",
                )}
              >
                Tu negocio responde{" "}
                <em className="not-italic text-[#a8552f]">aunque tú no estés.</em>
              </h1>
            </div>

            <p
              className={cn(
                "font-spectral",
                "mt-6 max-w-[44ch]",
                "text-[15px] leading-[1.5] text-[#6b594a]",
                "md:text-[16px]",
              )}
            >
              Un asistente que contesta WhatsApp, agenda citas y manda la
              confirmación por correo. Despierto a las once de la noche y a
              las seis de la mañana, listo para atender al primer cliente que
              te escriba.
            </p>

            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <a
                href="#prueba-en-vivo"
                className={cn(
                  "group inline-flex items-center gap-2.5 rounded-full",
                  "bg-[#c66c4a] px-7 py-3.5 text-[15px] font-medium text-[#fff8ed]",
                  "transition-colors duration-150 hover:bg-[#a8552f]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a8552f]/40 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f5ebd8]",
                  "shadow-[0_8px_22px_-8px_rgba(168,85,47,0.55)]",
                )}
              >
                Pruébalo aquí mismo
                <span aria-hidden="true">↓</span>
              </a>
              <a
                href={REQUEST_WHATSAPP_MAILTO}
                className={cn(
                  "font-spectral text-[15px] italic text-[#6b594a]",
                  "underline decoration-[#c66c4a]/30 decoration-2 underline-offset-[6px]",
                  "transition-colors duration-150 hover:text-[#2a1f15] hover:decoration-[#a8552f]",
                )}
              >
                o pídeme un demo por WhatsApp →
              </a>
            </div>

            <SpecSheet />
          </div>

          {/* ── Right: phone frame with live chat inside ─────────────── */}
          <PhoneFrame />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Phone frame  — the chat lives inside a rendered phone so the embedded     */
/*  dark chat surface reads as "what your customer sees" rather than as a     */
/*  rogue dark panel on a cream page.                                         */
/* -------------------------------------------------------------------------- */

function PhoneFrame() {
  return (
    <div
      id="prueba-en-vivo"
      className="relative mx-auto w-full max-w-[420px] lg:max-w-[460px] xl:max-w-[500px] scroll-mt-12"
    >
      {/* Decorative sage leaf above the phone, suggesting a windowsill /
          neighborhood-shop feel without going folk-art-poster. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 80 80"
        className="absolute -top-6 -left-6 h-14 w-14 text-[#7a9474]/70 -rotate-12"
      >
        <path
          d="M40 8 C25 18, 18 35, 22 56 C24 64, 32 70, 40 72 C48 70, 56 64, 58 56 C62 35, 55 18, 40 8 Z"
          fill="currentColor"
          opacity="0.85"
        />
        <path d="M40 12 L40 70" stroke="#5a7456" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* Phone body */}
      <div
        className={cn(
          "relative rounded-[2.5rem] bg-[#1a1612] p-2.5",
          "shadow-[0_30px_60px_-20px_rgba(42,31,21,0.55),0_8px_18px_-10px_rgba(42,31,21,0.35)]",
          "ring-1 ring-black/20",
        )}
      >
        {/* Speaker notch */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-2 z-10 h-1 w-16 -translate-x-1/2 rounded-full bg-[#3a312a]"
        />

        {/* Screen */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0f0f0f]">
          <ChatInterface
            tenantSlug="salon-maria"
            businessName="Salon Maria"
            containerClassName="h-[440px] md:h-[460px] lg:h-[480px]"
          />
        </div>

        {/* Home indicator bar */}
        <div
          aria-hidden="true"
          className="absolute bottom-1.5 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-white/15"
        />
      </div>

    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Spec sheet — operational facts in print-spec style                        */
/* -------------------------------------------------------------------------- */

function SpecSheet() {
  return (
    <p
      className={cn(
        "mt-8 border-t border-[#c4ad84] pt-4",
        "font-mono text-[11px] tracking-[0.04em] text-[#6b594a]",
      )}
    >
      <span className="text-[#a8552f]/80">Demo</span>{" "}
      <span className="text-[#2a1f15]">en vivo a la derecha</span>
      <span className="mx-3 text-[#c4ad84]">|</span>
      <span className="text-[#a8552f]/80">Idioma</span>{" "}
      <span className="text-[#2a1f15]">Español neutro</span>
      <span className="mx-3 text-[#c4ad84]">|</span>
      <span className="text-[#a8552f]/80">Negocio piloto</span>{" "}
      <span className="text-[#2a1f15]">Salon Maria · CDMX</span>
    </p>
  );
}
