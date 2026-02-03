/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { conversations: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    if (!lead) {
      return NextResponse.json(
        { ok: false, error: "lead not found" },
        { status: 404 }
      );
    }

    await prisma.lead.update({
      where: { id },
      data: { ownerType: "human", status: "HUMANO_EM_ATENDIMENTO" },
    });

    if (lead.conversations[0]) {
      await prisma.handoff.create({
        data: {
          leadId: id,
          conversationId: lead.conversations[0].id,
          requestedBy: "human",
          reason: "Atendente assumiu o lead",
        },
      });
    }

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    console.error("Handoff error:", error);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}
