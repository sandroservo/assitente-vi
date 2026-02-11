/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Componente cliente: lista de contatos com seleção múltipla
 * e disparo em massa via SSE com delay aleatório.
 */

"use client";

import { useState, useRef, useCallback } from "react";
import {
  Search,
  X,
  Send,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Radio,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  status: string;
  category: string;
  leadScore: number;
  tags: Tag[];
  lastMessageAt: string | null;
}

interface BroadcastLog {
  contact: string;
  status: "ok" | "error" | "waiting";
  message?: string;
}

interface ContactsPageClientProps {
  contacts: Contact[];
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

function getInitials(name: string, phone: string): string {
  if (name) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return phone.slice(-2);
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "Novo",
  EM_ATENDIMENTO: "Em Atendimento",
  CONSCIENTIZADO: "Conscientizado",
  QUALIFICADO: "Qualificado",
  LEAD_FRIO: "Lead Frio",
  PROPOSTA_ENVIADA: "Proposta",
  EM_NEGOCIACAO: "Negociação",
  AGUARDANDO_RESPOSTA: "Aguardando",
  FECHADO: "Fechado",
  PERDIDO: "Perdido",
  HUMANO_SOLICITADO: "Humano Solicitado",
  HUMANO_EM_ATENDIMENTO: "Humano",
};

export function ContactsPageClient({ contacts }: ContactsPageClientProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterCategory, setFilterCategory] = useState<string>("todos");

  // Broadcast state
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastImage, setBroadcastImage] = useState<string | null>(null);
  const [broadcastImageName, setBroadcastImageName] = useState<string | null>(null);
  const [broadcastImageMime, setBroadcastImageMime] = useState<string>("image/jpeg");
  const [isSending, setIsSending] = useState(false);
  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);
  const [broadcastProgress, setBroadcastProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [broadcastDone, setBroadcastDone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Filtro
  const filtered = contacts.filter((c) => {
    const matchSearch =
      !search ||
      (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    const matchStatus = filterStatus === "todos" || c.status === filterStatus;
    const matchCategory = filterCategory === "todos" || c.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  // Estatísticas únicas
  const statuses = [...new Set(contacts.map((c) => c.status))];
  const categories = [...new Set(contacts.map((c) => c.category))];

  // Seleção
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  // Imagem
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBroadcastImageName(file.name);
    setBroadcastImageMime(file.type || "image/jpeg");

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove o prefixo data:image/...;base64,
      setBroadcastImage(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearImage = () => {
    setBroadcastImage(null);
    setBroadcastImageName(null);
  };

  // Broadcast via SSE
  const startBroadcast = useCallback(async () => {
    const selected = contacts.filter((c) => selectedIds.has(c.id));
    if (!selected.length || !broadcastMessage.trim()) return;

    setIsSending(true);
    setBroadcastDone(false);
    setBroadcastLogs([]);
    setBroadcastProgress({ sent: 0, failed: 0, total: selected.length });

    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: selected.map((c) => ({
            phone: c.phone,
            name: c.name || c.phone,
          })),
          message: broadcastMessage,
          imageBase64: broadcastImage || undefined,
          imageMimeType: broadcastImageMime || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setBroadcastLogs((prev) => [
          ...prev,
          { contact: "Sistema", status: "error", message: data.error || "Erro ao iniciar disparo" },
        ]);
        setIsSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.replace("data: ", ""));

            if (data.type === "progress") {
              setBroadcastProgress({
                sent: data.sent,
                failed: data.failed,
                total: data.total,
              });
              setBroadcastLogs((prev) => [
                ...prev,
                {
                  contact: data.contact,
                  status: data.status,
                  message: data.error,
                },
              ]);
            } else if (data.type === "waiting") {
              setBroadcastLogs((prev) => [
                ...prev,
                {
                  contact: "⏳",
                  status: "waiting",
                  message: data.message,
                },
              ]);
            } else if (data.type === "done") {
              setBroadcastProgress({
                sent: data.sent,
                failed: data.failed,
                total: data.total,
              });
              setBroadcastDone(true);
            }

            // Auto-scroll logs
            setTimeout(() => {
              logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (error) {
      console.error("Broadcast error:", error);
      setBroadcastLogs((prev) => [
        ...prev,
        { contact: "Sistema", status: "error", message: "Conexão perdida" },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [contacts, selectedIds, broadcastMessage, broadcastImage, broadcastImageMime]);

  const resetBroadcast = () => {
    setShowBroadcast(false);
    setBroadcastMessage("");
    setBroadcastImage(null);
    setBroadcastImageName(null);
    setBroadcastLogs([]);
    setBroadcastProgress({ sent: 0, failed: 0, total: 0 });
    setBroadcastDone(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FE3E6E] to-[#C24695] rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Contatos</h1>
            <p className="text-gray-500 text-sm">
              {contacts.length} contatos | {selectedIds.size} selecionados
            </p>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <Button
            onClick={() => {
              setShowBroadcast(true);
              setBroadcastDone(false);
              setBroadcastLogs([]);
            }}
            className="bg-[#FE3E6E] hover:bg-[#C24695] text-white"
          >
            <Radio className="w-4 h-4 mr-2" />
            Disparo em Massa ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-colors"
            aria-label="Buscar contato"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer"
          aria-label="Filtrar por status"
        >
          <option value="todos">Todos os Status</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s] || s}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer"
          aria-label="Filtrar por categoria"
        >
          <option value="todos">Todas Categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de contatos */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Header da tabela */}
        <div className="grid grid-cols-[40px_1fr_160px_120px_100px_80px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer"
              aria-label="Selecionar todos"
            />
          </div>
          <div>Contato</div>
          <div>Telefone</div>
          <div>Status</div>
          <div>Score</div>
          <div>Tags</div>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum contato encontrado</p>
          </div>
        ) : (
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            {filtered.map((contact) => (
              <label
                key={contact.id}
                className={cn(
                  "grid grid-cols-[40px_1fr_160px_120px_100px_80px] gap-4 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors items-center",
                  selectedIds.has(contact.id) && "bg-pink-50/60 hover:bg-pink-50/60"
                )}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={() => toggleSelect(contact.id)}
                    className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                      {getInitials(contact.name, contact.phone)}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {contact.name || formatPhone(contact.phone)}
                  </span>
                </div>

                <div className="text-sm text-gray-500 font-mono">
                  {formatPhone(contact.phone)}
                </div>

                <div>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                    {STATUS_LABELS[contact.status] || contact.status}
                  </span>
                </div>

                <div className="text-sm font-semibold text-gray-700">
                  {contact.leadScore}
                </div>

                <div className="flex gap-1 flex-wrap">
                  {contact.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                      title={tag.name}
                    />
                  ))}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Broadcast */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FE3E6E] to-[#C24695] flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Disparo em Massa</h2>
                  <p className="text-xs text-gray-500">
                    {selectedIds.size} contatos selecionados | Intervalo aleatório 10-30s
                  </p>
                </div>
              </div>
              <button
                onClick={resetBroadcast}
                disabled={isSending}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Composer */}
              {!isSending && !broadcastDone && (
                <>
                  <div>
                    <label htmlFor="broadcast-msg" className="block text-sm font-medium text-gray-700 mb-1">
                      Mensagem
                    </label>
                    <textarea
                      id="broadcast-msg"
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Digite a mensagem que será enviada para todos os contatos selecionados..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {broadcastMessage.length} caracteres
                    </p>
                  </div>

                  {/* Imagem */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagem (opcional)
                    </label>
                    {broadcastImage ? (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <ImageIcon className="w-5 h-5 text-pink-500 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {broadcastImageName}
                        </span>
                        <button
                          onClick={clearImage}
                          className="p-1 rounded-md hover:bg-gray-200 text-gray-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 transition-colors"
                      >
                        <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                        Clique para anexar uma imagem
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Aviso */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    <strong>Atenção:</strong> As mensagens serão enviadas em ordem aleatória com intervalo de 10 a 30 segundos entre cada envio para proteger seu número.
                    Não feche esta janela durante o disparo.
                  </div>
                </>
              )}

              {/* Progresso / Logs */}
              {(isSending || broadcastDone) && (
                <div className="space-y-4">
                  {/* Barra de progresso */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        Progresso: {broadcastProgress.sent + broadcastProgress.failed} / {broadcastProgress.total}
                      </span>
                      <span className="text-gray-500">
                        <span className="text-green-600 font-medium">{broadcastProgress.sent} ok</span>
                        {broadcastProgress.failed > 0 && (
                          <> | <span className="text-red-500 font-medium">{broadcastProgress.failed} falha</span></>
                        )}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FE3E6E] to-[#C24695] rounded-full transition-all duration-500"
                        style={{
                          width: `${broadcastProgress.total > 0
                            ? ((broadcastProgress.sent + broadcastProgress.failed) / broadcastProgress.total) * 100
                            : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Logs */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-60 overflow-y-auto">
                    <div className="p-3 space-y-1.5">
                      {broadcastLogs.map((log, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {log.status === "ok" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                          {log.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                          {log.status === "waiting" && <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span className={cn(
                            "truncate",
                            log.status === "ok" && "text-gray-700",
                            log.status === "error" && "text-red-600",
                            log.status === "waiting" && "text-amber-600"
                          )}>
                            {log.status === "waiting"
                              ? log.message
                              : `${log.contact}${log.message ? ` — ${log.message}` : ""}`}
                          </span>
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>

                  {broadcastDone && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-green-700">
                        Disparo finalizado!
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {broadcastProgress.sent} enviados com sucesso
                        {broadcastProgress.failed > 0 && `, ${broadcastProgress.failed} falharam`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              {!isSending && !broadcastDone && (
                <>
                  <Button variant="outline" onClick={resetBroadcast}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={startBroadcast}
                    disabled={!broadcastMessage.trim()}
                    className="bg-[#FE3E6E] hover:bg-[#C24695] text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Iniciar Disparo
                  </Button>
                </>
              )}
              {isSending && (
                <Button disabled className="bg-gray-200 text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </Button>
              )}
              {broadcastDone && (
                <Button onClick={resetBroadcast} className="bg-[#FE3E6E] hover:bg-[#C24695] text-white">
                  Fechar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
