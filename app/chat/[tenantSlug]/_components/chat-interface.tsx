"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { MiNegocioThread } from "@/components/assistant-ui/thread";
import { cn } from "@/lib/utils";

export function ChatInterface({
  tenantSlug,
  businessName,
  containerClassName,
}: {
  tenantSlug: string;
  businessName: string;
  /**
   * Tailwind classes for the chat container. Defaults to `h-dvh` (full
   * viewport, the standalone /chat/[slug] use case). Pass a fixed height
   * like `h-[540px]` when embedding inside a larger layout (landing page).
   */
  containerClassName?: string;
}) {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: `/api/chat/${tenantSlug}`,
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MiNegocioThread
        className={cn(containerClassName ?? "h-dvh")}
        header={<TenantHeader businessName={businessName} />}
        emptyState={<TenantEmptyState businessName={businessName} />}
        composerPlaceholder={`Escribe tu mensaje para ${businessName}…`}
      />
    </AssistantRuntimeProvider>
  );
}

function TenantHeader({ businessName }: { businessName: string }) {
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
            {businessName}
          </div>
          <div className="truncate text-[11px] tracking-[0.01em] text-white/45">
            Asistente · En línea
          </div>
        </div>
      </div>
    </header>
  );
}

function TenantEmptyState({ businessName }: { businessName: string }) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-sm space-y-4 text-center">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/10">
          <img
            src="/mascot.png"
            alt=""
            aria-hidden="true"
            className="-mb-1 h-[96px] w-auto"
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-medium text-white/90">
            Hola, soy el asistente de {businessName}.
          </p>
          <p className="text-sm leading-relaxed text-white/45">
            Puedo ayudarte a reservar una cita, ver horarios disponibles o
            responder tus preguntas. ¿Cómo te llamas?
          </p>
        </div>
      </div>
    </div>
  );
}
