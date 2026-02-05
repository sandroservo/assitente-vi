/**
 * Limpa a base de conhecimento e popula a partir do arquivo
 * agent/Infromações amovidas.md
 *
 * Executar: npx tsx scripts/seed-knowledge-from-md.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MD_PATH = join(process.cwd(), "agent", "Infromações amovidas.md");

const SECTION_CATEGORY: Record<string, string> = {
  "1": "visao_geral",
  "2": "conceito",
  "3": "persona",
  "4": "planos",
  "5": "check_ups",
  "6": "consultas",
  "7": "hospitais_urgencia",
  "8": "dependentes",
  "9": "regras",
  "10": "assinar",
  "11": "links",
  "12": "locais",
  "13": "faq",
};

function cleanTitle(s: string): string {
  return s
    .replace(/^\s*\d+\)\s*/, "")
    .replace(/^\s*\d+\.\d+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\*+$/g, "")
    .replace(/\\/g, "")
    .trim();
}

function extractKeywords(title: string, category: string): string {
  const fromTitle = title
    .toLowerCase()
    .replace(/[^\w\sàáâãäéèêëíìîïóòôõöúùûüç]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 10)
    .join(", ");
  return [category, fromTitle].filter(Boolean).join(", ");
}

interface Block {
  category: string;
  title: string;
  content: string;
  priority: number;
}

function parseMarkdown(content: string): Block[] {
  const blocks: Block[] = [];
  const lines = content.split("\n");
  let current: { level: "h2" | "h3"; num: string; title: string; lines: string[] } | null = null;
  let priority = 25;

  function flush() {
    if (!current) return;
    const body = current.lines
      .join("\n")
      .replace(/^---\s*$/gm, "")
      .trim();
    if (body.length < 3) return;
    const catNum = current.num.split(".")[0] ?? current.num;
    const category = SECTION_CATEGORY[catNum] ?? "geral";
    blocks.push({
      category,
      title: cleanTitle(current.title),
      content: body,
      priority: current.level === "h2" ? priority-- : priority,
    });
  }

  for (const line of lines) {
    const h2 = line.match(/^## \*\*?(.+)\*\*?\s*$/);
    const h3 = line.match(/^### \*\*?(.+)\*\*?\s*$/);
    if (h2) {
      flush();
      const raw = (h2[1] ?? "").replace(/\\/g, "");
      const numMatch = raw.match(/^(\d+)(?:\.(\d+))?\)?\s*(.*)$/s);
      const num = numMatch ? (numMatch[2] ? `${numMatch[1]}.${numMatch[2]}` : numMatch[1] ?? "0") : "0";
      const title = numMatch ? (numMatch[3] ?? raw).trim() : raw.trim();
      current = { level: "h2", num, title, lines: [] };
      continue;
    }
    if (h3) {
      flush();
      const raw = (h3[1] ?? "").replace(/\\/g, "");
      const numMatch = raw.match(/^(\d+\.\d+)?\s*(.*)$/s);
      const num = numMatch && numMatch[1] ? numMatch[1] : (current?.num.split(".")[0] ?? "0");
      const title = numMatch && numMatch[2] !== undefined ? numMatch[2].trim() : raw.trim();
      current = { level: "h3", num, title, lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  flush();
  return blocks;
}

async function main() {
  const org = await prisma.organization.findFirst({
    where: { slug: { in: ["amo-vidas", "amovidas"] } },
  });

  if (!org) {
    console.error("Nenhuma organização encontrada (slug: amo-vidas ou amovidas).");
    process.exit(1);
  }

  console.log(`Organização: ${org.name} (${org.slug})`);
  console.log("Limpando base de conhecimento...");
  await prisma.knowledge.deleteMany({ where: { organizationId: org.id } });

  const raw = readFileSync(MD_PATH, "utf-8");
  const entries = parseMarkdown(raw);

  if (entries.length === 0) {
    console.log("Nenhum bloco encontrado no MD. Verifique o formato (## e ###).");
    process.exit(1);
  }

  console.log(`Populando a partir de ${MD_PATH}...\n`);

  for (const item of entries) {
    await prisma.knowledge.create({
      data: {
        organizationId: org.id,
        category: item.category,
        title: item.title,
        content: item.content,
        keywords: extractKeywords(item.title, item.category),
        priority: item.priority,
        active: true,
      },
    });
    console.log(`✓ [${item.category}] ${item.title}`);
  }

  console.log(`\n✅ ${entries.length} conhecimentos criados!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
