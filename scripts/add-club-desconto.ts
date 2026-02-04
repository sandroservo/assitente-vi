import { prisma } from "../src/lib/prisma";

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error("Nenhuma organização encontrada!");
    return;
  }

  const content = `O Amo Vidas possui um Clube de Descontos com parceiros em diversas áreas. Veja os parceiros disponíveis:

**SAÚDE E CLÍNICAS:**
- **Citoclínica** - Consultas e exames (até 40% de desconto)
- **CROI - Centro de Radiologia de Imperatriz** - Exames de imagem (até 80% de desconto)
- **ICM - Instituto de Cuidado Mental** - Psicologia, Psiquiatria e Terapias (até 50% de desconto)
- **CLINICA FEMINA** - Ginecologia em Imperatriz (até 30% de desconto)
- **Neuroclin** - Neurodesenvolvimento e Psicologia (até 60% de desconto)
- **AGAPE** - Psicologia, Psicopedagoga, Nutrição Infantil, Fonoaudióloga, Psicomotricidade, Musicoterapia (até 40% de desconto)

**ODONTOLOGIA:**
- **Dentistas do Trabalhador** - Imperatriz (até 50% de desconto)

**FARMÁCIAS:**
- **Farmacia Zero Hora - Imperatriz** - Até 15% em referência, até 70% em genéricos/similar, até 10% em perfumaria
- **Hiper Popular - São Pedro Água Branca** - Medicamentos e produtos (até 50% de desconto)
- **Martins Farma - São Pedro Água Branca** - Medicamentos (até 50% de desconto)

**ORTOPEDIA:**
- **Ortomed - Imperatriz** - Produtos ortopédicos (até 50% de desconto)

**BEM-ESTAR E ESTÉTICA:**
- **Liffe Fitness - Imperatriz** - Academia (até 40% de desconto)
- **Italo Barber - Imperatriz** - Barbearia (até 30% serviços / 20% produtos)
- **St. Bryte's Barber Club - Imperatriz** - Barbearia (até 30% de desconto)
- **AMIVI COSMÉTICOS - Imperatriz** - Cosméticos (até 50% de desconto)

**TECNOLOGIA:**
- **King Phone - Imperatriz** - Celulares e acessórios (até 30% de desconto)

Os descontos são exclusivos para membros do Amo Vidas e podem variar conforme o parceiro.`;

  const result = await prisma.knowledge.upsert({
    where: { id: "club_desconto_001" },
    update: {
      content,
      updatedAt: new Date(),
    },
    create: {
      id: "club_desconto_001",
      category: "faq",
      title: "Clube de Descontos - Parceiros Amo Vidas",
      content,
      keywords: "clube,desconto,parceiro,farmácia,clínica,odontologia,academia,barbearia,cosméticos,tecnologia,saúde,ortopedia,psicologia",
      organizationId: org.id,
    },
  });

  console.log("Conhecimento inserido:", result.title);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
