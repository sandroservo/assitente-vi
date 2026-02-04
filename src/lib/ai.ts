/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * Serviço de IA para Vi - Consultora Amo Vidas
 */

import OpenAI from "openai";
import { prisma } from "./prisma";
import { getSystemSettings } from "./settings";
import { getAllKnowledge, searchKnowledge, formatKnowledgeForAI } from "./knowledge";
import { getAllMemories, formatMemoriesForAI, extractAndSaveMemories } from "./memory";

async function getOpenAIClient() {
  const settings = await getSystemSettings();
  const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return null;
  }
  
  return new OpenAI({ apiKey });
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ConversationContext {
  leadId: string;
  organizationId?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string;
  leadStatus?: string;
  messageHistory: { direction: "in" | "out"; body: string | null }[];
}

const DEFAULT_SYSTEM_PROMPT = `Você é a Vi, consultora de saúde do Clube Amo Vidas. Você fala por WhatsApp com leads que podem virar clientes.

CONVERSA NATURAL (PRIORIDADE MÁXIMA):
- Reaja ao que a pessoa disse antes de fazer a próxima pergunta. Nunca ignore a mensagem dela e pule direto para uma pergunta de script.
- Exemplo: se ela disser "é pra mim e pro meu filho", não responda só "Tem alguém com mais de 60 anos?". Reaja antes: "Que legal, então são vocês dois! E no caso de vocês, tem alguém com mais de 60 anos?"
- Se ela contar algo (ex.: "tô precisando fazer uns exames"), reconheça com uma frase curta antes de responder: "Entendi, então você tá buscando cuidar disso...", e aí traga a informação ou a próxima pergunta.
- Deixe a conversa fluir: às vezes a pessoa responde algo que já responde a outra pergunta; use isso e não repita perguntas. Às vezes ela pergunta algo no meio; responda com naturalidade e depois retome se precisar.
- Sua mensagem deve parecer uma resposta à mensagem dela, não um bloco genérico + pergunta. Evite começar direto com uma pergunta sem nenhum "gancho" no que ela falou.
- Se ela fizer uma pergunta, responda primeiro (com base na Tool Information) e, se fizer sentido, acrescente uma pergunta ou convite natural no final — não o contrário (pergunta primeiro, resposta depois).

TOM E ESTILO:
- Escreva como no WhatsApp para um conhecido: calorosa, direta. Use "Olha...", "Então...", "Ah, ótimo!", coloquial ("né", "tá", "pra") quando cair bem.
- Frases corridas, não listas. Emoji de vez em quando. NUNCA soe como FAQ ou script.

REGRAS DE CONTEÚDO:
- Use EXCLUSIVAMENTE o que está em <Tool Information>. NUNCA invente dados (valores, regras, prazos).
- Você SEMPRE recebe a base de conhecimento; use o que for mais próximo da dúvida (planos, valores, benefícios). Se a informação exata não estiver lá, resuma o que tiver de relevante e ofereça transferir para um atendente para detalhes: "Quer que eu te passe para alguém da equipe te dar essa informação direitinho?"
- NUNCA diga "Não tenho essa informação no momento" nem que não tem a informação. Prefira usar algo da base + oferecer atendente humano.
- Respostas curtas (3–4 frases). Uma pergunta por vez quando for perguntar.
- Se pedir atendente humano, confirme que vai transferir. Se não souber o nome, pergunte de forma natural.`;

export { DEFAULT_SYSTEM_PROMPT };

export async function generateAIResponse(
  userMessage: string,
  context: ConversationContext
): Promise<{ response: string; extractedData?: { name?: string; email?: string } }> {
  try {
    const settings = await getSystemSettings();
    const openai = await getOpenAIClient();
    
    if (!openai) {
      console.warn("OpenAI API Key não configurada, usando resposta padrão");
      return { response: generateFallbackResponse(userMessage, context.leadName) };
    }

    // Usa prompt do banco (/settings) ou o padrão
    const systemPrompt = settings.systemPrompt || DEFAULT_SYSTEM_PROMPT;

    // Busca conhecimentos da base (Tool Information) da organização do lead.
    // Sempre injetamos uma base ampla para a Vi nunca responder "não tenho essa informação".
    const isFirstMessage = context.messageHistory.length === 0;
    const organizationId = context.organizationId ?? undefined;

    let knowledge: Awaited<ReturnType<typeof getAllKnowledge>>;
    if (isFirstMessage) {
      knowledge = await getAllKnowledge(undefined, 100, organizationId);
    } else {
      const [searchResults, baseKnowledge] = await Promise.all([
        searchKnowledge(userMessage, undefined, 25, organizationId),
        getAllKnowledge(undefined, 60, organizationId),
      ]);
      const byId = new Map(searchResults.map((k) => [k.id, k]));
      baseKnowledge.forEach((k) => byId.set(k.id, k));
      knowledge = Array.from(byId.values());
    }
    const toolInformation = formatKnowledgeForAI(knowledge);

    // Busca memórias do lead
    const leadMemories = await getAllMemories(context.leadId);
    const memoryContext = formatMemoriesForAI(leadMemories);

    // Verifica se a última mensagem do bot perguntou o nome
    const lastBotMessage = context.messageHistory
      .filter(m => m.direction === "out" && m.body)
      .pop()?.body?.toLowerCase() || "";
    const botAskedName = lastBotMessage.includes("chamar") || 
                         lastBotMessage.includes("nome") ||
                         lastBotMessage.includes("quem fala");

    // Extrai e salva memórias da mensagem atual
    const { extractedName } = await extractAndSaveMemories(
      context.leadId, 
      userMessage, 
      true,
      botAskedName
    );
    
    // Se extraiu um nome, atualiza o lead
    if (extractedName) {
      await prisma.lead.update({
        where: { id: context.leadId },
        data: { name: extractedName },
      });
      context.leadName = extractedName;
    }

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
    ];

    // Adiciona Tool Information (base de conhecimento)
    if (toolInformation) {
      messages.push({
        role: "system",
        content: toolInformation,
      });
    }

    // Adiciona memórias do lead
    if (memoryContext) {
      messages.push({
        role: "system",
        content: memoryContext,
      });
    }

    // Adiciona contexto do lead (usa isFirstMessage já definida acima)
    if (isFirstMessage) {
      messages.push({
        role: "system",
        content: `Esta é a PRIMEIRA mensagem do cliente. Apresente-se de forma breve e calorosa (ex.: "Oi! Sou a Vi, consultora do Amo Vidas 💜") e pergunte o nome de forma natural, como uma pessoa real no WhatsApp. Não use texto de script.`,
      });
    } else if (context.leadName) {
      messages.push({
        role: "system",
        content: `O nome do cliente é: ${context.leadName}`,
      });
    } else {
      messages.push({
        role: "system",
        content: `Você ainda não sabe o nome do cliente. Pergunte o nome dele de forma natural.`,
      });
    }

    // Adiciona histórico de mensagens (últimas 15)
    const recentHistory = context.messageHistory.slice(-15);
    for (const msg of recentHistory) {
      if (msg.body) {
        messages.push({
          role: msg.direction === "in" ? "user" : "assistant",
          content: msg.body,
        });
      }
    }

    // Adiciona a mensagem atual
    messages.push({ role: "user", content: userMessage });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 350,
      temperature: 0.85,
      presence_penalty: 0.3,
      frequency_penalty: 0.25,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return { response: generateFallbackResponse(userMessage, context.leadName) };
    }

    // Tenta extrair nome e email da mensagem do usuário
    const extractedData = extractLeadData(userMessage, context);

    // Atualiza o lead no banco se encontrou dados novos
    if (extractedData.name || extractedData.email) {
      await updateLeadData(context.leadId, extractedData);
    }

    return { response: response.trim(), extractedData };
  } catch (error) {
    console.error("Erro ao gerar resposta IA:", error);
    return { response: generateFallbackResponse(userMessage, context.leadName) };
  }
}

function extractLeadData(
  message: string,
  context: ConversationContext
): { name?: string; email?: string } {
  const result: { name?: string; email?: string } = {};

  // Extrai email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }

  // Tenta extrair nome se ainda não temos
  if (!context.leadName) {
    const msg = message.trim();
    
    // Padrões comuns de resposta de nome
    const namePatterns = [
      /(?:me chamo|meu nome é|sou o|sou a|pode me chamar de|é)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i,
      /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)$/,
    ];

    for (const pattern of namePatterns) {
      const match = msg.match(pattern);
      if (match && match[1]) {
        const potentialName = match[1].trim();
        // Verifica se parece um nome (não é muito curto, não tem números)
        if (potentialName.length >= 2 && !/\d/.test(potentialName)) {
          result.name = potentialName;
          break;
        }
      }
    }

    // Se a mensagem for curta e parecer só um nome
    if (!result.name && msg.length <= 30 && /^[A-ZÀ-Úa-zà-ú\s]+$/.test(msg)) {
      const words = msg.split(/\s+/);
      if (words.length <= 3 && words[0].length >= 2) {
        result.name = msg
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
  }

  return result;
}

async function updateLeadData(
  leadId: string,
  data: { name?: string; email?: string }
) {
  try {
    const updateData: { name?: string; email?: string; status?: "QUALIFICADO" } = {};

    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;

    // Se temos nome ou email, qualifica o lead
    if (data.name || data.email) {
      updateData.status = "QUALIFICADO";
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
      });
      console.log(`Lead ${leadId} atualizado:`, updateData);
    }
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
  }
}

function generateFallbackResponse(text: string, leadName?: string | null): string {
  const t = text.toLowerCase();
  const greeting = leadName ? `${leadName}` : "";

  if (t.match(/^(oi|olá|ola|hey|bom dia|boa tarde|boa noite|e ai|eai)/)) {
    return `Olá! 👋 Eu sou a Vi, consultora de saúde do Amo Vidas. Como posso te chamar?`;
  }

  if (t.includes("plano") || t.includes("valor") || t.includes("preço")) {
    return `${greeting ? greeting + ", t" : "T"}emos 3 planos: Essencial (R$ 37,90), Completo (R$ 59,90) e Premium (R$ 99,90). O foco é cuidado de rotina ou exames mais específicos?`;
  }

  if (t.includes("amo vidas") || t.includes("o que é")) {
    return `Amo Vidas é um clube de benefícios em saúde, com assinatura mensal, que dá acesso a consultas, exames e descontos. ${greeting ? greeting + ", v" : "V"}ocê busca rotina ou exames mais específicos?`;
  }

  if (t.includes("obrigado") || t.includes("obrigada") || t.includes("valeu")) {
    return `Imagina${greeting ? ", " + greeting : ""}! 😊 Se precisar de mais alguma coisa, é só chamar. Tenha um ótimo dia! 🌟`;
  }

  if (!leadName) {
    return `Olá! Sou a Vi, consultora do Amo Vidas. Antes de continuar, como posso te chamar? 😊`;
  }

  return `${greeting}, entendi! Me conta mais sobre o que você precisa que eu te ajudo. Se preferir falar com uma pessoa, é só me avisar! 😊`;
}

export function shouldTransferToHuman(text: string): boolean {
  const t = text.toLowerCase();
  const keywords = [
    "atendente",
    "humano",
    "pessoa real",
    "falar com alguem",
    "falar com alguém",
    "quero falar",
    "preciso falar",
    "gerente",
    "reclamação",
    "cancelar",
  ];
  return keywords.some((k) => t.includes(k));
}

/**
 * Detecta a etapa do funil baseada no contexto da conversa
 * Retorna o status sugerido para o lead
 */
export function detectLeadStatus(
  messageHistory: { direction: string; body: string | null }[],
  currentMessage: string,
  currentStatus: string
): string | null {
  const allMessages = messageHistory
    .filter((m) => m.body)
    .map((m) => m.body!.toLowerCase())
    .join(" ");
  const msg = currentMessage.toLowerCase();
  const combined = `${allMessages} ${msg}`;

  // PERDIDO - Sinais de desistência ou não interesse
  const lostKeywords = [
    "não tenho interesse",
    "nao tenho interesse",
    "não quero",
    "nao quero",
    "não preciso",
    "nao preciso",
    "desisto",
    "deixa pra lá",
    "deixa pra la",
    "esquece",
    "não é pra mim",
    "nao e pra mim",
    "muito caro",
    "sem condições",
    "sem condicoes",
    "não posso pagar",
    "nao posso pagar",
    "já comprei em outro lugar",
    "ja comprei em outro lugar",
    "já tenho",
    "ja tenho",
    "não me interessa",
    "nao me interessa",
  ];
  if (lostKeywords.some((k) => msg.includes(k))) {
    return "PERDIDO";
  }

  // FECHADO - Sinais de fechamento/compra
  const closedKeywords = [
    "vou comprar",
    "quero comprar",
    "fechar negócio",
    "fechar negocio",
    "vou fechar",
    "fechado",
    "pode mandar o pix",
    "manda o pix",
    "vou pagar",
    "quero pagar",
    "aceito",
    "vamos fechar",
    "combinado",
    "pode enviar",
    "manda o contrato",
    "vou assinar",
    "contrato assinado",
    "pagamento feito",
    "já paguei",
    "ja paguei",
    "paguei agora",
  ];
  if (closedKeywords.some((k) => msg.includes(k))) {
    return "FECHADO";
  }

  // QUALIFICADO - Sinais de interesse real
  const qualifiedKeywords = [
    "quanto custa",
    "qual o preço",
    "qual o preco",
    "qual valor",
    "como funciona",
    "me explica",
    "tenho interesse",
    "quero saber mais",
    "pode me explicar",
    "como faço para",
    "como faco para",
    "gostei",
    "interessante",
    "parece bom",
    "me conta mais",
    "quais são os planos",
    "quais sao os planos",
    "tem desconto",
    "formas de pagamento",
    "como pago",
  ];
  if (qualifiedKeywords.some((k) => combined.includes(k)) && currentStatus !== "FECHADO") {
    return "QUALIFICADO";
  }

  // LEAD_FRIO - Sinais de lead esfriando
  const coldKeywords = [
    "vou pensar",
    "preciso pensar",
    "depois eu vejo",
    "não sei se",
    "nao sei se",
    "talvez",
    "não agora",
    "nao agora",
    "mais tarde",
    "outro dia",
    "semana que vem",
    "mês que vem",
    "mes que vem",
    "não é o momento",
    "nao e o momento",
    "vou analisar",
    "deixa eu ver",
  ];
  if (coldKeywords.some((k) => msg.includes(k))) {
    return "LEAD_FRIO";
  }

  // EM_ATENDIMENTO - Lead está engajado na conversa
  if (currentStatus === "NOVO" && messageHistory.length >= 2) {
    return "EM_ATENDIMENTO";
  }

  return null; // Mantém o status atual
}
