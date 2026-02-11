/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * API de disparo em massa via SSE (Server-Sent Events)
 * Envia mensagens sequencialmente com delay aleatório (10-30s)
 * para evitar bloqueio do número na Evolution API / WhatsApp.
 */

import { evolutionSendText, evolutionSendMedia } from "@/lib/evolution";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutos máximo

interface BroadcastContact {
  phone: string;
  name: string;
}

interface BroadcastPayload {
  contacts: BroadcastContact[];
  message: string;
  imageBase64?: string; // base64 puro (sem prefixo data:...)
  imageMimeType?: string;
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const body: BroadcastPayload = await req.json();
    const { contacts, message, imageBase64, imageMimeType } = body;

    if (!contacts?.length || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Contatos e mensagem são obrigatórios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Embaralha os contatos para ordem aleatória
    const shuffled = [...contacts].sort(() => Math.random() - 0.5);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: Record<string, unknown>) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }

        send({
          type: "start",
          total: shuffled.length,
          message: `Iniciando disparo para ${shuffled.length} contatos...`,
        });

        let sent = 0;
        let failed = 0;

        for (let i = 0; i < shuffled.length; i++) {
          const contact = shuffled[i];

          try {
            // Se tem imagem, envia como mídia com caption
            if (imageBase64) {
              await evolutionSendMedia({
                number: contact.phone,
                mediatype: "image",
                media: imageBase64,
                mimetype: imageMimeType || "image/jpeg",
                caption: message,
              });
            } else {
              await evolutionSendText({
                number: contact.phone,
                text: message,
              });
            }

            sent++;
            send({
              type: "progress",
              index: i + 1,
              total: shuffled.length,
              sent,
              failed,
              contact: contact.name || contact.phone,
              status: "ok",
            });
          } catch (error) {
            failed++;
            const errMsg =
              error instanceof Error ? error.message : "Erro desconhecido";
            send({
              type: "progress",
              index: i + 1,
              total: shuffled.length,
              sent,
              failed,
              contact: contact.name || contact.phone,
              status: "error",
              error: errMsg,
            });
          }

          // Delay aleatório entre 10-30 segundos (exceto no último)
          if (i < shuffled.length - 1) {
            const delay = randomDelay(10000, 30000);
            send({
              type: "waiting",
              delay,
              message: `Aguardando ${Math.round(delay / 1000)}s antes do próximo envio...`,
            });
            await sleep(delay);
          }
        }

        send({
          type: "done",
          sent,
          failed,
          total: shuffled.length,
          message: `Disparo finalizado: ${sent} enviados, ${failed} falharam.`,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Broadcast] Erro:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno no broadcast" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
