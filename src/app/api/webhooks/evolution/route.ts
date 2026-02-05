/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * Webhook para receber mensagens do WhatsApp via Evolution API (single-tenant).
 */

import { NextResponse } from "next/server";
import { prisma, LeadStatus } from "@/lib/prisma";
import { evolutionSendText, evolutionSendTextHumanized, evolutionGetProfilePicture, evolutionGetMediaBase64 } from "@/lib/evolution";
import { transcribeAudio, describeImage } from "@/lib/media";
import { generateAIResponse, shouldTransferToHuman, detectLeadStatus } from "@/lib/ai";

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
    const fromMe: boolean = payload?.data?.key?.fromMe === true;
    const pushName: string | undefined = payload?.data?.pushName;
    const instanceName: string | undefined = payload?.instance;
    const avatarUrl: string | undefined = payload?.data?.profilePictureUrl;

    const msg = payload?.data?.message ?? {};
    let text: string | undefined =
      msg?.conversation ?? msg?.extendedTextMessage?.text;

    const messageType: "text" | "audio" | "image" = text != null ? "text" : msg?.audioMessage ? "audio" : msg?.imageMessage ? "image" : "text";

    // Só transcreve/descreve mídia em mensagens recebidas (não as enviadas por nós)
    if (!fromMe) {
      if (messageType === "audio" && instanceName && providerId) {
        const media = await evolutionGetMediaBase64(instanceName, providerId);
        if (media) {
          const transcribed = await transcribeAudio(media.base64, media.mimeType);
          if (transcribed) text = transcribed;
        }
        if (!text) text = "[Áudio não transcrito]";
      } else if (messageType === "image" && instanceName && providerId) {
        const media = await evolutionGetMediaBase64(instanceName, providerId);
        const caption = msg?.imageMessage?.caption ?? "";
        if (media) {
          const described = await describeImage(media.base64, media.mimeType, caption || undefined);
          if (described) text = caption ? `${described}\n\nLegenda do usuário: ${caption}` : described;
        }
        if (!text) text = caption || "[Imagem sem descrição]";
      }
    }

    if (!remoteJid) {
      return NextResponse.json(
        { ok: false, error: "remoteJid missing" },
        { status: 422 }
      );
    }

    const phone = phoneFromJid(remoteJid);

    // Single-tenant: usa sempre a primeira organização
    let org = await prisma.organization.findFirst({ orderBy: { name: "asc" } });
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Amo Vidas", slug: "amovidas" },
      });
    }
    const organizationId = org.id;

    // Instância (opcional): para vincular conversa ao canal
    let instance = instanceName
      ? await prisma.instance.findFirst({
          where: { instanceName, organizationId },
          include: { organization: true },
        })
      : null;

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
          ...(fromMe ? {} : { unreadCount: { increment: 1 } }),
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
          unreadCount: fromMe ? 0 : 1,
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: fromMe ? "out" : "in",
        type: messageType,
        body: text ?? null,
        providerId: providerId ?? null,
        sentAt: new Date(),
      },
    });

    // Mensagem enviada pelo atendente (fromMe): humano assumiu a conversa — bot não responde até "Devolver ao Bot"
    if (fromMe) {
      const wasBot = lead.ownerType === "bot";
      await prisma.lead.update({
        where: { id: lead.id },
        data: { ownerType: "human", status: "HUMANO_EM_ATENDIMENTO" },
      });
      if (wasBot) {
        await prisma.handoff.create({
          data: {
            leadId: lead.id,
            conversationId: conversation.id,
            requestedBy: "human",
            reason: "Atendente enviou mensagem pelo WhatsApp",
          },
        });
      }
      return NextResponse.json({ ok: true, action: "human_sent" });
    }

    if (!text?.trim()) {
      return NextResponse.json({ ok: true, action: "no_text" });
    }

    // Se lead já está com humano, não responde automaticamente
    if (lead.ownerType === "human") {
      return NextResponse.json({ ok: true, action: "human_owner" });
    }

    // Lista de exceção: números da empresa etc. — Vi não responde
    const phoneNormalized = phone.replace(/\D/g, "").slice(-11);
    if (phoneNormalized) {
      const excluded = await prisma.excludedContact.findUnique({
        where: {
          organizationId_phone: {
            organizationId: lead.organizationId,
            phone: phoneNormalized,
          },
        },
      });
      if (excluded) {
        return NextResponse.json({ ok: true, action: "excluded_contact" });
      }
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
      organizationId: lead.organizationId,
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
