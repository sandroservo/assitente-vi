/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * API para listar conversas
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const convos = await prisma.conversation.findMany({
      orderBy: { lastMessageAt: "desc" },
      include: { lead: true },
      take: 100,
    });

    const conversations = convos.map((c) => ({
      id: c.id,
      name: c.lead.name,
      pushName: c.lead.pushName,
      avatarUrl: c.lead.avatarUrl,
      phone: c.lead.phone,
      status: c.lead.status,
      ownerType: c.lead.ownerType,
      unreadCount: c.unreadCount,
      lastMessageAt: c.lastMessageAt,
      isPinned: false,
    }));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Erro ao buscar conversas:", error);
    return NextResponse.json({ chats: [] }, { status: 500 });
  }
}
