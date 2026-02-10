/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  UserCheck,
  MessageCircle,
  Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserStat {
  id: string;
  name: string;
  email: string;
  role: string;
  totalHandoffs: number;
  completedHandoffs: number;
  pendingHandoffs: number;
}

interface LeadByStatus {
  status: string;
  count: number;
}

interface Stats {
  totalLeads: number;
  leadsByStatus: LeadByStatus[];
  messagesIn: number;
  messagesOut: number;
  totalHandoffs: number;
  completedHandoffs: number;
}

interface ReportsViewProps {
  userStats: UserStat[];
  stats: Stats;
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "Novo",
  EM_ATENDIMENTO: "Em Atendimento",
  QUALIFICADO: "Qualificado",
  LEAD_FRIO: "Lead Frio",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
  HUMANO_SOLICITADO: "Aguardando Humano",
};

const STATUS_COLORS: Record<string, string> = {
  NOVO: "bg-pink-100 text-pink-700",
  EM_ATENDIMENTO: "bg-orange-100 text-orange-700",
  QUALIFICADO: "bg-blue-100 text-blue-700",
  LEAD_FRIO: "bg-slate-100 text-slate-700",
  FECHADO: "bg-green-100 text-green-700",
  PERDIDO: "bg-red-100 text-red-700",
  HUMANO_SOLICITADO: "bg-yellow-100 text-yellow-700",
};

export function ReportsView({ userStats, stats }: ReportsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-gray-500">Visão geral dos atendimentos (últimos 30 dias)</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FE3E6E] to-[#C24695] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Leads</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalLeads}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mensagens Recebidas</p>
              <p className="text-2xl font-bold text-gray-800">{stats.messagesIn}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mensagens Enviadas</p>
              <p className="text-2xl font-bold text-gray-800">{stats.messagesOut}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transferências</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.completedHandoffs}/{stats.totalHandoffs}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leads por status */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#FE3E6E]" />
          Leads por Status
        </h2>
        <div className="flex flex-wrap gap-3">
          {stats.leadsByStatus.map((item) => (
            <div 
              key={item.status}
              className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2"
            >
              <Badge className={cn("text-xs", STATUS_COLORS[item.status])}>
                {STATUS_LABELS[item.status] || item.status}
              </Badge>
              <span className="text-lg font-bold text-gray-800">{item.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Desempenho por usuário */}
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#FE3E6E]" />
          Desempenho por Usuário
        </h2>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-center">Atendimentos</TableHead>
              <TableHead className="text-center">Concluídos</TableHead>
              <TableHead className="text-center">Pendentes</TableHead>
              <TableHead className="text-center">Taxa de Conclusão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userStats.map((user) => {
              const completionRate = user.totalHandoffs > 0 
                ? Math.round((user.completedHandoffs / user.totalHandoffs) * 100)
                : 0;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {user.role === "OWNER" ? "Proprietário" : 
                       user.role === "ADMIN" ? "Administrador" : 
                       user.role === "AGENT" ? "Atendente" : "Visualizador"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {user.totalHandoffs}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      {user.completedHandoffs}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-orange-600">
                      <Clock className="w-4 h-4" />
                      {user.pendingHandoffs}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            completionRate >= 70 ? "bg-green-500" :
                            completionRate >= 40 ? "bg-yellow-500" : "bg-red-500"
                          )}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{completionRate}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {userStats.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
