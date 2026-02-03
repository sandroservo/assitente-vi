/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Clock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [leadsCount, conversationsCount, pendingCount] = await Promise.all([
    prisma.lead.count(),
    prisma.conversation.count(),
    prisma.lead.count({ where: { status: "NOVO" } }),
  ]);

  const stats = [
    {
      title: "Total de Leads",
      value: leadsCount,
      icon: Users,
      gradient: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-500/25",
    },
    {
      title: "Conversas",
      value: conversationsCount,
      icon: MessageSquare,
      gradient: "from-emerald-500 to-teal-400",
      shadow: "shadow-emerald-500/25",
    },
    {
      title: "Novos Leads",
      value: pendingCount,
      icon: Clock,
      gradient: "from-amber-500 to-orange-400",
      shadow: "shadow-amber-500/25",
    },
    {
      title: "Taxa de Conversão",
      value: leadsCount > 0 ? `${Math.round((conversationsCount / leadsCount) * 100)}%` : "0%",
      icon: TrendingUp,
      gradient: "from-pink-500 to-purple-500",
      shadow: "shadow-pink-500/25",
    },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Home &gt; Dashboard</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.slice(0, 3).map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Clientes ativos</h2>
            <button className="px-4 py-2 bg-[#FE3E6E] text-white text-sm font-medium rounded-lg hover:bg-[#C24695] transition-colors">
              + Add novo cliente
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Users className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">Gráfico de clientes aparecerá aqui</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Atendimento</h2>
            <select className="text-sm text-gray-500 bg-transparent border-none outline-none">
              <option>Todos</option>
            </select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">Cliente Exemplo</p>
                <p className="text-xs text-gray-500">Aguardando atendimento</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#FE3E6E] text-white">
                Novo
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">Outro Cliente</p>
                <p className="text-xs text-gray-500">Em atendimento</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#7151C9] text-white">
                Lead
              </span>
            </div>
          </div>
          <button className="w-full mt-4 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Ir para atendimento
          </button>
        </div>
      </div>
    </div>
  );
}
