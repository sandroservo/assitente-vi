/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * Wrapper client-side para lista de chats com polling
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatList } from "./ChatList";

interface ChatItem {
  id: string;
  name: string | null;
  pushName: string | null;
  avatarUrl: string | null;
  phone: string;
  status: string;
  ownerType: "bot" | "human";
  unreadCount: number;
  lastMessageAt: Date | null;
  isPinned?: boolean;
}

interface ChatListWrapperProps {
  initialChats: ChatItem[];
}

const POLLING_INTERVAL = 3000; // 3 segundos

export function ChatListWrapper({ initialChats }: ChatListWrapperProps) {
  const [chats, setChats] = useState<ChatItem[]>(initialChats);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats);
      }
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchChats, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchChats]);

  return <ChatList chats={chats} />;
}
