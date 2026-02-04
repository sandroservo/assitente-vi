/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChatList } from "@/components/chat/ChatList";
import { ChatArea } from "@/components/chat/ChatArea";

export const dynamic = "force-dynamic";

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Busca todas as conversas para a lista
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: { lead: true },
    take: 100,
  });

  // Busca a conversa atual com mensagens
  const currentConversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      lead: true,
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });

  if (!currentConversation) {
    return notFound();
  }

  // Marca como lida
  await prisma.conversation.update({
    where: { id },
    data: { unreadCount: 0 },
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

  const lead = {
    id: currentConversation.lead.id,
    name: currentConversation.lead.name,
    pushName: currentConversation.lead.pushName,
    avatarUrl: currentConversation.lead.avatarUrl,
    phone: currentConversation.lead.phone,
    email: currentConversation.lead.email,
    city: currentConversation.lead.city,
    status: currentConversation.lead.status,
    ownerType: currentConversation.lead.ownerType as "bot" | "human",
    summary: currentConversation.lead.summary,
    notes: currentConversation.lead.notes,
  };

  const messages = currentConversation.messages.map((m: typeof currentConversation.messages[number]) => ({
    id: m.id,
    body: m.body || "",
    direction: m.direction as "in" | "out",
    createdAt: m.createdAt,
  }));

  return (
    <div className="flex h-[calc(100vh-0px)]">
      <ChatList chats={chats} />
      <ChatArea
        conversationId={id}
        lead={lead}
        messages={messages}
      />
    </div>
  );
}
