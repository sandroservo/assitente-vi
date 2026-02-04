/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { prisma } from "@/lib/prisma";
import { ChatList } from "@/components/chat/ChatList";

export const dynamic = "force-dynamic";

export default async function ChatsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: { lead: true },
    take: 100,
  });

  const chats = conversations.map((c: typeof conversations[number]) => ({
    id: c.id,
    name: c.lead.name,
    pushName: c.lead.pushName,
    avatarUrl: c.lead.avatarUrl,
    phone: c.lead.phone,
    status: c.lead.status,
    ownerType: c.lead.ownerType as "bot" | "human",
    unreadCount: c.unreadCount,
    lastMessageAt: c.lastMessageAt,
    isPinned: false,
  }));

  return (
    <div className="flex h-[calc(100vh-0px)]">
      <ChatList chats={chats} />
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400">
          <p className="text-lg">Selecione uma conversa</p>
          <p className="text-sm">para visualizar as mensagens</p>
        </div>
      </div>
    </div>
  );
}
