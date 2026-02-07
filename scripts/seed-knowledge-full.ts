/**
 * Script para popular base de conhecimento com dados completos do Amo Vidas
 * Executar com: npx tsx scripts/seed-knowledge-full.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const KNOWLEDGE_DATA = [
  // === PLANOS ===
  {
    category: "planos",
    title: "Plano Rotina - R$ 37,90/mês",
    content: `Valor: R$ 37,90/mês

Foco: Cuidado de rotina (preventivo)

Inclui:
- Exames básicos de rotina + exames específicos (hormonais, vitaminas, imunológicos)
- 182 tipos de exames incluídos
- 3x por ano: Check-up + Consulta (clínico geral/médico da família)
- Desconto com redes parceiras

Check-ups disponíveis (4):
1. Homem
2. Mulher
3. Infantil
4. Rotina

Importante: Não tem check-up do idoso neste plano.`,
    keywords: "rotina, 37,90, básico, 182 exames, preventivo, clínico geral",
    priority: 10,
  },
  {
    category: "planos",
    title: "Plano Especializado - R$ 57,90/mês",
    content: `Valor: R$ 57,90/mês

Inclui:
- Tudo do Plano Rotina + exames especializados
- Mais de 1.000 tipos de exames incluídos
- 3x por ano: Check-up + Consulta (clínico geral/médico da família)
- Desconto com redes parceiras

Exceções (não inclui): toxicológico e exame genético

Check-ups disponíveis (8):
1. Homem
2. Mulher
3. Infantil
4. Rotina
5. Idoso (60+)
6. Pré-natal (perfil padrão)
7. Imunidade
8. Diabético`,
    keywords: "especializado, 57,90, 1000 exames, idoso, pré-natal, imunidade, diabético",
    priority: 10,
  },
  {
    category: "planos",
    title: "Plano Cobertura Total - R$ 97,00/mês",
    content: `Valor: R$ 97,00/mês

Inclui:
- Mais de 5.000 tipos de exames incluídos
- 3x por ano: Check-up + Consulta (clínico geral/médico da família)
- 1 consulta clínica por mês
- 1 ultrassonografia + 1 eletrocardiograma por mês
- Exame de DNA (apenas para o assinante) + Toxicológico
- Desconto com redes parceiras

Check-ups disponíveis (10):
1. Homem
2. Mulher
3. Infantil
4. Rotina
5. Idoso (60+)
6. Pré-natal
7. Imunidade
8. Diabético
9. Cardíaco
10. Vermelho`,
    keywords: "cobertura total, 97,00, 5000 exames, DNA, toxicológico, cardíaco, vermelho, completo",
    priority: 10,
  },

  // === DEPENDENTES ===
  {
    category: "planos",
    title: "Tabela de Dependentes",
    content: `Regra: até 3 dependentes, apenas parentesco de 1º grau.

PLANO ROTINA:
- Assinante: R$ 37,90
- Dependente 1: R$ 27,90
- Dependente 2: R$ 17,90
- Dependente 3: R$ 7,90
- Total (assinante + 3): R$ 91,60

PLANO ESPECIALIZADO:
- Assinante: R$ 57,90
- Dependente 1: R$ 47,90
- Dependente 2: R$ 37,90
- Dependente 3: R$ 27,90
- Total (assinante + 3): R$ 146,60

PLANO COBERTURA TOTAL:
- Assinante: R$ 97,00
- Dependente 1: R$ 87,00
- Dependente 2: R$ 77,00
- Dependente 3: R$ 67,00
- Total (assinante + 3): R$ 328,00`,
    keywords: "dependente, família, 1º grau, desconto, filho, esposa, marido",
    priority: 9,
  },

  // === CHECK-UPS ===
  {
    category: "check-ups",
    title: "Check-up do Homem",
    content: `Exames incluídos:
- Monitoramento da diabetes
- Perfil hepático (fígado)
- Rins
- Fezes e urinas
- Processo anêmico
- PSA (próstata)

Disponível em: Todos os planos`,
    keywords: "homem, masculino, próstata, PSA, fígado",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up da Mulher",
    content: `Exames incluídos:
- Monitoramento da diabetes
- Perfil hepático (fígado)
- Rins
- Fezes e urinas
- Processo anêmico
- Preventivo

Disponível em: Todos os planos`,
    keywords: "mulher, feminino, preventivo, ginecológico",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up Infantil",
    content: `Exames incluídos:
- Glicemia
- Hemograma
- Fezes e urina
- Lipidograma

Disponível em: Todos os planos`,
    keywords: "infantil, criança, filho, pediatria",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up de Rotina",
    content: `Exames gerais para "escanear" o paciente.
Avaliação completa do estado de saúde geral.

Disponível em: Todos os planos`,
    keywords: "rotina, geral, básico, escaneamento",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up do Idoso (60+)",
    content: `Check-up específico para pessoas acima de 60 anos.
Exames voltados para as necessidades da terceira idade.

Disponível em: Plano Especializado e Cobertura Total
NÃO disponível no Plano Rotina.`,
    keywords: "idoso, 60 anos, terceira idade, sênior",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up Pré-natal",
    content: `Perfil de exames padrão para gestantes.
Acompanhamento da gravidez.

Disponível em: Plano Especializado e Cobertura Total`,
    keywords: "pré-natal, gravidez, gestante, grávida",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up Imunidade",
    content: `Exames incluídos:
- Hemograma completo
- Vitamina D
- Ferro sérico
- Vitamina C
- Complexo B
- Ferritina

Disponível em: Plano Especializado e Cobertura Total`,
    keywords: "imunidade, vitaminas, ferro, defesa",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up Diabético",
    content: `Exames incluídos:
- Hemograma completo
- Glicemia em jejum
- Hemoglobina glicada
- Colesterol total, triglicerídeos, HDL, VLDL, LDL

Disponível em: Plano Especializado e Cobertura Total`,
    keywords: "diabético, diabetes, glicemia, açúcar",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up Cardíaco",
    content: `Exames incluídos:
- Hemograma completo
- Lipidograma
- TGO/TGP
- Uréia
- Creatinina
- Troponina
- PCR
- CK / CKMB
- Eletrocardiograma
- Bioimpedância

Disponível APENAS em: Plano Cobertura Total`,
    keywords: "cardíaco, coração, eletrocardiograma, pressão",
    priority: 8,
  },
  {
    category: "check-ups",
    title: "Check-up Vermelho",
    content: `Exames incluídos:
- HIV
- Hepatite C e B
- Sífilis
- Herpes

Disponível APENAS em: Plano Cobertura Total`,
    keywords: "vermelho, HIV, hepatite, sífilis, DST, IST",
    priority: 8,
  },

  // === REGRAS ===
  {
    category: "regras",
    title: "O que NÃO cobre - IMPORTANTE",
    content: `Amo Vidas NÃO é plano de saúde.

NÃO EXISTE cobertura em:
- Hospitais
- Urgência
- Emergência
- Internação

O foco é cuidado de ROTINA, exames e consultas durante o ano, com acesso menos burocrático e valor acessível.

Foque nos benefícios de consultas, exames e check-ups para PREVENÇÃO.`,
    keywords: "não cobre, urgência, emergência, hospital, internação, limitação",
    priority: 10,
  },
  {
    category: "regras",
    title: "Regras de Carência",
    content: `NÃO TEM CARÊNCIA!

Assinou, já pode usar imediatamente.

Observação sobre pedido médico:
- Pedido médico externo é aceito SOMENTE se gerado APÓS a assinatura.`,
    keywords: "carência, prazo, espera, imediato",
    priority: 9,
  },
  {
    category: "regras",
    title: "Permanência e Alterações",
    content: `Permanência mínima: 12 meses

Upgrade: Pode fazer a qualquer momento
Downgrade: Somente após 6 meses

Consulta avulsa: Quando o paciente já usou as 3 consultas do check-up, pode pagar consulta avulsa com desconto.`,
    keywords: "permanência, fidelidade, upgrade, downgrade, trocar plano",
    priority: 8,
  },
  {
    category: "regras",
    title: "Idade e Requisitos",
    content: `Idade mínima para assinar: 18 anos

Pessoas com 60 anos ou mais podem aderir normalmente, sem restrição de idade.

Para dependentes: apenas parentesco de 1º grau.`,
    keywords: "idade, 18 anos, idoso, requisito, dependente",
    priority: 8,
  },

  // === CONSULTAS ===
  {
    category: "atendimento",
    title: "Consultas Inclusas nos Planos",
    content: `IMPORTANTE: A consulta inclusa NÃO é com médico especialista.

São consultas clínicas com:
- Clínico geral
- Médico da família

Frequência: 3x por ano (junto com check-up)

Plano Cobertura Total: tem 1 consulta clínica adicional por mês.`,
    keywords: "consulta, clínico geral, médico da família, inclusa",
    priority: 9,
  },
  {
    category: "atendimento",
    title: "Especialidades com Desconto",
    content: `Todos os planos têm acesso às especialidades pagando valor com desconto (a partir de 30%):

- Saúde da Família
- Ortopedia
- Nutricionismo
- Pediatria
- Ginecologia
- Psicologia
- Psiquiatria
- Fisioterapia
- Urologia
- Gastroenterologia
- Endoscopista
- Ultrassonografia
- Cardiologia
- Dermatologia
- Neurologia

Valores:
- Consulta clínica: a partir de R$ 49,90
- Especialistas: desconto a partir de 30% conforme tabela do profissional`,
    keywords: "especialista, ortopedia, ginecologia, psicologia, desconto, nutricionista",
    priority: 9,
  },

  // === LINKS ===
  {
    category: "links",
    title: "Links dos Benefícios (Páginas dos Planos)",
    content: `Links para ver detalhes dos planos:

Plano Rotina:
https://amovidas.com.br/beneficios/plano-rotina

Plano Especializado:
https://amovidas.com.br/beneficios/plano-especializado

Plano Cobertura Total:
https://amovidas.com.br/beneficios/cobertura-total`,
    keywords: "link, benefícios, site, plano",
    priority: 9,
  },
  {
    category: "links",
    title: "Link para Assinar",
    content: `Link geral para escolher e assinar um plano:
https://amovidas.com.br/plans

Fluxo: acessar o site, clicar em "peça o seu cartão", escolher plano e concluir cadastro.
Após assinar, já pode usar!`,
    keywords: "assinar, comprar, checkout, cadastro, contratar",
    priority: 9,
  },
  {
    category: "links",
    title: "Links de Checkout (assinar por plano)",
    content: `Links diretos para assinar cada plano:

Plano Rotina: https://amovidas.com.br/checkout/plano-rotina
Plano Especializado: https://amovidas.com.br/checkout/plano-especializado
Cobertura Total: https://amovidas.com.br/checkout/cobertura-total

Quando o lead pedir "link para comprar/assinar" ou "link do plano X para assinar", use o link de checkout do plano correspondente. Para ver benefícios do plano, use os links de benefícios (plano-rotina, plano-especializado, cobertura-total em /beneficios/).`,
    keywords: "checkout, assinar, comprar, link direto, cadastro plano",
    priority: 9,
  },

  // === LOCAIS ===
  {
    category: "atendimento",
    title: "Cidades Atendidas",
    content: `Cidades com atendimento Amo Vidas:

- Imperatriz-MA
- São Pedro da Água Branca-MA
- Vila Nova dos Martírios-MA
- Açailândia-MA
- Abel Figueiredo-PA

Região: Imperatriz-MA (raio ~100 km)

IMPORTANTE: Se o cliente NÃO mora em nenhuma dessas cidades, a Vi deve informar com empatia que por enquanto o atendimento presencial (exames e consultas) está disponível apenas nessas regiões.`,
    keywords: "cidade, Imperatriz, Açailândia, Maranhão, Pará, atendimento",
    priority: 8,
  },
  {
    category: "atendimento",
    title: "Cliente fora da área de atendimento",
    content: `REGRA IMPORTANTE: Se o cliente informar que mora em uma cidade que NÃO está na lista de cidades atendidas (Imperatriz-MA, São Pedro da Água Branca-MA, Vila Nova dos Martírios-MA, Açailândia-MA, Abel Figueiredo-PA), siga estas orientações:

1. ACOLHA com empatia: "Poxa, que pena! Infelizmente ainda não temos atendimento presencial aí na sua cidade."

2. EXPLIQUE que o Amo Vidas está em expansão: "Mas a gente tá crescendo e em breve queremos chegar em mais cidades!"

3. OFEREÇA alternativas:
   - Pergunte se o cliente tem interesse mesmo assim, pois ele pode usar quando estiver de passagem pela região.
   - Informe que pode deixar o contato dele registrado para ser avisado quando o Amo Vidas chegar na cidade dele.

4. NUNCA diga simplesmente "não atendemos" e encerre. Sempre mantenha a conversa aberta e acolhedora.

5. Se o cliente insistir ou quiser saber mais mesmo assim, continue apresentando os planos normalmente — ele pode querer assinar para usar quando visitar a região ou para familiares que moram lá.

Exemplo de resposta:
"Ah, entendi! Infelizmente por enquanto nosso atendimento presencial (exames e consultas) tá disponível em Imperatriz, Açailândia, São Pedro da Água Branca, Vila Nova dos Martírios e Abel Figueiredo. Mas a gente tá em expansão! 💜 Se quiser, posso anotar seu interesse pra te avisar quando chegarmos aí. E se você tiver familiares nessas cidades ou vier visitar a região, já pode aproveitar os benefícios!"`,
    keywords: "fora, outra cidade, não atende, longe, distante, mora em, sou de, moro em, região, expansão, não tem, disponível",
    priority: 10,
  },
  {
    category: "atendimento",
    title: "Unidades de Atendimento",
    content: `Endereços das unidades:

Escritório:
R. Urbano Santos, 155 - Centro

Unidade Imperatriz:
R. Luís Domingues, 774 - Centro, Imperatriz - MA, 65900-245

Unidade São Pedro:
R. Mal. Castelo Branco, 939 B - Centro, São Pedro da Água Branca - MA, 65920-000

Vila Nova dos Martírios:
Av. Rio Branco, 193 - Centro`,
    keywords: "endereço, unidade, escritório, local, onde",
    priority: 8,
  },

  // === PAGAMENTO ===
  {
    category: "pagamento",
    title: "Formas de Pagamento",
    content: `Formas de pagamento aceitas:
- Pix
- Cartão de crédito

O pagamento é mensal e recorrente.`,
    keywords: "pix, cartão, crédito, pagamento, mensal, boleto",
    priority: 8,
  },

  // === FAQ ===
  {
    category: "faq",
    title: "O que é o Amo Vidas?",
    content: `Amo Vidas é um clube de benefícios em saúde.

O que é: Um clube da saúde inovador criado para transformar o acesso à saúde no Brasil, tornando-o mais acessível, preventivo e humanizado.

Propósito: Conectar pessoas, empresas, clínicas, farmácias e profissionais da saúde em uma rede integrada de benefícios.

NÃO é plano de saúde. Não cobre hospital, urgência e emergência.
O foco é PREVENÇÃO: consultas e exames com inclusão conforme plano e descontos.`,
    keywords: "o que é, amo vidas, clube, benefícios, significado",
    priority: 9,
  },
  {
    category: "faq",
    title: "Exemplos de Economia",
    content: `Exemplos de economia com Amo Vidas:

- Consulta ortopédica: R$ 600,00 → R$ 99,00
- Tomografia: R$ 600,00 → R$ 180,00
- Colonoscopia: R$ 1.200,00 → R$ 650,00

Economia real no bolso do associado!`,
    keywords: "economia, desconto, valor, preço, quanto custa",
    priority: 7,
  },
  {
    category: "faq",
    title: "Comparativo de Planos",
    content: `ROTINA (R$ 37,90):
- 182 exames
- 4 check-ups
- Ideal para: rotina básica

ESPECIALIZADO (R$ 57,90):
- 1.000+ exames
- 8 check-ups (inclui idoso, diabético)
- Ideal para: acompanhamento especializado

COBERTURA TOTAL (R$ 97,00):
- 5.000+ exames
- 10 check-ups (inclui cardíaco, vermelho)
- DNA e toxicológico inclusos
- 1 consulta + 1 ultrassom + 1 ECG por mês
- Ideal para: cobertura completa`,
    keywords: "comparar, diferença, qual plano, melhor plano",
    priority: 9,
  },
  {
    category: "faq",
    title: "Parceiros do Clube de Descontos Amo Vidas",
    content: `Parceiros do Clube de Desconto: o Amo Vidas possui um Clube de Descontos com parceiros em diversas áreas. Lista de parceiros:

**SAÚDE E CLÍNICAS:**
- Citoclínica - Consultas e exames (até 40% de desconto)
- CROI - Centro de Radiologia de Imperatriz - Exames de imagem (até 80%)
- ICM - Instituto de Cuidado Mental - Psicologia, Psiquiatria e Terapias (até 50%)
- CLINICA FEMINA - Ginecologia em Imperatriz (até 30%)
- Neuroclin - Neurodesenvolvimento e Psicologia (até 60%)
- AGAPE - Psicologia, Psicopedagoga, Nutrição Infantil, Fonoaudióloga (até 40%)

**ODONTOLOGIA:**
- Dentistas do Trabalhador - Imperatriz (até 50%)

**FARMÁCIAS:**
- Farmacia Zero Hora - Imperatriz (até 15% referência, até 70% genéricos)
- Hiper Popular - São Pedro Água Branca (até 50%)
- Martins Farma - São Pedro Água Branca (até 50%)

**ORTOPEDIA / BEM-ESTAR / ESTÉTICA:**
- Ortomed - Imperatriz - Produtos ortopédicos (até 50%)
- Liffe Fitness - Imperatriz - Academia (até 40%)
- Italo Barber e St. Bryte's Barber Club - Imperatriz - Barbearia (até 30%)
- AMIVI COSMÉTICOS - Imperatriz - Cosméticos (até 50%)

**TECNOLOGIA:**
- King Phone - Imperatriz - Celulares e acessórios (até 30%)

Os descontos são exclusivos para membros do Amo Vidas e podem variar conforme o parceiro.`,
    keywords: "parceiros, parceiros do clube, clube de desconto, quais parceiros, lista de parceiros, farmácia, clínica, odontologia, academia, barbearia, cosméticos, saúde, ortopedia, psicologia, desconto",
    priority: 9,
  },
];

/**
 * Seed único: apaga a base de conhecimento e insere na organização (single-tenant).
 * Executar: npx tsx scripts/seed-knowledge-full.ts
 */
export async function main() {
  let org = await prisma.organization.findFirst({ orderBy: { name: "asc" } });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Amo Vidas", slug: "amovidas" },
    });
    console.log(`Organização criada: ${org.name} (${org.slug})`);
  }

  console.log(`Apagando base de conhecimento antiga...`);
  await prisma.knowledge.deleteMany({});

  console.log(`Inserindo ${KNOWLEDGE_DATA.length} conhecimentos em ${org.name}...\n`);

  for (const item of KNOWLEDGE_DATA) {
    await prisma.knowledge.create({
      data: {
        ...item,
        organizationId: org.id,
      },
    });
    console.log(`  ✓ [${item.category}] ${item.title}`);
  }

  console.log(`\n✅ Concluído: ${KNOWLEDGE_DATA.length} conhecimentos.`);
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
