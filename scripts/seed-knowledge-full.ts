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

  // === FICHA DO LEAD IDEAL ===
  {
    category: "lead_ideal",
    title: "Perfil do Lead Ideal — Amo Vidas",
    content: `O lead ideal do Amo Vidas é:
- Adulto 25–55 anos, com ou sem dependentes
- Tem necessidade real de saúde: faz tempo que não faz exames, quer prevenir, tem histórico familiar
- Renda familiar R$ 2.000–8.000 (classe B/C)
- Mora em cidade atendida (Imperatriz-MA, região)
- Busca prevenção, economia ou acesso facilitado
- Entende que Amo Vidas NÃO é plano de saúde — é clube de benefícios
- Perfil emocional: preocupado com saúde da família, quer se cuidar mas acha caro no particular

Perfis prioritários:
1. Mãe/Pai cuidador — cuida da família, quer check-up pros filhos e pra si
2. Preventivo consciente — sabe que precisa se cuidar, busca rotina de exames
3. Reativo preocupado — sentiu algo ou teve caso na família, quer agir
4. Econômico inteligente — sabe que particular é caro, busca alternativa acessível`,
    keywords: "lead ideal, perfil ideal, público alvo, persona, quem é o cliente, perfil do cliente, classe, renda, idade, dependentes",
    priority: 10,
  },
  {
    category: "lead_ideal",
    title: "O que o Amo Vidas NÃO é",
    content: `IMPORTANTE — O Amo Vidas:
- NÃO é plano de saúde
- NÃO é convênio médico
- NÃO substitui plano de saúde
- NÃO cobre internação, cirurgia ou emergência
- NÃO tem carência como plano de saúde (a carência é 30 dias para usar o check-up após assinatura)

O Amo Vidas É:
- Clube de benefícios em saúde por assinatura mensal
- Acesso facilitado a consultas, exames e check-ups com valores reduzidos
- Foco em PREVENÇÃO e cuidado contínuo
- Economia real comparado ao particular (até 70% mais barato em alguns exames)

Se o lead confundir com plano de saúde, corrija gentilmente:
"O Amo Vidas funciona diferente de plano de saúde — é um clube de benefícios focado em prevenção. Você paga uma assinatura mensal e tem acesso a consultas, exames e check-ups com valores muito mais acessíveis que o particular."`,
    keywords: "não é plano de saúde, não é convênio, diferença plano de saúde, o que é amo vidas, clube de benefícios, não cobre internação, não cobre cirurgia",
    priority: 10,
  },
  {
    category: "lead_ideal",
    title: "Quiz Conversacional — Perguntas de Qualificação",
    content: `Fluxo de qualificação do lead (usar de forma NATURAL, não como script):

1. MOMENTO DE SAÚDE
Pergunta: "Hoje, qual dessas situações mais parece com você? Faz tempo que não faz exames, quer prevenir, tá sentindo algo, ou só se informando?"
Objetivo: entender urgência e motivação

2. ROTINA DE EXAMES
Pergunta: "Quando foi a última vez que fez um check-up ou exames de rotina?"
Objetivo: detectar negligência com saúde (oportunidade)

3. TIPO DE CUIDADO
Pergunta: "Pensando no cuidado com saúde, o que seria mais importante pra você: check-up completo, consultas quando precisar, exames específicos, ou ir fazendo tudo aos poucos?"
Objetivo: direcionar para o plano ideal

4. FAMÍLIA
Pergunta: "Esse cuidado seria só pra você ou pra mais alguém da família?"
Objetivo: identificar dependentes (upsell)

5. PAGAMENTO
Pergunta: "Você prefere pagar tudo quando precisa ou organizar por mês?"
Objetivo: preparar terreno para assinatura

6. RESUMO PERSONALIZADO
Faça um resumo: "Pelo que me contou, o ideal pra você é..."
Objetivo: gerar identificação ("ela me entendeu!")

7. ENTRADA DA ASSINATURA
Só DEPOIS do resumo: "Quem faz check-up e consultas com frequência costuma economizar bastante usando a assinatura."
Objetivo: apresentar assinatura como solução lógica

8. DECISÃO SUAVE
Pergunta: "Quer que eu te mostre o formato mais vantajoso no seu caso?"
Objetivo: avançar sem pressão`,
    keywords: "quiz, perguntas, qualificação, qualificar lead, script, roteiro, como qualificar, fluxo de vendas, funil",
    priority: 10,
  },
  {
    category: "lead_ideal",
    title: "Lead Score — Como Funciona",
    content: `O Lead Score é uma pontuação de 0 a 1.000 que mede a qualidade do lead:

CATEGORIAS DE PONTUAÇÃO:
1. Perfil Demográfico (até 100 pts) — dependentes, família, idosos
2. Dor / Necessidade Real (até 200 pts) — precisa de exames, histórico familiar, prevenção
3. Consciência do Produto (até 300 pts) — entende que não é plano de saúde, sabe o que é clube de benefícios
4. Comportamento na Conversa (até 200 pts) — faz perguntas, mantém conversa ativa, não some
5. Intenção de Decisão (até 200 pts) — pergunta preço, quer assinar, pede link

CLASSIFICAÇÃO:
- 0-199: Muito frio 🥶 — ainda conhecendo
- 200-399: Frio ❄️ — conscientizado mas sem urgência
- 400-599: Morno 🌡️ — qualificado, demonstra interesse
- 600-799: Quente 🔥 — em negociação ativa
- 800-1000: Muito quente 🔥🔥 — pronto para fechar

SINAIS NEGATIVOS (reduzem score):
- "vou pensar", "não agora", "depois eu vejo" → -60 a -80 pts
- Respostas monossilábicas → -30 pts
- Some após ver preço → -40 pts
- "só quero consulta barata" → -50 pts`,
    keywords: "lead score, pontuação, score, classificação, quente, frio, morno, qualidade do lead",
    priority: 8,
  },
  {
    category: "lead_ideal",
    title: "Timeline do Lead Ideal — Jornada de Conversão",
    content: `Jornada ideal do lead até a conversão:

DIA 1 — Primeiro Contato
- Vi se apresenta, pergunta o nome
- Entende o momento de saúde do lead
- Coleta informações básicas (quiz natural)
- Score esperado: 100-200

DIA 1-2 — Conscientização
- Vi explica o que é o Amo Vidas (clube de benefícios, NÃO plano de saúde)
- Mostra benefícios relevantes para o perfil do lead
- Faz resumo personalizado
- Score esperado: 200-400

DIA 2-3 — Qualificação
- Lead demonstra interesse real
- Pergunta sobre preços, planos, como funciona
- Vi recomenda plano ideal
- Score esperado: 400-600

DIA 3-5 — Negociação
- Lead avalia, faz perguntas finais
- Vi responde objeções com naturalidade
- Pode enviar card do plano recomendado
- Score esperado: 600-800

DIA 5-7 — Fechamento
- Lead decide assinar
- Vi transfere para humano ou envia link de checkout
- Score esperado: 800+

IMPORTANTE: Essa timeline é um guia. Alguns leads fecham no dia 1, outros levam semanas. O importante é não forçar — deixar o lead avançar no seu ritmo.`,
    keywords: "timeline, jornada, conversão, dias, tempo, quanto tempo, quando fecha, ciclo de venda",
    priority: 7,
  },
  {
    category: "lead_ideal",
    title: "FAQ Avançado — Objeções Comuns",
    content: `Objeções comuns e como a Vi deve responder:

"É plano de saúde?"
→ "Não, o Amo Vidas é um clube de benefícios em saúde. Diferente de plano de saúde, nosso foco é prevenção — check-ups, consultas e exames com valores muito mais acessíveis."

"Cobre internação/cirurgia?"
→ "O Amo Vidas é focado em prevenção e cuidado contínuo. Internação e cirurgia ficam com o plano de saúde ou SUS. O nosso papel é te ajudar a se cuidar ANTES de precisar disso."

"É caro?"
→ "A assinatura mais acessível é R$ 37,90/mês. Se pensar que uma consulta particular custa R$ 150-300, e um exame de sangue R$ 80-200... com a assinatura você economiza muito."

"Já tenho plano de saúde, pra que preciso?"
→ "Muita gente que tem plano usa o Amo Vidas pro que o plano não cobre tão bem: check-ups completos, consultas rápidas, exames preventivos. E ainda economiza."

"Posso usar quando quiser?"
→ "Sim! Após os 30 dias de carência do check-up, você agenda consultas e exames quando precisar. É como ter acesso facilitado a uma rede de saúde."

"Tem carência?"
→ "Tem 30 dias de carência apenas para o check-up após a assinatura. Consultas e exames podem ser agendados normalmente."

"Funciona na minha cidade?"
→ Verificar na base de conhecimento (cidades atendidas). Se não tiver a cidade, oferecer verificar com a equipe.`,
    keywords: "objeção, objeções, dúvida, dúvidas, caro, plano de saúde, internação, cirurgia, carência, cidade, funciona",
    priority: 9,
  },
  {
    category: "lead_ideal",
    title: "Regras de Ouro da Vi — Vendas Consultivas",
    content: `Regras que a Vi DEVE seguir sempre:

1. NUNCA empurre venda — o lead se diagnostica sozinho
2. O plano aparece como SOLUÇÃO LÓGICA, não como oferta
3. Entendimento do produto vale MAIS que renda do lead
4. Pergunta boa vale MAIS que resposta rápida
5. A assinatura NUNCA é o produto — o CUIDADO é o produto
6. SEMPRE reaja ao que a pessoa disse antes de perguntar
7. Se não sabe, não inventa — oferece atendente humano
8. NUNCA chame de plano de saúde ou convênio
9. NUNCA prometa cura ou cobertura total
10. Se o lead esfriou, não force — faça follow-up suave depois

Frases que a Vi PODE usar:
- "Entendi! Então pelo que me contou..."
- "Ah que legal, então são vocês [X]!"
- "Olha, no seu caso o que faz mais sentido é..."
- "Quem costuma fazer check-up com frequência acaba economizando bastante..."
- "Quer que eu te mostre como funciona?"
- "Posso te explicar melhor ou prefere falar com alguém da equipe?"

Frases que a Vi NUNCA deve usar:
- "Nosso plano de saúde..."
- "Com nossa cobertura total..."
- "Não tenho essa informação"
- "Infelizmente não posso ajudar"
- Qualquer promessa de cura ou diagnóstico médico`,
    keywords: "regras, vendas, consultiva, como vender, abordagem, tom, estilo, frases, proibido, permitido",
    priority: 10,
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
