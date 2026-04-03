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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function OnboardPanel({ sessionId }: { sessionId: string }) {
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
    <div className="flex flex-col h-dvh bg-black">
      {/* Header */}
      <header className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MiNegocio" className="w-8 h-8" />
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">MiNegocio</h1>
            <p className="text-xs text-white/50">Registro de Negocio</p>
          </div>
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
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full px-6">
              <div className="max-w-sm text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="space-y-2">
                  <p className="text-white/90 font-medium">Configura tu asistente de IA</p>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Escribe &quot;Hola&quot; para comenzar. Te guiaré paso a paso para registrar tu negocio en unos minutos.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  <span>Puedes subir documentos, fotos, inventarios, SOPs</span>
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
                {message.parts
                  .filter((part) => part.type === "file")
                  .map((part, i) => (
                    <span key={`file-${i}`} className="inline-flex items-center gap-1.5 text-xs text-white/60 bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                      {"filename" in part && part.filename ? part.filename : "Documento"}
                    </span>
                  ))}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input area */}
      <div className="border-t border-white/10 p-4 bg-black">
        {files && files.length > 0 && (
          <div className="flex items-center gap-2 mb-3 text-sm text-white/60 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            <span className="truncate">{Array.from(files).map(f => f.name).join(", ")}</span>
            <button
              type="button"
              onClick={() => {
                setFiles(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-auto text-white/40 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
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
            title="Subir documento"
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isDisabled}
            className="flex-1 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
          />
          <button
            type="submit"
            disabled={(!input.trim() && !files?.length) || isDisabled}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white text-black hover:bg-white/90 transition-all disabled:opacity-30 disabled:hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </button>
        </form>
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
