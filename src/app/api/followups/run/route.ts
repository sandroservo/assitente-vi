/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evolutionSendText } from "@/lib/evolution";

const FOLLOWUP_MESSAGES: Record<number, string> = {
  1: "Oi! Só passando pra ver se você conseguiu pensar sobre os planos do Amo Vidas 🙂",
  2: "Oi! Ainda faz sentido conversarmos sobre o clube de benefícios? Estou aqui pra te ajudar!",
  3: "Se precisar de ajuda pra escolher o melhor plano, é só me chamar! 😊",
  4: "Última mensagem por aqui! Se quiser retomar depois, é só me chamar. Cuide-se! 🌟",
};

export async function POST() {
  try {
    const due = await prisma.followUp.findMany({
      where: {
        status: "pending",
        scheduledAt: { lte: new Date() },
      },
      include: { lead: true, conversation: true },
      take: 50,
    });

    let processed = 0;
    let errors = 0;

    for (const f of due) {
      try {
        const msg = FOLLOWUP_MESSAGES[f.stage] ?? FOLLOWUP_MESSAGES[4];

        await evolutionSendText({ number: f.lead.phone, text: msg });

        await prisma.$transaction([
          prisma.message.create({
            data: {
              conversationId: f.conversationId,
              direction: "out",
              type: "text",
              body: msg,
              sentAt: new Date(),
            },
          }),
          prisma.followUp.update({
            where: { id: f.id },
            data: { status: "sent" },
          }),
        ]);

        processed++;
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        await prisma.followUp.update({
          where: { id: f.id },
          data: { status: "error", lastError: errorMessage },
        });
        errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      processed,
      errors,
      total: due.length,
    });
  } catch (error) {
    console.error("Run followups error:", error);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}
