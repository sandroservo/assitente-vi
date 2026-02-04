/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { getSystemSettings } from "@/lib/settings";

type SendTextArgs = {
  number: string;
  text: string;
};

async function getEvolutionConfig() {
  const settings = await getSystemSettings();
  return {
    baseUrl: settings.evolutionBaseUrl || process.env.EVOLUTION_BASE_URL || "",
    instance: settings.evolutionInstance || process.env.EVOLUTION_INSTANCE || "",
    token: settings.evolutionToken || process.env.EVOLUTION_TOKEN || "",
  };
}

/**
 * Envia status "composing" (digitando) para o contato
 */
export async function evolutionSendPresence(number: string, presence: "composing" | "recording" | "paused" = "composing") {
  const { baseUrl, instance, token } = await getEvolutionConfig();

  // Evolution API v2 - endpoint correto: /chat/sendPresence
  const url = `${baseUrl.replace(/\/api\/?$/, "")}/chat/sendPresence/${instance}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: token,
      },
      body: JSON.stringify({
        number,
        presence,
        delay: 1200,
      }),
    });
    
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Erro presence:", res.status, body);
    }
  } catch (error) {
    console.error("Erro ao enviar presence:", error);
  }
}

export async function evolutionSendText({ number, text }: SendTextArgs) {
  const { baseUrl, instance, token } = await getEvolutionConfig();

  // Evolution API v2 - remove /api do base se existir
  const url = `${baseUrl.replace(/\/api\/?$/, "")}/message/sendText/${instance}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: token,
    },
    body: JSON.stringify({
      number,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Evolution sendText failed: ${res.status} ${body}`);
  }

  return res.json().catch(() => ({}));
}

/**
 * Calcula delay de digitação baseado no tamanho do texto
 * Simula velocidade de digitação humana (~50-80 caracteres por segundo)
 */
function calculateTypingDelay(text: string): number {
  const baseDelay = 500; // Delay mínimo de 500ms
  const charsPerSecond = 60; // Velocidade média de digitação
  const calculatedDelay = (text.length / charsPerSecond) * 1000;
  const maxDelay = 4000; // Máximo de 4 segundos
  
  return Math.min(baseDelay + calculatedDelay, maxDelay);
}

/**
 * Divide texto em partes menores para envio mais natural
 * Divide por parágrafos, frases ou tamanho máximo
 */
function splitMessage(text: string, maxLength: number = 300): string[] {
  // Primeiro tenta dividir por parágrafos (linhas duplas)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  if (paragraphs.length > 1) {
    const result: string[] = [];
    for (const paragraph of paragraphs) {
      if (paragraph.length <= maxLength) {
        result.push(paragraph.trim());
      } else {
        // Se o parágrafo for muito grande, divide por frases
        result.push(...splitBySentences(paragraph, maxLength));
      }
    }
    return result;
  }
  
  // Se não tem parágrafos, divide por frases
  return splitBySentences(text, maxLength);
}

function splitBySentences(text: string, maxLength: number): string[] {
  // Divide por pontuação final (. ! ?)
  const sentences = text.split(/(?<=[.!?])\s+/);
  const result: string[] = [];
  let current = "";
  
  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= maxLength) {
      current = (current + " " + sentence).trim();
    } else {
      if (current) result.push(current);
      current = sentence.trim();
    }
  }
  
  if (current) result.push(current);
  
  // Se ainda tiver partes muito grandes, divide por tamanho
  return result.flatMap(part => {
    if (part.length <= maxLength) return [part];
    const chunks: string[] = [];
    let i = 0;
    while (i < part.length) {
      chunks.push(part.slice(i, i + maxLength));
      i += maxLength;
    }
    return chunks;
  });
}

/**
 * Aguarda um tempo em ms
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Envia mensagem de forma humanizada:
 * - Divide mensagens longas
 * - Mostra "digitando" antes de cada parte
 * - Pausa entre mensagens
 */
/**
 * Busca a foto de perfil de um contato no WhatsApp
 */
export async function evolutionGetProfilePicture(number: string): Promise<string | null> {
  const { baseUrl, instance, token } = await getEvolutionConfig();
  
  // Endpoint correto da Evolution API v2: /chat/fetchProfile
  const url = `${baseUrl.replace(/\/api\/?$/, "")}/chat/fetchProfile/${instance}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: token,
      },
      body: JSON.stringify({ number }),
    });

    if (!res.ok) {
      console.log(`[Evolution] Erro ao buscar perfil: ${res.status}`);
      return null;
    }

    const data = await res.json();
    // O campo correto é "picture" no endpoint fetchProfile
    return data?.picture || data?.profilePictureUrl || null;
  } catch (error) {
    console.error("[Evolution] Erro ao buscar foto de perfil:", error);
    return null;
  }
}

export async function evolutionSendTextHumanized({ number, text }: SendTextArgs) {
  const parts = splitMessage(text);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Envia status "digitando"
    await evolutionSendPresence(number, "composing");
    
    // Aguarda tempo proporcional ao tamanho
    const typingDelay = calculateTypingDelay(part);
    await sleep(typingDelay);
    
    // Envia a mensagem
    await evolutionSendText({ number, text: part });
    
    // Pausa entre mensagens (se não for a última)
    if (i < parts.length - 1) {
      await sleep(800); // 800ms entre mensagens
    }
  }
}
