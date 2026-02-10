/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Sidebar de conversas estilo WhatsApp Web — busca, avatars, preview, unread, score
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bot, UserCheck, MessageSquare, Mic, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  leadId: string;
  name: string | null;
  pushName: string | null;
  avatarUrl: string | null;
  phone: string;
  status: string;
  ownerType: string;
  leadScore: number;
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessageBody: string | null;
  lastMessageType: string;
  lastMessageDirection: string;
}

interface ConversationSidebarProps {
  initialConversations: Conversation[];
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return phone.slice(-2);
}

function getScoreColor(score: number): string {
  if (score >= 800) return "bg-red-500";
  if (score >= 600) return "bg-orange-500";
  if (score >= 400) return "bg-yellow-500";
  if (score >= 200) return "bg-blue-400";
  return "bg-gray-400";
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) {
    return date.toLocaleDateString("pt-BR", { weekday: "short" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getMessagePreview(conv: Conversation): string {
  if (!conv.lastMessageBody) return "Sem mensagens";

  const prefix = conv.lastMessageDirection === "out" ? "Você: " : "";

  if (conv.lastMessageType === "audio") return `${prefix}🎤 Áudio`;
  if (conv.lastMessageType === "image") return `${prefix}📷 Imagem`;
  if (conv.lastMessageType === "video") return `${prefix}🎬 Vídeo`;
  if (conv.lastMessageType === "document") return `${prefix}📄 Documento`;

  const body = conv.lastMessageBody;
  if (body.startsWith("[Áudio")) return `${prefix}🎤 Áudio`;
  if (body.startsWith("[Imagem")) return `${prefix}📷 Imagem`;
  if (body.startsWith("[Vídeo")) return `${prefix}🎬 Vídeo`;
  if (body.startsWith("[Documento")) return `${prefix}📄 Documento`;

  return `${prefix}${body.length > 50 ? body.slice(0, 50) + "…" : body}`;
}

export default function ConversationSidebar({
  initialConversations,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Extrai o ID da conversa ativa do pathname
  const activeId = pathname.startsWith("/chats/")
    ? pathname.split("/chats/")[1]?.split("/")[0] ?? null
    : null;

  // Polling para atualizar lista de conversas
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Filtra conversas pela busca
  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(q)) ||
      (c.pushName?.toLowerCase().includes(q)) ||
      c.phone.includes(q)
    );
  });

  // Ordena: não-lidas primeiro, depois por data
  const sorted = [...filtered].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
    return (
      new Date(b.lastMessageAt ?? 0).getTime() -
      new Date(a.lastMessageAt ?? 0).getTime()
    );
  });

  return (
    <div className="w-[340px] min-w-[340px] border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50/80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Conversas</h2>
          <span className="text-xs text-gray-500">
            {conversations.length} conversa{conversations.length !== 1 ? "s" : ""}
          </span>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
            aria-label="Buscar conversa por nome ou telefone"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 text-center">
              {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </p>
          </div>
        )}

        {sorted.map((conv) => {
          const isActive = conv.id === activeId;
          const displayName = conv.name || conv.pushName || conv.phone;

          return (
            <button
              key={conv.id}
              onClick={() => router.push(`/chats/${conv.id}`)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 hover:bg-gray-50",
                isActive && "bg-purple-50/80 hover:bg-purple-50/80 border-l-2 border-l-purple-500"
              )}
              aria-label={`Conversa com ${displayName}`}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {conv.avatarUrl ? (
                  <img
                    src={conv.avatarUrl}
                    alt={displayName}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials(conv.name || conv.pushName, conv.phone)}
                  </div>
                )}
                {/* Owner indicator */}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white",
                    conv.ownerType === "human" ? "bg-green-500" : "bg-blue-500"
                  )}
                  title={conv.ownerType === "human" ? "Atendimento humano" : "Vi (Bot)"}
                >
                  {conv.ownerType === "human" ? (
                    <UserCheck className="h-2.5 w-2.5 text-white" />
                  ) : (
                    <Bot className="h-2.5 w-2.5 text-white" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm truncate",
                    conv.unreadCount > 0 ? "font-bold text-gray-900" : "font-medium text-gray-800"
                  )}>
                    {displayName}
                  </span>
                  <span className={cn(
                    "text-[11px] flex-shrink-0 ml-2",
                    conv.unreadCount > 0 ? "text-purple-600 font-semibold" : "text-gray-400"
                  )}>
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <p className={cn(
                    "text-xs truncate pr-2",
                    conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-500"
                  )}>
                    {getMessagePreview(conv)}
                  </p>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Lead Score mini badge */}
                    {conv.leadScore > 0 && (
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white",
                          getScoreColor(conv.leadScore)
                        )}
                        title={`Lead Score: ${conv.leadScore}`}
                      >
                        {conv.leadScore}
                      </span>
                    )}

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <span className="bg-purple-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
