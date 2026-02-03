/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface ChatItem {
  id: string;
  name: string | null;
  pushName: string | null;
  phone: string;
  status: string;
  ownerType: "bot" | "human";
  unreadCount: number;
  lastMessageAt: Date | null;
  isPinned?: boolean;
}

interface ChatListProps {
  chats: ChatItem[];
}

function getStatusBadge(status: string, ownerType: string) {
  if (ownerType === "human") {
    return { label: "Humano", className: "bg-indigo-100 text-indigo-700" };
  }

  const statusMap: Record<string, { label: string; className: string }> = {
    NOVO: { label: "Lead", className: "bg-blue-100 text-blue-700" },
    EM_ATENDIMENTO: { label: "Em atendimento", className: "bg-yellow-100 text-yellow-700" },
    QUALIFICADO: { label: "Cliente", className: "bg-green-100 text-green-700" },
    PROPOSTA_ENVIADA: { label: "Proposta", className: "bg-purple-100 text-purple-700" },
    FECHADO: { label: "Fechado", className: "bg-emerald-100 text-emerald-700" },
    PERDIDO: { label: "Não salvo", className: "bg-red-100 text-red-700" },
    HUMANO_SOLICITADO: { label: "Aguardando", className: "bg-orange-100 text-orange-700" },
  };

  return statusMap[status] || { label: status, className: "bg-gray-100 text-gray-700" };
}

export function ChatList({ chats }: ChatListProps) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const filteredChats = chats.filter((chat) => {
    const searchLower = search.toLowerCase();
    return (
      chat.name?.toLowerCase().includes(searchLower) ||
      chat.phone.includes(search)
    );
  });

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const otherChats = filteredChats.filter((c) => !c.isPinned);

  return (
    <div className="w-80 min-w-[320px] bg-white border-r flex flex-col h-full flex-shrink-0">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <button className="flex-1 text-center py-2 text-sm font-medium text-pink-600 border-b-2 border-pink-500">
            Chats
          </button>
          <button className="flex-1 text-center py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Grupos
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar contato"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pinnedChats.length > 0 && (
          <div className="p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Pin className="h-3 w-3" />
              <span>Chats fixados</span>
            </div>
            {pinnedChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={pathname === `/chats/${chat.id}`}
              />
            ))}
          </div>
        )}

        <div className="p-3">
          {pinnedChats.length > 0 && (
            <p className="text-xs text-gray-500 mb-2">Todos os chats</p>
          )}
          {otherChats.length === 0 && pinnedChats.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum chat encontrado
            </p>
          )}
          {otherChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={pathname === `/chats/${chat.id}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatListItem({ chat, isActive }: { chat: ChatItem; isActive: boolean }) {
  const badge = getStatusBadge(chat.status, chat.ownerType);

  return (
    <Link href={`/chats/${chat.id}`}>
      <div
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1",
          isActive ? "bg-pink-50 border-l-4 border-pink-500" : "hover:bg-gray-50"
        )}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-medium text-sm">
            {(chat.name || chat.pushName)?.[0]?.toUpperCase() || chat.phone.slice(-2)}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {chat.name || chat.pushName || "Sem nome"}
            </span>
            <Badge className={cn("text-[10px] px-1.5 py-0", badge.className)}>
              {badge.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {chat.ownerType === "human" ? "👤 Em atendimento" : "🤖 Aguardando atendimento"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-gray-400">
            {chat.lastMessageAt
              ? new Date(chat.lastMessageAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
          {chat.unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
