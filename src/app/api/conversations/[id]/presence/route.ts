/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Busca status de presença (online/offline) do cliente
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evolutionFetchPresence } from "@/lib/evolution";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const convo = await prisma.conversation.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!convo) {
      return NextResponse.json(
        { ok: false, error: "Conversa não encontrada" },
        { status: 404 }
      );
    }

    const presence = await evolutionFetchPresence(convo.lead.phone);

    return NextResponse.json({
      ok: true,
      available: presence?.available ?? false,
      lastSeen: presence?.lastSeen ?? null,
    });
  } catch (error) {
    console.error("[Presence] Error:", error);
    return NextResponse.json({ ok: true, available: false, lastSeen: null });
  }
}
