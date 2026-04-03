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
    <div className="flex flex-col h-dvh bg-background">
      <header className="border-b px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold">MiNegocio - Registro de Negocio</h1>
      </header>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-center px-6">
              <div className="space-y-2">
                <p>Escribe &quot;Hola&quot; para comenzar a registrar tu negocio.</p>
                <p className="text-sm">También puedes subir documentos (menú, lista de precios, inventario) y el AI los leerá por ti.</p>
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
                    <span key={`file-${i}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded px-2 py-1">
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

      <div className="border-t p-4">
        {files && files.length > 0 && (
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
            <span>{Array.from(files).map(f => f.name).join(", ")}</span>
            <button
              type="button"
              onClick={() => {
                setFiles(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.csv,.txt"
            className="hidden"
            onChange={(e) => setFiles(e.target.files)}
            multiple
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isDisabled}
            onClick={() => fileInputRef.current?.click()}
            title="Subir documento"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isDisabled}
          />
          <Button type="submit" disabled={(!input.trim() && !files?.length) || isDisabled}>
            Enviar
          </Button>
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
