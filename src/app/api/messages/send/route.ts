/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evolutionSendText } from "@/lib/evolution";

export async function POST(req: Request) {
  try {
    const { conversationId, text } = await req.json();

    if (!conversationId || !text) {
      return NextResponse.json(
        { ok: false, error: "missing fields" },
        { status: 400 }
      );
    }

    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { lead: true },
    });

    if (!convo) {
      return NextResponse.json(
        { ok: false, error: "conversation not found" },
        { status: 404 }
      );
    }

    await evolutionSendText({ number: convo.lead.phone, text });

    const msg = await prisma.message.create({
      data: {
        conversationId,
        direction: "out",
        type: "text",
        body: text,
        sentAt: new Date(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    await prisma.lead.update({
      where: { id: convo.leadId },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ ok: true, message: msg });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}
