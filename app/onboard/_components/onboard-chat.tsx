"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Suggestions,
  Suggestion,
} from "@/components/ai-elements/suggestion";
import {
  Attachments,
  Attachment,
  AttachmentInfo,
} from "@/components/ai-elements/attachments";
import { useEffect, useMemo, useState } from "react";

function OnboardPanel({ sessionId }: { sessionId: string }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/onboard",
        headers: { "X-Session-Id": sessionId },
      }),
    [sessionId]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isDisabled = status === "streaming" || status === "submitted";
  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-dvh bg-black">
      {/* Header */}
      <header className="border-b border-white/10 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="MiNegocio" className="h-14" />
          <span className="text-xs text-white/40">|</span>
          <p className="text-sm text-white/50">Registro de Negocio</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono">
            {status === "streaming" ? "Escribiendo..." : "En línea"}
          </span>
          <span className={`w-2 h-2 rounded-full ${status === "streaming" ? "bg-yellow-400 animate-pulse" : "bg-emerald-400"}`} />
        </div>
      </header>

      {/* Chat area */}
      <Conversation className="flex-1">
        <ConversationContent>
          {!hasMessages && (
            <div className="flex items-center justify-center h-full px-6">
              <div className="max-w-md text-center space-y-6">
                <img src="/logo.png" alt="MiNegocio" className="h-24 mx-auto" />
                <div className="space-y-2">
                  <p className="text-white/90 font-medium text-lg">Configura tu asistente de IA</p>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Te voy a guiar paso a paso para registrar tu negocio en unos minutos.
                    También puedes subir documentos, fotos, inventarios, y SOPs.
                  </p>
                </div>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part, i) => (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ))}
                {message.parts.filter((part) => part.type === "file").length > 0 && (
                  <Attachments variant="inline">
                    {message.parts
                      .filter((part) => part.type === "file")
                      .map((part, i) => (
                        <Attachment key={`file-${i}`} data={{ ...part, id: `file-${i}` }}>
                          <AttachmentInfo />
                        </Attachment>
                      ))}
                  </Attachments>
                )}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Suggestions for empty state */}
      {!hasMessages && (
        <div className="px-4 pb-2">
          <Suggestions>
            <Suggestion
              suggestion="Hola, quiero registrar mi negocio"
              onClick={(s) => sendMessage({ text: s })}
            />
            <Suggestion
              suggestion="Tengo un salón de belleza"
              onClick={(s) => sendMessage({ text: s })}
            />
            <Suggestion
              suggestion="Tengo un restaurante"
              onClick={(s) => sendMessage({ text: s })}
            />
          </Suggestions>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-white/10 p-4 shrink-0">
        <PromptInput
          accept="image/*,.pdf,.csv,.txt,.xlsx,.xls,.doc,.docx"
          multiple
          onSubmit={(message) => {
            if (message.files.length > 0) {
              const fileList = message.files.map(f => {
                const byteString = atob(f.url.split(",")[1] || "");
                const mimeString = f.url.split(",")[0]?.split(":")[1]?.split(";")[0] || f.mediaType;
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                return new File([blob], f.filename || "document", { type: mimeString });
              });
              const dt = new DataTransfer();
              fileList.forEach(f => dt.items.add(f));
              sendMessage({
                text: message.text || "Aquí está mi documento. Por favor revísalo y extrae la información relevante para mi negocio.",
                files: dt.files,
              });
            } else {
              sendMessage({ text: message.text });
            }
          }}
        >
          <PromptInputTextarea
            placeholder="Escribe tu mensaje..."
            disabled={isDisabled}
          />
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger tooltip="Adjuntar" />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments label="Subir documento" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputSubmit disabled={isDisabled} />
          </PromptInputTools>
        </PromptInput>
      </div>
    </div>
  );
}

export function OnboardChat() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("minegocio-onboard-session");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("minegocio-onboard-session", id);
    }
    setSessionId(id);
  }, []);

  if (!sessionId) return null;

  return <OnboardPanel sessionId={sessionId} />;
}
