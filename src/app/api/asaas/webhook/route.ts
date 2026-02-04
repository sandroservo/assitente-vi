/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * Webhook do Asaas para processar notificações de pagamento
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evolutionSendText } from "@/lib/evolution";

// Tipos de eventos do Asaas
type AsaasEvent = 
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL";

interface AsaasWebhookPayload {
  event: AsaasEvent;
  payment: {
    id: string;
    customer: string;
    value: number;
    netValue: number;
    description?: string;
    billingType: string;
    status: string;
    invoiceUrl?: string;
    externalReference?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerCpfCnpj?: string;
  };
}

// Mensagens de acordo com o evento
const MESSAGES = {
  PAYMENT_CONFIRMED: `🎉 Pagamento confirmado!

Seja muito bem-vindo(a) ao Amo Vidas! 💜

Seu cartão de benefícios já está ativo. Em breve você receberá todas as instruções de como usar.

Qualquer dúvida, estou por aqui! 😊`,

  PAYMENT_OVERDUE: `⚠️ Olá! Notei que o pagamento do seu plano Amo Vidas está pendente.

Posso te ajudar com alguma coisa? Se precisar de um novo link de pagamento, é só me avisar! 💜`,
};

export async function POST(req: Request) {
  try {
    const payload: AsaasWebhookPayload = await req.json();
    
    console.log("[Asaas Webhook] Evento recebido:", payload.event);
    console.log("[Asaas Webhook] Payment ID:", payload.payment?.id);

    const { event, payment } = payload;

    if (!payment) {
      return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
    }

    // Busca o lead pelo telefone ou email
    const phone = payment.customerPhone?.replace(/\D/g, "") || null;
    const email = payment.customerEmail || null;

    let lead = null;

    if (phone) {
      // Tenta buscar pelo telefone (formato brasileiro)
      const phoneVariations = [
        phone,
        `55${phone}`,
        phone.replace(/^55/, ""),
      ];

      for (const phoneVar of phoneVariations) {
        lead = await prisma.lead.findFirst({
          where: { phone: { contains: phoneVar } },
          include: { conversations: { take: 1, orderBy: { lastMessageAt: "desc" } } },
        });
        if (lead) break;
      }
    }

    if (!lead && email) {
      lead = await prisma.lead.findFirst({
        where: { email },
        include: { conversations: { take: 1, orderBy: { lastMessageAt: "desc" } } },
      });
    }

    // Processa eventos de pagamento
    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        if (lead) {
          // Atualiza status do lead para FECHADO
          await prisma.lead.update({
            where: { id: lead.id },
            data: { 
              status: "FECHADO",
              name: lead.name || payment.customerName || null,
              email: lead.email || payment.customerEmail || null,
            },
          });

          // Envia mensagem de boas-vindas
          await evolutionSendText({ 
            number: lead.phone, 
            text: MESSAGES.PAYMENT_CONFIRMED 
          });

          // Salva mensagem no histórico
          if (lead.conversations?.[0]) {
            await prisma.message.create({
              data: {
                conversationId: lead.conversations[0].id,
                direction: "out",
                type: "text",
                body: MESSAGES.PAYMENT_CONFIRMED,
                sentAt: new Date(),
              },
            });
          }

          console.log(`[Asaas Webhook] Lead ${lead.id} marcado como FECHADO`);
        } else {
          console.log("[Asaas Webhook] Lead não encontrado para:", phone || email);
        }
        break;
      }

      case "PAYMENT_OVERDUE": {
        if (lead) {
          // Atualiza status para indicar atraso
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: "QUALIFICADO" }, // Mantém qualificado mas com follow-up
          });

          // Envia lembrete
          await evolutionSendText({ 
            number: lead.phone, 
            text: MESSAGES.PAYMENT_OVERDUE 
          });

          // Salva mensagem no histórico
          if (lead.conversations?.[0]) {
            await prisma.message.create({
              data: {
                conversationId: lead.conversations[0].id,
                direction: "out",
                type: "text",
                body: MESSAGES.PAYMENT_OVERDUE,
                sentAt: new Date(),
              },
            });
          }

          console.log(`[Asaas Webhook] Follow-up enviado para lead ${lead.id}`);
        }
        break;
      }

      default:
        console.log(`[Asaas Webhook] Evento ${event} ignorado`);
    }

    return NextResponse.json({ 
      ok: true, 
      event,
      leadFound: !!lead,
    });

  } catch (error) {
    console.error("[Asaas Webhook] Erro:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

// GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: "Webhook Asaas ativo",
    events: [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED", 
      "PAYMENT_OVERDUE",
    ],
  });
}
