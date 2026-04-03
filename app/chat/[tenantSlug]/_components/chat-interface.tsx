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
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ChatPanel({
  tenantSlug,
  businessName,
  sessionId,
}: {
  tenantSlug: string;
  businessName: string;
  sessionId: string;
}) {
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/chat/${tenantSlug}`,
        headers: { "X-Session-Id": sessionId },
      }),
    [tenantSlug, sessionId]
  );

  const { messages, sendMessage, status } = useChat({ transport });

  const isDisabled = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center">
        <h1 className="text-lg font-semibold">{businessName}</h1>
      </header>

      {/* Messages */}
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent>
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part, i) => (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ))}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage({ text: input });
              setInput("");
            }
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isDisabled}
          />
          <Button type="submit" disabled={!input.trim() || isDisabled}>
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}

export function ChatInterface({
  tenantSlug,
  businessName,
}: {
  tenantSlug: string;
  businessName: string;
}) {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem(`minegocio-session-${tenantSlug}`);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(`minegocio-session-${tenantSlug}`, id);
    }
    setSessionId(id);
  }, [tenantSlug]);

  if (!sessionId) return null;

  return (
    <ChatPanel
      tenantSlug={tenantSlug}
      businessName={businessName}
      sessionId={sessionId}
    />
  );
}
