/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * API para listar leads
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leadsData = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        conversations: {
          take: 1,
          orderBy: { lastMessageAt: "desc" },
          select: { id: true },
        },
      },
      take: 200,
    });

    const leads = leadsData.map((lead: typeof leadsData[number]) => ({
      id: lead.id,
      name: lead.name,
      pushName: (lead as { pushName?: string | null }).pushName ?? null,
      phone: lead.phone,
      status: lead.status,
      ownerType: lead.ownerType,
      createdAt: lead.createdAt.toISOString(),
      conversationId: lead.conversations[0]?.id ?? null,
    }));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json({ leads: [] }, { status: 500 });
  }
}
