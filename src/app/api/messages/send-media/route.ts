/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * API para enviar mídia (imagem, PDF, documento) via WhatsApp (Evolution API)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evolutionSendMedia } from "@/lib/evolution";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { conversationId, base64, mimeType, fileName, caption } =
      await req.json();

    if (!conversationId || !base64) {
      return NextResponse.json(
        { ok: false, error: "conversationId e base64 são obrigatórios" },
        { status: 400 }
      );
    }

    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { lead: true },
    });

    if (!convo) {
      return NextResponse.json(
        { ok: false, error: "Conversa não encontrada" },
        { status: 404 }
      );
    }

    // Determina o tipo de mídia com base no mimeType
    let mediatype: "image" | "document" | "video" = "document";
    const mime = (mimeType || "").toLowerCase();
    if (mime.startsWith("image/")) mediatype = "image";
    else if (mime.startsWith("video/")) mediatype = "video";

    // Monta o data URI para a Evolution API
    const dataUri = `data:${mimeType || "application/octet-stream"};base64,${base64}`;

    try {
      await evolutionSendMedia({
        number: convo.lead.phone,
        mediatype,
        media: dataUri,
        caption: caption || undefined,
        fileName: fileName || undefined,
      });
    } catch (evolutionError) {
      console.error("[Send Media] Evolution API error:", evolutionError);
      const errorMessage =
        evolutionError instanceof Error
          ? evolutionError.message
          : "Erro desconhecido";
      return NextResponse.json(
        { ok: false, error: `Erro ao enviar mídia: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Identifica o atendente logado
    const session = await auth();
    const sentByUserId = session?.user?.id || null;

    // Texto descritivo para o histórico
    const bodyText =
      mediatype === "image"
        ? `[Imagem enviada${caption ? `: ${caption}` : ""}]`
        : mediatype === "video"
          ? `[Vídeo enviado${caption ? `: ${caption}` : ""}]`
          : `[Documento enviado: ${fileName || "arquivo"}]`;

    const msg = await prisma.message.create({
      data: {
        conversationId,
        direction: "out",
        type: mediatype,
        body: bodyText,
        sentByUserId,
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
    console.error("[Send Media] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Erro interno ao enviar mídia" },
      { status: 500 }
    );
  }
}
