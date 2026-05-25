"use client";

import {
  AssistantRuntimeProvider,
  useThreadRuntime,
} from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { MiNegocioThread } from "@/components/assistant-ui/thread";
import { cn } from "@/lib/utils";

// TODO(follow-up): file attachments. The previous hand-rolled onboard chat
// supported uploading menus / price sheets / SOPs via PromptInput. Re-add via
// assistant-ui's ComposerPrimitive.AddAttachment + an attachment adapter once
// the migration is stable.

export function OnboardChat() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/onboard",
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MiNegocioThread
        className="h-dvh"
        header={<OnboardHeader />}
        emptyState={<OnboardEmptyState />}
        composerPlaceholder="Escribe tu respuesta…"
      />
    </AssistantRuntimeProvider>
  );
}

function OnboardHeader() {
  return (
    <header
      className={cn(
        "relative flex shrink-0 items-center justify-between border-b border-white/10",
        "bg-[radial-gradient(120%_140%_at_0%_0%,rgba(72,168,144,0.06),transparent_60%)]",
        "px-5 py-3.5",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex h-10 w-10 items-end justify-center overflow-hidden rounded-xl",
              "bg-white/[0.06] ring-1 ring-inset ring-white/10",
            )}
          >
            <img
              src="/mascot.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none -mb-0.5 h-[48px] w-auto select-none"
            />
          </div>
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#48a890] ring-2 ring-black"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-[#48a890] opacity-60" />
          </span>
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
            MiNegocio
          </div>
          <div className="truncate text-[11px] tracking-[0.01em] text-white/45">
            Registro de negocio
          </div>
        </div>
      </div>
    </header>
  );
}

const SUGGESTIONS = [
  "Tengo un salón de belleza",
  "Tengo un restaurante",
  "Tengo un consultorio dental",
  "Tengo otro tipo de negocio",
];

function OnboardEmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md space-y-7 text-center">
        <div className="mx-auto h-28 w-28 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/10">
          <img
            src="/mascot.png"
            alt=""
            aria-hidden="true"
            className="-mb-2 h-[128px] w-auto"
          />
        </div>
        <div className="space-y-2.5">
          <p className="text-[20px] font-semibold leading-tight tracking-[-0.015em] text-white">
            Configuremos tu asistente.
          </p>
          <p className="text-[14px] leading-[1.55] text-white/65">
            Te haré algunas preguntas sobre tu negocio — servicios, horarios,
            personal. Toma unos 5 minutos. Una pregunta a la vez para que sea
            fácil.
          </p>
        </div>
        <SuggestionChips />
        <p className="pt-2 text-[11px] leading-tight text-white/35">
          Cuéntame qué tipo de negocio tienes para empezar, o escribe en tus
          propias palabras abajo.
        </p>
      </div>
    </div>
  );
}

function SuggestionChips() {
  const thread = useThreadRuntime();
  return (
    <div className="flex flex-wrap justify-center gap-2 pt-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() =>
            thread.append({
              role: "user",
              content: [{ type: "text", text: s }],
            })
          }
          className={cn(
            "rounded-full border border-white/10 bg-white/[0.04]",
            "px-3 py-1.5 text-[12px] text-white/70",
            "transition-colors hover:border-[#48a890]/50 hover:bg-[#48a890]/10 hover:text-white",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
