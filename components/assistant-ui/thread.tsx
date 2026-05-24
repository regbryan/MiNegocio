"use client";

/**
 * MiNegocioThread — the canonical chat surface for every flow that uses
 * @assistant-ui/react against our /api/chat or /api/onboard streaming routes.
 *
 * Styled against DESIGN.md tokens directly. Three surfaces consume this:
 *   - /widget (380×600 floating panel)
 *   - /chat/[tenantSlug] (full-page)
 *   - /onboard (full-page)
 *
 * Each surface supplies its own header + empty state via slots.
 */

import { type ReactNode } from "react";
import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ThreadProps = {
  /** Per-surface header (e.g. mascot avatar + wordmark + close button). */
  header?: ReactNode;
  /** Rendered when the thread has no messages. */
  emptyState: ReactNode;
  /** Placeholder text shown inside the composer input. Spanish. */
  composerPlaceholder?: string;
  /** Extra className for the outer flex container. */
  className?: string;
};

export function MiNegocioThread({
  header,
  emptyState,
  composerPlaceholder = "Escribe tu mensaje…",
  className,
}: ThreadProps) {
  return (
    <ThreadPrimitive.Root
      className={cn("flex h-full min-h-0 flex-col bg-black", className)}
    >
      {header}

      <ThreadPrimitive.Viewport
        autoScroll
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4"
      >
        <ThreadPrimitive.Empty>{emptyState}</ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            AssistantMessage,
            SystemMessage: () => null,
          }}
        />
      </ThreadPrimitive.Viewport>

      <Composer placeholder={composerPlaceholder} />
    </ThreadPrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function UserMessage() {
  return (
    <MessagePrimitive.Root className="mb-3 flex justify-end">
      <div
        className={cn(
          "max-w-[80%] rounded-xl rounded-tr-sm",
          "bg-[#48a890] text-white",
          "px-3.5 py-2 text-[14px] leading-[1.55]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.4)]",
        )}
      >
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => (
              <span className="whitespace-pre-wrap">{text}</span>
            ),
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

// Wrapper: MarkdownTextPrimitive reads the text from context, but the
// MessagePrimitive.Parts components contract passes the text-part props in.
// Adapt the shape so TS is happy.
function MarkdownAssistantText() {
  return <MarkdownTextPrimitive smooth />;
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="mb-4 flex">
      <div
        className={cn(
          "max-w-[88%] rounded-xl rounded-tl-sm",
          "bg-[#171717] text-white/90",
          "border border-white/[0.06]",
          "px-3.5 py-2.5 text-[14px] leading-[1.55]",
          "prose prose-invert prose-sm max-w-none",
          "[&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
          "[&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0",
          "[&_a]:text-[#60a890] [&_a]:underline [&_a]:underline-offset-2",
          "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12.5px]",
        )}
      >
        <MessagePrimitive.Parts
          components={{
            Text: MarkdownAssistantText,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function Composer({ placeholder }: { placeholder: string }) {
  return (
    <div className="border-t border-white/10 bg-black p-3 shrink-0">
      <ComposerPrimitive.Root
        className={cn(
          "flex items-end gap-2 rounded-xl",
          "bg-[#0f0f0f] border border-white/10",
          "px-3 py-2 transition-colors",
          "focus-within:border-[#48a890]/50 focus-within:bg-[#0f0f0f]",
        )}
      >
        <ComposerPrimitive.Input
          rows={1}
          autoFocus
          placeholder={placeholder}
          className={cn(
            "flex-1 resize-none bg-transparent outline-none",
            "text-[14px] leading-[1.55] text-white placeholder:text-white/40",
            "max-h-32 min-h-[20px] py-1",
          )}
        />
        <ComposerPrimitive.Send asChild>
          <button
            type="submit"
            aria-label="Enviar mensaje"
            className={cn(
              "shrink-0 h-7 w-7 rounded-md",
              "bg-[#48a890] text-white",
              "hover:bg-[#48a878] disabled:bg-white/10 disabled:text-white/30",
              "flex items-center justify-center transition-colors",
              "disabled:cursor-not-allowed",
            )}
          >
            <ArrowUpIcon aria-hidden="true" className="h-4 w-4" />
          </button>
        </ComposerPrimitive.Send>
      </ComposerPrimitive.Root>
    </div>
  );
}
