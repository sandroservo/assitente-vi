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
    take: 200,
  });

  // Uma conversa por lead (evita duplicata quando há mais de uma Conversation para o mesmo lead)
  const byLeadId = new Map<string, (typeof conversations)[number]>();
  for (const c of conversations) {
    if (!byLeadId.has(c.leadId)) byLeadId.set(c.leadId, c);
  }
  const uniqueConversations = Array.from(byLeadId.values()).sort(
    (a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0)
  );

  const chats = uniqueConversations.map((c: (typeof uniqueConversations)[number]) => ({
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
