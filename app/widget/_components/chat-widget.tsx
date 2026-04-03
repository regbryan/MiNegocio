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
import { useEffect, useMemo, useRef, useState } from "react";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("minegocio-widget-session");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("minegocio-widget-session", id);
    }
    setSessionId(id);
  }, []);

  if (!sessionId) return null;

  return (
    <>
      {/* Chat bubble button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white text-black shadow-lg shadow-black/30 flex items-center justify-center hover:scale-105 transition-transform z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80dvh] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 z-50 flex flex-col bg-black">
          <WidgetPanel sessionId={sessionId} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

function WidgetPanel({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !files?.length) return;

    if (files?.length) {
      sendMessage({
        text: input || "Aquí está mi documento. Por favor revísalo y extrae la información relevante para mi negocio.",
        files,
      });
    } else {
      sendMessage({ text: input });
    }

    setInput("");
    setFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs">M</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">MiNegocio</h2>
            <p className="text-[10px] text-white/40 leading-tight">Registro de Negocio</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </header>

      {/* Messages */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full px-5">
              <div className="text-center space-y-3">
                <p className="text-white/80 text-sm font-medium">Configura tu asistente de IA</p>
                <p className="text-white/35 text-xs leading-relaxed">
                  Escribe &quot;Hola&quot; para comenzar.
                </p>
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
                {message.parts
                  .filter((part) => part.type === "file")
                  .map((part, i) => (
                    <span key={`file-${i}`} className="inline-flex items-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 rounded-md px-2 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                      {"filename" in part && part.filename ? part.filename : "Documento"}
                    </span>
                  ))}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input */}
      <div className="border-t border-white/10 p-3 shrink-0">
        {files && files.length > 0 && (
          <div className="flex items-center gap-2 mb-2 text-xs text-white/50 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5">
            <span className="truncate">{Array.from(files).map(f => f.name).join(", ")}</span>
            <button
              type="button"
              onClick={() => {
                setFiles(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-auto text-white/30 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.csv,.txt,.xlsx,.xls,.doc,.docx"
            className="hidden"
            onChange={(e) => setFiles(e.target.files)}
            multiple
          />
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-9 h-9 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isDisabled}
            className="flex-1 h-9 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-30"
          />
          <button
            type="submit"
            disabled={(!input.trim() && !files?.length) || isDisabled}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-white text-black hover:bg-white/90 transition-all disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </button>
        </form>
      </div>
    </>
  );
}
