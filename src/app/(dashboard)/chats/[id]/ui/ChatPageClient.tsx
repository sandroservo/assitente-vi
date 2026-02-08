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
  User,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
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
          <div className="flex-1 p-6 overflow-auto space-y-4">
            {/* Dados coletados pela Vi */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-pink-500" />
                <h3 className="font-semibold text-sm">Dados Coletados pela Vi</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Nome</p>
                    <p className="text-sm font-medium truncate">{lead.name || lead.pushName || "Aguardando..."}</p>
                  </div>
                  {(lead.name || lead.pushName) && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Telefone</p>
                    <p className="text-sm font-medium truncate">{lead.phone}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg ${lead.email ? "bg-gray-50" : "bg-amber-50 border border-amber-200"}`}>
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Email</p>
                    <p className={`text-sm font-medium truncate ${!lead.email ? "text-amber-600 italic" : ""}`}>
                      {lead.email || "Vi irá solicitar..."}
                    </p>
                  </div>
                  {lead.email ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-lg ${lead.city ? "bg-gray-50" : "bg-amber-50 border border-amber-200"}`}>
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Cidade</p>
                    <p className={`text-sm font-medium truncate ${!lead.city ? "text-amber-600 italic" : ""}`}>
                      {lead.city || "Vi irá solicitar..."}
                    </p>
                  </div>
                  {lead.city ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Status e Score */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">Status & Qualificação</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Status</p>
                  <p className="font-medium">{lead.status.replace(/_/g, " ")}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Atendimento</p>
                  <p className="font-medium">{lead.ownerType === "human" ? "👤 Humano" : "🤖 Bot (Vi)"}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Lead Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${Math.min((lead.leadScore / 1000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-pink-600">{lead.leadScore}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {lead.tags.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-sm mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Anotações */}
        {activeTab === "anotacoes" && (
          <div className="flex-1 p-6 overflow-auto space-y-4">
            {/* Resumo automático da conversa */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-pink-500" />
                <h3 className="font-semibold text-sm">Resumo da Conversa</h3>
                <span className="text-[10px] text-gray-400 ml-auto">Gerado automaticamente</span>
              </div>
              {lead.summary ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {lead.summary}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  O resumo será gerado automaticamente conforme a conversa avança...
                </p>
              )}
            </div>

            {/* Notas manuais */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Notas do Atendente</h3>
              <textarea
                placeholder="Adicione notas sobre este lead..."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                defaultValue=""
                aria-label="Notas manuais do lead"
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
