/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { prisma } from "@/lib/prisma";
import { LeadsKanban } from "@/app/(dashboard)/leads/ui/LeadsKanban";

export default async function KanbanPage() {
  const leadsData = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 1,
      },
    },
  });

  const leads = leadsData.map((lead) => ({
    id: lead.id,
    name: lead.name,
    pushName: lead.pushName,
    phone: lead.phone,
    status: lead.status,
    ownerType: lead.ownerType,
    createdAt: lead.createdAt.toISOString(),
    conversationId: lead.conversations[0]?.id || null,
  }));

  return (
    <div className="p-6 space-y-6 h-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tarefas</h1>
        <p className="text-gray-500">
          Gerencie seus leads no formato Kanban
        </p>
      </div>

      <LeadsKanban initialLeads={leads} />
    </div>
  );
}
