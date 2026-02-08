/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Lista de mensagens da conversa estilo WhatsApp com polling
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Image as ImageIcon, FileText, Video, Bot, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const POLLING_INTERVAL = 2000;

interface Message {
  id: string;
  body: string | null;
  type: string;
  direction: "in" | "out";
  createdAt: Date | string;
  sentByUserName?: string | null;
}

interface InboxConversationProps {
  conversationId: string;
  initialMessages: Array<{
    id: string;
    body: string | null;
    type?: string;
    direction: string;
    createdAt: Date;
    sentByUserName?: string | null;
  }>;
}

function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function shouldShowDateSeparator(
  current: Message,
  previous: Message | null
): boolean {
  if (!previous) return true;
  const currDate = new Date(current.createdAt).toDateString();
  const prevDate = new Date(previous.createdAt).toDateString();
  return currDate !== prevDate;
}

function MessageTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "audio":
      return <Mic className="h-3.5 w-3.5 inline mr-1" />;
    case "image":
      return <ImageIcon className="h-3.5 w-3.5 inline mr-1" />;
    case "video":
      return <Video className="h-3.5 w-3.5 inline mr-1" />;
    case "document":
      return <FileText className="h-3.5 w-3.5 inline mr-1" />;
    default:
      return null;
  }
}

export default function InboxConversation({
  conversationId,
  initialMessages,
}: InboxConversationProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({
      id: m.id,
      body: m.body ?? "",
      type: m.type ?? "text",
      direction: m.direction as "in" | "out",
      createdAt: m.createdAt,
      sentByUserName: m.sentByUserName ?? null,
    }))
  );
  const lastMessageTime = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Expõe fetchNewMessages para o composer chamar após enviar
  useEffect(() => {
    (window as any).__inboxRefetch = fetchNewMessages;
    return () => {
      delete (window as any).__inboxRefetch;
    };
  }, [fetchNewMessages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-3"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundColor: "#f0f2f5",
      }}
    >
      <div className="max-w-3xl mx-auto space-y-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-gray-400 bg-white/80 px-4 py-2 rounded-lg shadow-sm">
              Nenhuma mensagem ainda
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const prev = i > 0 ? messages[i - 1] : null;
          const showDate = shouldShowDateSeparator(m, prev);
          const isOut = m.direction === "out";
          const isMediaType = m.type !== "text";

          return (
            <div key={m.id}>
              {/* Date separator */}
              {showDate && (
                <div className="flex items-center justify-center my-3">
                  <span className="text-[11px] bg-white/90 text-gray-500 px-3 py-1 rounded-lg shadow-sm font-medium">
                    {formatDateSeparator(m.createdAt)}
                  </span>
                </div>
              )}

              {/* Message bubble */}
              <div
                className={cn(
                  "flex mb-0.5",
                  isOut ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative max-w-[75%] px-3 py-1.5 rounded-lg shadow-sm",
                    isOut
                      ? "bg-[#d9fdd3] text-gray-800 rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none"
                  )}
                >
                  {/* Sender label for outgoing */}
                  {isOut && m.sentByUserName && (
                    <p className="text-[10px] font-semibold text-emerald-700 mb-0.5 flex items-center gap-1">
                      <UserCheck className="h-2.5 w-2.5" />
                      {m.sentByUserName}
                    </p>
                  )}
                  {isOut && !m.sentByUserName && (
                    <p className="text-[10px] font-semibold text-blue-600 mb-0.5 flex items-center gap-1">
                      <Bot className="h-2.5 w-2.5" />
                      Vi
                    </p>
                  )}

                  {/* Message body */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
                      {isMediaType && (
                        <span className={cn(
                          "inline-flex items-center text-xs font-medium mb-0.5",
                          m.type === "audio" ? "text-purple-600" :
                          m.type === "image" ? "text-blue-600" :
                          m.type === "video" ? "text-red-600" :
                          "text-gray-600"
                        )}>
                          <MessageTypeIcon type={m.type} />
                          {m.type === "audio" ? "Áudio" :
                           m.type === "image" ? "Imagem" :
                           m.type === "video" ? "Vídeo" :
                           "Documento"}
                        </span>
                      )}
                      <p className="text-[13.5px] leading-[1.35] whitespace-pre-wrap break-words">
                        {m.body ?? ""}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] whitespace-nowrap self-end pb-0.5 flex-shrink-0",
                      isOut ? "text-gray-500" : "text-gray-400"
                    )}>
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
