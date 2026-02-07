/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * API para criar lembretes (usando FollowUps)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: leadId } = await params;
        const body = await req.json();
        const { scheduledAt, note } = body;

        if (!scheduledAt) {
            return NextResponse.json(
                { error: "scheduledAt é obrigatório" },
                { status: 400 }
            );
        }

        // Buscar a conversa mais recente do lead
        const conversation = await prisma.conversation.findFirst({
            where: { leadId },
            orderBy: { lastMessageAt: "desc" },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Lead não possui conversa" },
                { status: 404 }
            );
        }

        const reminder = await prisma.followUp.create({
            data: {
                leadId,
                conversationId: conversation.id,
                stage: 0,
                scheduledAt: new Date(scheduledAt),
                status: "reminder",
                lastError: note || null,
            },
        });

        return NextResponse.json({ reminder }, { status: 201 });
    } catch (error) {
        console.error("Erro ao criar lembrete:", error);
        return NextResponse.json(
            { error: "Erro ao criar lembrete" },
            { status: 500 }
        );
    }
}

// GET - Lista lembretes do lead
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: leadId } = await params;

        const reminders = await prisma.followUp.findMany({
            where: { leadId, status: "reminder" },
            orderBy: { scheduledAt: "asc" },
        });

        return NextResponse.json({ reminders });
    } catch (error) {
        console.error("Erro ao buscar lembretes:", error);
        return NextResponse.json({ reminders: [] }, { status: 500 });
    }
}
