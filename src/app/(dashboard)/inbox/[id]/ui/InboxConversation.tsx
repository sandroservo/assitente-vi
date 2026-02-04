/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Lista de mensagens da conversa com polling para atualizar
 * quando a VI (bot) responde via webhook.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const POLLING_INTERVAL = 2000;

interface Message {
  id: string;
  body: string | null;
  direction: "in" | "out";
  createdAt: Date | string;
}

interface InboxConversationProps {
  conversationId: string;
  initialMessages: Array<{
    id: string;
    body: string | null;
    direction: string;
    createdAt: Date;
  }>;
}

export default function InboxConversation({
  conversationId,
  initialMessages,
}: InboxConversationProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({
      id: m.id,
      body: m.body ?? "",
      direction: m.direction as "in" | "out",
      createdAt: m.createdAt,
    }))
  );
  const lastMessageTime = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const last = messages[messages.length - 1];
      lastMessageTime.current =
        typeof last.createdAt === "string"
          ? last.createdAt
          : new Date(last.createdAt).toISOString();
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchNewMessages = useCallback(async () => {
    try {
      const url = lastMessageTime.current
        ? `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastMessageTime.current)}`
        : `/api/conversations/${conversationId}/messages`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.messages?.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter(
            (m: Message) => !existingIds.has(m.id)
          );
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    const interval = setInterval(fetchNewMessages, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNewMessages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma mensagem ainda
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.direction === "out" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                m.direction === "out"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{m.body ?? ""}</p>
              <p
                className={`text-[10px] mt-1 ${
                  m.direction === "out"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {new Date(m.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
