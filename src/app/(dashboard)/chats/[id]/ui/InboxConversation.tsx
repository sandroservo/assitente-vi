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
  mediaUrl?: string | null;
  transcription?: string | null;
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
    mediaUrl?: string | null;
    transcription?: string | null;
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
      mediaUrl: m.mediaUrl ?? null,
      transcription: m.transcription ?? null,
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
          const isHuman = m.sentByUserName != null;

          return (
            <div key={m.id}>
              {/* Date separator */}
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-lg text-xs text-gray-600 shadow-sm font-medium">
                    {formatDateSeparator(m.createdAt)}
                  </span>
                </div>
              )}

              {/* Message bubble with avatar */}
              <div
                className={cn(
                  "flex mb-3",
                  isOut ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[75%] md:max-w-[65%] flex gap-2",
                    isOut ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  {isOut ? (
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ring-2 ring-white shadow-sm",
                      isHuman
                        ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                        : "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                    )}>
                      {isHuman
                        ? m.sentByUserName!.split(" ")[0][0].toUpperCase()
                        : "Vi"}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold bg-gradient-to-br from-gray-400 to-gray-500 text-white ring-2 ring-white shadow-sm">
                      ?
                    </div>
                  )}

                  <div className="flex flex-col">
                    {/* Bubble */}
                    <div
                      className={cn(
                        "relative px-4 py-2.5 shadow-sm",
                        isOut
                          ? isHuman
                            ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl rounded-tr-md"
                            : "bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl rounded-tr-md"
                          : "bg-white text-gray-800 rounded-2xl rounded-tl-md"
                      )}
                    >
                      {/* Imagem inline */}
                      {m.type === "image" && m.mediaUrl && (
                        <div className="mb-2 -mx-2 -mt-1">
                          <img
                            src={m.mediaUrl}
                            alt="Imagem"
                            className="rounded-xl max-w-full max-h-72 object-cover cursor-pointer"
                            loading="lazy"
                            onClick={() => window.open(m.mediaUrl!, "_blank")}
                          />
                        </div>
                      )}

                      {/* Player de áudio */}
                      {m.type === "audio" && m.mediaUrl && (
                        <div className="mb-2 min-w-[220px]">
                          <audio
                            controls
                            preload="metadata"
                            className="w-full h-9 rounded-lg"
                            style={{ filter: isOut ? "invert(1) brightness(2)" : "none" }}
                          >
                            <source src={m.mediaUrl} />
                          </audio>
                        </div>
                      )}

                      {/* Transcrição abaixo de áudio/imagem */}
                      {isMediaType && m.transcription && (
                        <div className={cn(
                          "text-[11px] leading-snug italic mb-1 px-1 py-1 rounded-lg",
                          isOut ? "text-white/70 bg-white/10" : "text-gray-500 bg-gray-50"
                        )}>
                          <span className="font-semibold not-italic">
                            {m.type === "audio" ? "Transcrição: " : "IA: "}
                          </span>
                          {m.transcription}
                        </div>
                      )}

                      {/* Indicador de tipo para mídia sem URL (mensagens antigas) */}
                      {isMediaType && !m.mediaUrl && (
                        <span className={cn(
                          "inline-flex items-center text-xs font-medium mb-0.5",
                          isOut ? "text-white/80" :
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

                      {/* Texto da mensagem (oculta body genérico para mídia com URL) */}
                      {(!isMediaType || !m.mediaUrl) && m.body && (
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                          {m.body}
                        </p>
                      )}

                      {/* Caption de imagem enviada */}
                      {m.type === "image" && m.mediaUrl && m.body && !m.body.startsWith("[") && (
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words mt-1">
                          {m.body}
                        </p>
                      )}
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        isOut ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-[10px]",
                          isOut ? "text-white/70" : "text-gray-400"
                        )}>
                          {formatTime(m.createdAt)}
                        </span>
                        {isOut && (
                          <span className="text-white/70 text-[10px]">✓✓</span>
                        )}
                      </div>
                    </div>
                    {/* Sender label below bubble */}
                    <p className={cn(
                      "text-[10px] text-gray-500 mt-1 px-1",
                      isOut ? "text-right" : "text-left"
                    )}>
                      {isOut
                        ? m.sentByUserName || "Vi"
                        : "Lead"}
                    </p>
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
