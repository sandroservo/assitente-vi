/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { prisma } from "@/lib/prisma";
import { LeadsKanban } from "./ui";
import { Heart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leadsData = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      conversations: {
        take: 1,
        orderBy: { lastMessageAt: "desc" },
        select: { id: true },
      },
    },
    take: 200,
  });

  const leads = leadsData.map((lead) => ({
    id: lead.id,
    name: lead.name,
    pushName: (lead as { pushName?: string | null }).pushName ?? null,
    phone: lead.phone,
    status: lead.status,
    ownerType: lead.ownerType,
    createdAt: lead.createdAt.toISOString(),
    conversationId: lead.conversations[0]?.id ?? null,
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kanban de Leads</h1>
            <p className="text-gray-500 text-sm">
              Gerencie seus clientes através do funil de vendas
            </p>
          </div>
        </div>
      </div>

      {/* Kanban */}
      <LeadsKanban initialLeads={leads} />
    </div>
  );
}
