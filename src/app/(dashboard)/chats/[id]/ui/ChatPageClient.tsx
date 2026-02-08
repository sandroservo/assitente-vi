/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Client component principal da conversa — orquestra header, tabs, chat, composer e lead sidebar
 */

"use client";

import { useState } from "react";
import {
  Bot,
  UserCheck,
  PanelRightOpen,
  PanelRightClose,
  Phone,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import InboxConversation from "./InboxConversation";
import ChatComposer from "./ChatComposer";
import LeadSidebar from "./LeadSidebar";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Lead {
  id: string;
  name: string | null;
  pushName: string | null;
  avatarUrl: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  status: string;
  ownerType: string;
  leadScore: number;
  summary: string | null;
  tags: Tag[];
}

interface ChatPageClientProps {
  conversationId: string;
  lead: Lead;
  initialMessages: Array<{
    id: string;
    body: string | null;
    type?: string;
    direction: string;
    createdAt: Date;
    sentByUserName?: string | null;
  }>;
}

function getInitials(name: string | null, phone: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return phone.slice(-2);
}

function getScoreColor(score: number): string {
  if (score >= 800) return "bg-red-500";
  if (score >= 600) return "bg-orange-500";
  if (score >= 400) return "bg-yellow-500";
  if (score >= 200) return "bg-blue-400";
  return "bg-gray-400";
}

function getStatusBadge(status: string, ownerType: string) {
  if (ownerType === "human") {
    return { label: "Atendimento Humano", className: "bg-purple-100 text-purple-700" };
  }
  const map: Record<string, { label: string; className: string }> = {
    NOVO: { label: "Novo", className: "bg-blue-100 text-blue-700" },
    EM_ATENDIMENTO: { label: "Em Atendimento", className: "bg-yellow-100 text-yellow-700" },
    CONSCIENTIZADO: { label: "Conscientizado", className: "bg-cyan-100 text-cyan-700" },
    QUALIFICADO: { label: "Qualificado", className: "bg-green-100 text-green-700" },
    PROPOSTA_ENVIADA: { label: "Proposta Enviada", className: "bg-purple-100 text-purple-700" },
    EM_NEGOCIACAO: { label: "Em Negociação", className: "bg-orange-100 text-orange-700" },
    HUMANO_SOLICITADO: { label: "Aguardando Humano", className: "bg-orange-100 text-orange-700" },
    FECHADO: { label: "Fechado", className: "bg-emerald-100 text-emerald-700" },
    PERDIDO: { label: "Perdido", className: "bg-red-100 text-red-700" },
  };
  return map[status] || { label: status.replace(/_/g, " "), className: "bg-gray-100 text-gray-700" };
}

export default function ChatPageClient({
  conversationId,
  lead: initialLead,
  initialMessages,
}: ChatPageClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("conversa");
  const [lead, setLead] = useState(initialLead);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [parouResponderLoading, setParouResponderLoading] = useState(false);

  const displayName = lead.name || lead.pushName || "Sem nome";
  const badge = getStatusBadge(lead.status, lead.ownerType);

  async function handleHandoff() {
    setHandoffLoading(true);
    try {
      const endpoint =
        lead.ownerType === "human"
          ? `/api/leads/${lead.id}/return-to-bot`
          : `/api/leads/${lead.id}/handoff`;
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        alert("Erro ao alterar atendimento");
        return;
      }
      setLead((prev) => ({
        ...prev,
        ownerType: prev.ownerType === "human" ? "bot" : "human",
      }));
    } catch {
      alert("Erro ao alterar atendimento");
    } finally {
      setHandoffLoading(false);
    }
  }

  async function handleParouResponder() {
    setParouResponderLoading(true);
    try {
      const res = await fetch("/api/followups/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, conversationId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Erro ao agendar");
        return;
      }
      if (data.message === "followups already scheduled") {
        alert("Já existem lembretes agendados para este lead.");
      } else {
        alert("Lead marcado como Aguardando resposta. Lembretes da Vi agendados para 24h, 48h, 72h e 120h.");
      }
    } catch {
      alert("Erro ao marcar cliente parou de responder");
    } finally {
      setParouResponderLoading(false);
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {lead.avatarUrl ? (
              <img
                src={lead.avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-medium">
                {getInitials(lead.name || lead.pushName, lead.phone)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{displayName}</h2>
                <Badge className={cn("text-xs", badge.className)}>
                  {badge.label}
                </Badge>
                {lead.leadScore > 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white",
                      getScoreColor(lead.leadScore)
                    )}
                    title={`Lead Score: ${lead.leadScore}`}
                  >
                    {lead.leadScore}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleHandoff}
              disabled={handoffLoading}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50",
                lead.ownerType === "human"
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              )}
              title={lead.ownerType === "human" ? "Devolver para Vi" : "Assumir atendimento"}
            >
              {lead.ownerType === "human" ? (
                <span className="flex items-center gap-1"><Bot className="h-3.5 w-3.5" /> Devolver p/ Vi</span>
              ) : (
                <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> Assumir</span>
              )}
            </button>
            <button
              onClick={handleParouResponder}
              disabled={parouResponderLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50"
              title="Marcar como parou de responder"
            >
              ⏳ Parou responder
            </button>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
              title={sidebarOpen ? "Fechar detalhes" : "Abrir detalhes do lead"}
              aria-label={sidebarOpen ? "Fechar detalhes" : "Abrir detalhes do lead"}
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white flex-shrink-0">
          <div className="flex border-b border-gray-200">
            {[
              { key: "conversa", label: "Conversa" },
              { key: "detalhes", label: "Detalhes" },
              { key: "anotacoes", label: "Anotações" },
              { key: "historico", label: "Histórico" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors relative",
                  activeTab === tab.key
                    ? "text-pink-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Conversa */}
        {activeTab === "conversa" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <InboxConversation
              conversationId={conversationId}
              initialMessages={initialMessages}
            />
            <ChatComposer conversationId={conversationId} />
          </div>
        )}

        {/* Tab: Detalhes */}
        {activeTab === "detalhes" && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold">Informações do Lead</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Nome</p>
                  <p className="font-medium">{lead.name || lead.pushName || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Telefone</p>
                  <p className="font-medium">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{lead.email || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cidade</p>
                  <p className="font-medium">{lead.city || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium">{lead.status.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-gray-500">Atendimento</p>
                  <p className="font-medium">
                    {lead.ownerType === "human" ? "Humano" : "Bot (Vi)"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Lead Score</p>
                  <p className="font-medium">{lead.leadScore} / 1.000</p>
                </div>
              </div>
              {lead.summary && (
                <div>
                  <p className="text-gray-500 text-sm">Resumo</p>
                  <p className="text-sm mt-1">{lead.summary}</p>
                </div>
              )}
              {lead.tags.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tag.color + "20", color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Anotações */}
        {activeTab === "anotacoes" && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Anotações</h3>
              <textarea
                placeholder="Adicione notas sobre este lead..."
                className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                defaultValue=""
                aria-label="Anotações do lead"
              />
            </div>
          </div>
        )}

        {/* Tab: Histórico */}
        {activeTab === "historico" && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Histórico de Interações</h3>
              <p className="text-gray-500 text-sm">
                {initialMessages.length} mensagens trocadas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lead sidebar */}
      <LeadSidebar
        lead={lead}
        conversationId={conversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
