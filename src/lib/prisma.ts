/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

export type LeadStatus =
  | "NOVO"
  | "EM_ATENDIMENTO"
  | "QUALIFICADO"
  | "LEAD_FRIO"
  | "PROPOSTA_ENVIADA"
  | "EM_NEGOCIACAO"
  | "AGUARDANDO_RESPOSTA"
  | "FECHADO"
  | "PERDIDO"
  | "HUMANO_SOLICITADO"
  | "HUMANO_EM_ATENDIMENTO";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  
  // Durante build, DATABASE_URL pode não estar disponível
  if (!connectionString) {
    // Cria pool com string vazia - só será usado em runtime quando DATABASE_URL existir
    const pool = new Pool({ connectionString: "postgresql://localhost:5432/dummy" });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
