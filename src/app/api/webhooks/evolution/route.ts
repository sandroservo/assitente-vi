/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * Webhook para receber mensagens do WhatsApp via Evolution API
 * Suporta multitenancy (múltiplas organizações e instâncias)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evolutionSendText, evolutionSendTextHumanized, evolutionGetProfilePicture } from "@/lib/evolution";
import { generateAIResponse, shouldTransferToHuman, detectLeadStatus } from "@/lib/ai";
import { LeadStatus } from "@prisma/client";

function phoneFromJid(remoteJid: string) {
  return remoteJid.split("@")[0];
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "invalid json" },
        { status: 400 }
      );
    }

    const remoteJid: string | undefined = payload?.data?.key?.remoteJid;
    const providerId: string | undefined = payload?.data?.key?.id;
    const pushName: string | undefined = payload?.data?.pushName;
    const instanceName: string | undefined = payload?.instance;
    const avatarUrl: string | undefined = payload?.data?.profilePictureUrl;

    const text: string | undefined =
      payload?.data?.message?.conversation ??
      payload?.data?.message?.extendedTextMessage?.text;

    if (!remoteJid) {
      return NextResponse.json(
        { ok: false, error: "remoteJid missing" },
        { status: 422 }
      );
    }

    const phone = phoneFromJid(remoteJid);

    // Busca a instância pelo nome (multitenancy)
    let instance = null;
    let organizationId: string | null = null;

    if (instanceName) {
      instance = await prisma.instance.findFirst({
        where: { instanceName },
        include: { organization: true },
      });
      
      if (instance) {
        organizationId = instance.organizationId;
      }
    }

    // Se não encontrou instância, busca organização padrão ou cria uma
    if (!organizationId) {
      const defaultOrg = await prisma.organization.findFirst({
        where: { slug: "default" },
      });

      if (defaultOrg) {
        organizationId = defaultOrg.id;
      } else {
        // Cria organização padrão se não existir
        const newOrg = await prisma.organization.create({
          data: {
            name: "Organização Padrão",
            slug: "default",
          },
        });
        organizationId = newOrg.id;
      }
    }

    // Busca ou cria lead vinculado à organização
    let lead = await prisma.lead.findFirst({
      where: { 
        organizationId,
        phone,
      },
    });

    // Busca foto de perfil se não tiver ainda
    let profilePicture: string | undefined = avatarUrl;
    if (!profilePicture) {
      profilePicture = (await evolutionGetProfilePicture(phone)) ?? undefined;
    }

    if (lead) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          lastMessageAt: new Date(),
          ...(pushName && { pushName }),
          ...(profilePicture && !lead.avatarUrl && { avatarUrl: profilePicture }),
        },
      });
    } else {
      lead = await prisma.lead.create({
        data: {
          organizationId,
          phone,
          pushName: pushName || null,
          avatarUrl: profilePicture || null,
          status: "NOVO",
          ownerType: "bot",
          lastMessageAt: new Date(),
        },
      });
    }

    // Busca ou cria conversa vinculada à instância
    let conversation = await prisma.conversation.findFirst({
      where: {
        leadId: lead.id,
        ...(instance && { instanceId: instance.id }),
      },
    });

    if (conversation) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        },
      });
    } else {
      conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          instanceId: instance?.id || null,
          remoteJid,
          channel: "whatsapp",
          lastMessageAt: new Date(),
          unreadCount: 1,
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "in",
        type: "text",
        body: text ?? null,
        providerId: providerId ?? null,
        sentAt: new Date(),
      },
    });

    // Se lead já está com humano, não responde automaticamente
    if (lead.ownerType === "human") {
      return NextResponse.json({ ok: true, action: "human_owner" });
    }

    // Verifica se pediu transferência para humano
    if (text && shouldTransferToHuman(text)) {
      await prisma.$transaction([
        prisma.lead.update({
          where: { id: lead.id },
          data: { status: "HUMANO_SOLICITADO", ownerType: "human" },
        }),
        prisma.handoff.create({
          data: {
            leadId: lead.id,
            conversationId: conversation.id,
            requestedBy: "lead",
            reason: "Lead solicitou atendente humano",
            summary: text,
          },
        }),
      ]);

      const handoffMessage = `Entendido! 👤 Vou te transferir para um de nossos atendentes. Aguarde um momento que logo alguém vai te atender!`;
      
      await evolutionSendText({ number: phone, text: handoffMessage });
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "out",
          type: "text",
          body: handoffMessage,
          sentAt: new Date(),
        },
      });

      return NextResponse.json({ ok: true, action: "handoff" });
    }

    // Busca histórico de mensagens para contexto da IA
    const messageHistory = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
      select: { direction: true, body: true },
    });

    // Gera resposta humanizada com IA (Vi - Amo Vidas)
    const { response: botResponse, extractedData } = await generateAIResponse(text ?? "", {
      leadId: lead.id,
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      leadStatus: lead.status,
      messageHistory,
    });
    
    try {
      // Envia mensagem de forma humanizada (com "digitando" e pausas)
      await evolutionSendTextHumanized({ number: phone, text: botResponse });
      
      // Salva a resposta do bot no banco
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: "out",
          type: "text",
          body: botResponse,
          sentAt: new Date(),
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), unreadCount: 0 },
      });

      // Detecta e atualiza status do lead baseado na conversa
      const detectedStatus = detectLeadStatus(
        messageHistory,
        text ?? "",
        lead.status
      );
      
      if (detectedStatus && detectedStatus !== lead.status) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: detectedStatus as LeadStatus },
        });
        console.log(`Lead ${lead.id} status atualizado: ${lead.status} → ${detectedStatus}`);
      }
    } catch (sendError) {
      console.error("Erro ao enviar resposta do bot:", sendError);
    }

    return NextResponse.json({ 
      ok: true, 
      action: "bot_replied",
      extractedData 
    });
  } catch (error) {
    console.error("Webhook Evolution error:", error);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}
