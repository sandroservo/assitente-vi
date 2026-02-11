/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReportsView } from "./ui/ReportsView";

export default async function ReportsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Busca usuários da organização
  const users = await prisma.user.findMany({
    where: { 
      organizationId: session.user.organizationId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // Busca estatísticas de atendimentos por usuário (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const handoffs = await prisma.handoff.findMany({
    where: {
      lead: {
        organizationId: session.user.organizationId,
      },
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      lead: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Busca total de leads por status
  const leadsByStatus = await prisma.lead.groupBy({
    by: ["status"],
    where: {
      organizationId: session.user.organizationId,
    },
    _count: true,
  });

  // Busca total de mensagens por direção (últimos 30 dias)
  const messages = await prisma.message.groupBy({
    by: ["direction"],
    where: {
      conversation: {
        lead: {
          organizationId: session.user.organizationId,
        },
      },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: true,
  });

  // Calcula estatísticas por usuário
  const userStats = users.map((user: typeof users[number]) => {
    const userHandoffs = handoffs.filter((h: typeof handoffs[number]) => h.assignedToId === user.id);
    const completed = userHandoffs.filter((h: typeof handoffs[number]) => h.status === "closed").length;
    
    return {
      ...user,
      totalHandoffs: userHandoffs.length,
      completedHandoffs: completed,
      pendingHandoffs: userHandoffs.length - completed,
    };
  });

  const stats = {
    totalLeads: leadsByStatus.reduce((acc: number, curr: typeof leadsByStatus[number]) => acc + curr._count, 0),
    leadsByStatus: leadsByStatus.map((l: typeof leadsByStatus[number]) => ({
      status: l.status,
      count: l._count,
    })),
    messagesIn: messages.find((m: typeof messages[number]) => m.direction === "in")?._count || 0,
    messagesOut: messages.find((m: typeof messages[number]) => m.direction === "out")?._count || 0,
    totalHandoffs: handoffs.length,
    completedHandoffs: handoffs.filter((h: typeof handoffs[number]) => h.status === "closed").length,
  };

  return (
    <div className="p-4 pt-14 md:p-6 md:pt-6">
      <ReportsView 
        userStats={userStats}
        stats={stats}
      />
    </div>
  );
}
