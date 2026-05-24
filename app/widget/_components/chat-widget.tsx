"use client";

import { useState } from "react";
import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { MessageSquareIcon, XIcon } from "lucide-react";
import { MiNegocioThread } from "@/components/assistant-ui/thread";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat"
          className={cn(
            "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center",
            "rounded-full bg-[#48a890] text-white",
            "shadow-lg shadow-black/30 transition-transform hover:scale-105",
          )}
        >
          <MessageSquareIcon aria-hidden="true" className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div
          data-testid="widget-panel"
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col",
            "h-[600px] max-h-[80dvh] w-[380px]",
            "overflow-hidden rounded-2xl border border-white/10 bg-black",
            "shadow-2xl shadow-black/50",
          )}
        >
          <WidgetPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

function WidgetPanel({ onClose }: { onClose: () => void }) {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/onboard",
    }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MiNegocioThread
        header={<WidgetHeader onClose={onClose} />}
        emptyState={<WidgetEmptyState />}
        composerPlaceholder='Escribe "Hola" para comenzar…'
      />
    </AssistantRuntimeProvider>
  );
}

function WidgetHeader({ onClose }: { onClose: () => void }) {
  return (
    <header
      className={cn(
        "relative flex shrink-0 items-center justify-between border-b border-white/10",
        "bg-[radial-gradient(120%_140%_at_0%_0%,rgba(72,168,144,0.08),transparent_55%)]",
        "px-3.5 py-3",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <div
            className={cn(
              "flex h-9 w-9 items-end justify-center overflow-hidden rounded-xl",
              "bg-white/[0.06] ring-1 ring-inset ring-white/10",
            )}
          >
            <img
              src="/mascot.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none -mb-0.5 h-[42px] w-auto select-none"
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
          <div className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-white">
            MiNegocio
          </div>
          <div className="truncate text-[11px] tracking-[0.01em] text-white/45">
            Asistente · En línea
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar chat"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          "text-white/40 transition-all hover:bg-white/10 hover:text-white",
        )}
      >
        <XIcon aria-hidden="true" className="h-4 w-4" />
      </button>
    </header>
  );
}

function WidgetEmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-5">
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-white/80">
          Configura tu asistente de IA
        </p>
        <p className="text-xs leading-relaxed text-white/35">
          Escribe &quot;Hola&quot; para comenzar.
        </p>
      </div>
    </div>
  );
}
