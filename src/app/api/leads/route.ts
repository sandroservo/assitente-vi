/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * API para listar leads
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_TAKE = 20;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const skip = Math.max(0, Number(searchParams.get("skip")) || 0);
    const take = Math.min(50, Math.max(1, Number(searchParams.get("take")) || DEFAULT_TAKE));

    const leadsData = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        conversations: {
          take: 1,
          orderBy: { lastMessageAt: "desc" },
          select: { id: true },
        },
      },
      skip,
      take: take + 1,
    });

    const hasMore = leadsData.length > take;
    const page = leadsData.slice(0, take);

    const leads = page.map((lead: typeof leadsData[number]) => ({
      id: lead.id,
      name: lead.name,
      pushName: (lead as { pushName?: string | null }).pushName ?? null,
      phone: lead.phone,
      status: lead.status,
      ownerType: lead.ownerType,
      createdAt: lead.createdAt.toISOString(),
      conversationId: lead.conversations[0]?.id ?? null,
    }));

    return NextResponse.json({ leads, hasMore });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json({ leads: [], hasMore: false }, { status: 500 });
  }
}
