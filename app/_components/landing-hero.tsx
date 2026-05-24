"use client";

import { useState } from "react";
import { ChatInterface } from "@/app/chat/[tenantSlug]/_components/chat-interface";
import { cn } from "@/lib/utils";

const WHATSAPP_SANDBOX_NUMBER = "+1 415 523 8886";
const WHATSAPP_DEEP_LINK =
  "https://wa.me/14155238886?text=" +
  encodeURIComponent("hola, quiero hacer una cita");

export function LandingHero({ bookingsCount }: { bookingsCount: number }) {
  // The embedded chat is rendered in a column to the right of the headline on
  // desktop and below it on mobile. We use a key to force-remount the chat if
  // the user clicks "Probar aquí" — that drops them into a fresh session.
  const [chatKey, setChatKey] = useState(0);

  function focusChat() {
    setChatKey((k) => k + 1);
    // After remount, give React a tick before scrolling.
    requestAnimationFrame(() => {
      const el = document.getElementById("embedded-chat");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <section
      aria-labelledby="hero-title"
      className={cn(
        "relative isolate overflow-hidden",
        // Atmospheric backlight: a tight teal pool in the top-left that fades.
        "bg-[radial-gradient(80%_60%_at_-5%_-10%,rgba(72,168,144,0.10),transparent_55%)]",
      )}
    >
      {/* Hairline grid backdrop — Vercel-style ambient texture without the gradient blob */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-[0.18]",
          "[background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]",
          "[background-size:64px_64px]",
          "[mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]",
        )}
      />

      <div className="mx-auto max-w-[1800px] px-6 pt-8 pb-16 md:px-10 md:pt-12 md:pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
          {/* ── Left column ─────────────────────────────────────────── */}
          <div className="flex flex-col">
            <PresenceBadge bookingsCount={bookingsCount} />

            <div className="mt-8 flex items-start gap-5 md:gap-6">
              <img
                src="/mascot.png"
                alt=""
                aria-hidden="true"
                className={cn(
                  // Visible at all widths. Mascot is the brand mark; hiding
                  // it on mobile was wrong. Scales with viewport.
                  "-mt-3 h-32 w-auto shrink-0 select-none",
                  "md:-mt-4 md:h-48",
                  "lg:-mt-6 lg:h-60",
                  "xl:h-64",
                )}
                draggable={false}
              />
              <h1
                id="hero-title"
                className={cn(
                  "max-w-[14ch] text-[40px] leading-[1.04] font-semibold tracking-[-0.035em] text-white",
                  "md:text-[60px] md:leading-[1.00] md:max-w-[16ch]",
                  "lg:text-[68px]",
                  "xl:text-[76px]",
                )}
              >
                <span className="block">Tu asistente.</span>
                <span className="block text-white/80">En WhatsApp.</span>
                <span className="block">Trabajando ahora mismo.</span>
              </h1>
            </div>

            <p className="mt-7 max-w-[44ch] text-[17px] leading-[1.55] text-white/65 md:text-[18px]">
              Atiende a tus clientes, agenda citas y manda confirmaciones por
              correo — todo en piloto automático. Mírala funcionar aquí mismo,
              o mándale un WhatsApp directo.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={WHATSAPP_DEEP_LINK}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "group inline-flex items-center justify-center gap-2 rounded-md",
                  "bg-[#48a890] px-5 py-3 text-[15px] font-medium text-black",
                  "transition-colors duration-150 hover:bg-[#54bda1]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48a890]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
                )}
              >
                Agendar por WhatsApp
                <ArrowRight />
              </a>
              <button
                type="button"
                onClick={focusChat}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-md",
                  "border border-white/12 bg-white/[0.03] px-5 py-3 text-[15px] font-medium text-white/85",
                  "transition-colors duration-150 hover:bg-white/[0.06] hover:text-white",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
                )}
              >
                Probar aquí
              </button>
            </div>

            <DemoMetaLine />
          </div>

          {/* ── Right column: embedded live chat ────────────────────── */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
              <p className="text-[13px] leading-snug text-white/55 md:text-[14px]">
                <span className="font-medium text-white">
                  Escríbele a María.
                </span>{" "}
                Te contesta como una persona, en segundos.
              </p>
              <span
                aria-hidden="true"
                className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 sm:inline"
              >
                ↓ aquí abajo
              </span>
            </div>
            <div
              id="embedded-chat"
              className={cn(
                "relative w-full overflow-hidden rounded-2xl",
                "border border-white/10 bg-[#0f0f0f]",
                // Soft shadow only on the outer edge per DESIGN.md panel-floating.
                // Plus a faint teal lift so the chat reads as the page's active surface.
                "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(72,168,144,0.08),0_0_40px_-12px_rgba(72,168,144,0.18)]",
              )}
            >
            {/* Browser-chrome-y header: window dots + URL-style label */}
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-2.5">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              </div>
              <span className="truncate font-mono text-[11px] tracking-[0.02em] text-white/40">
                minegocio.app/chat/salon-maria
              </span>
            </div>

              <ChatInterface
                key={chatKey}
                tenantSlug="salon-maria"
                businessName="Salon Maria"
                containerClassName="h-[560px] md:h-[600px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PresenceBadge({ bookingsCount }: { bookingsCount: number }) {
  // No "presence dot" here — the chat widget's own header carries the one
  // legitimate live-state indicator (per DESIGN.md). Stacking three of them
  // across the hero reads as generic AI-SaaS chatbot decoration.
  const label =
    bookingsCount > 0
      ? `${bookingsCount.toLocaleString("es-MX")} ${
          bookingsCount === 1 ? "cita agendada" : "citas agendadas"
        } vía WhatsApp`
      : "En piloto";
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full",
        "border border-white/10 bg-white/[0.02] px-3 py-1.5",
        "font-mono text-[11px] tracking-[0.04em] uppercase text-white/55",
      )}
    >
      <span aria-hidden="true" className="text-white/30">
        ◇
      </span>
      {label}
    </div>
  );
}

function DemoMetaLine() {
  return (
    <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-3 font-mono text-[11px] tracking-[0.02em] text-white/40 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <dt className="uppercase tracking-[0.12em] text-white/30">
          Número de prueba
        </dt>
        <dd className="text-white/65">{WHATSAPP_SANDBOX_NUMBER}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className="uppercase tracking-[0.12em] text-white/30">
          Quien responde
        </dt>
        <dd className="text-white/65">El agente que ves aquí mismo</dd>
      </div>
    </dl>
  );
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path
        d="M3 8h10m0 0L9 4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
