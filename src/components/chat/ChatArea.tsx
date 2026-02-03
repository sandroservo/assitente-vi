/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/formatters";
import {
  Send,
  Paperclip,
  Mic,
  Phone,
  RefreshCw,
  MoreHorizontal,
  Bot,
  UserCheck,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Message {
  id: string;
  body: string;
  direction: "in" | "out";
  createdAt: Date | string;
}

interface Lead {
  id: string;
  name: string | null;
  pushName: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  status: string;
  ownerType: "bot" | "human";
  summary: string | null;
  notes: string | null;
}

interface ChatAreaProps {
  conversationId: string;
  lead: Lead;
  messages: Message[];
}

const POLLING_INTERVAL = 2000; // 2 segundos

export function ChatArea({ conversationId, lead: initialLead, messages: initialMessages }: ChatAreaProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [lead, setLead] = useState(initialLead);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageTime = useRef<string | null>(null);
  const shouldAutoScroll = useRef(true);

  // Atualiza referência do último horário de mensagem
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      lastMessageTime.current = typeof lastMsg.createdAt === 'string' 
        ? lastMsg.createdAt 
        : lastMsg.createdAt.toISOString();
    }
  }, [messages]);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Polling para novas mensagens
  const fetchNewMessages = useCallback(async () => {
    try {
      const url = lastMessageTime.current
        ? `/api/conversations/${conversationId}/messages?after=${encodeURIComponent(lastMessageTime.current)}`
        : `/api/conversations/${conversationId}/messages`;

      const res = await fetch(url);
      
      if (!res.ok) {
        setIsConnected(false);
        return;
      }

      setIsConnected(true);
      const data = await res.json();

      if (data.ok && data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter((m: Message) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            return [...prev, ...newMsgs];
          }
          return prev;
        });
      }

      // Atualiza dados do lead se mudou
      if (data.lead) {
        setLead((prev) => ({
          ...prev,
          name: data.lead.name,
          pushName: data.lead.pushName,
          status: data.lead.status,
          ownerType: data.lead.ownerType,
        }));
      }
    } catch {
      setIsConnected(false);
    }
  }, [conversationId]);

  // Inicia polling
  useEffect(() => {
    const interval = setInterval(fetchNewMessages, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNewMessages]);

  async function sendMessage() {
    if (!text.trim() || loading) return;

    const messageText = text.trim();
    setText("");
    setLoading(true);

    // Adiciona mensagem otimista
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      body: messageText,
      direction: "out",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text: messageText }),
      });

      if (!res.ok) {
        // Remove mensagem otimista em caso de erro
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        alert("Erro ao enviar mensagem");
        setText(messageText);
        return;
      }

      // Busca mensagens atualizadas
      setTimeout(fetchNewMessages, 500);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert("Erro ao enviar mensagem");
      setText(messageText);
    } finally {
      setLoading(false);
    }
  }

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
      
      // Atualiza estado local
      setLead((prev) => ({
        ...prev,
        ownerType: prev.ownerType === "human" ? "bot" : "human",
      }));
      
      // Busca dados atualizados
      fetchNewMessages();
    } catch {
      alert("Erro ao alterar atendimento");
    } finally {
      setHandoffLoading(false);
    }
  }

  function groupMessagesByDate(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString("pt-BR");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });

    return groups;
  }

  const groupedMessages = groupMessagesByDate(messages);
  const isToday = (date: string) =>
    date === new Date().toLocaleDateString("pt-BR");

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden min-h-0">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-medium">
            {(lead.name || lead.pushName)?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{lead.name || lead.pushName || "Sem nome"}</h2>
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                {lead.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {formatPhone(lead.phone)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
            isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Ao vivo" : "Offline"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchNewMessages}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleHandoff}
            disabled={handoffLoading}
            className={cn(
              lead.ownerType === "human"
                ? "bg-gray-600 hover:bg-gray-700"
                : "bg-pink-500 hover:bg-pink-600"
            )}
          >
            {handoffLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : lead.ownerType === "human" ? (
              <Bot className="h-4 w-4 mr-2" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            {lead.ownerType === "human" ? "Devolver ao Bot" : "Iniciar atendimento"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="conversa" className="flex-1 flex flex-col min-h-0">
        <div className="bg-white border-b px-6 flex-shrink-0">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger
              value="conversa"
              className="data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-3 pt-3"
            >
              Conversa
            </TabsTrigger>
            <TabsTrigger
              value="detalhes"
              className="data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-3 pt-3"
            >
              Detalhes
            </TabsTrigger>
            <TabsTrigger
              value="anotacoes"
              className="data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-3 pt-3"
            >
              Anotações
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 pb-3 pt-3"
            >
              Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conversa" className="flex-1 flex flex-col m-0 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex justify-center my-4">
                  <span className="bg-white px-4 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                    {isToday(group.date) ? "Hoje" : group.date}
                  </span>
                </div>

                {group.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex mb-4",
                      msg.direction === "out" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] flex gap-3",
                        msg.direction === "out" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium",
                          msg.direction === "out"
                            ? "bg-pink-500 text-white"
                            : "bg-gray-300 text-gray-700"
                        )}
                      >
                        {msg.direction === "out"
                          ? lead.ownerType === "human"
                            ? "H"
                            : "Vi"
                          : (lead.name || lead.pushName)?.[0]?.toUpperCase() || "?"}
                      </div>

                      <div>
                        <p
                          className={cn(
                            "text-xs mb-1",
                            msg.direction === "out" ? "text-right" : "text-left"
                          )}
                        >
                          {msg.direction === "out"
                            ? lead.ownerType === "human"
                              ? "Você (Comercial)"
                              : "Vi (Bot)"
                            : lead.name || lead.pushName || "Lead"}
                        </p>
                        <div
                          className={cn(
                            "p-3 rounded-2xl",
                            msg.direction === "out"
                              ? "bg-pink-500 text-white rounded-tr-sm"
                              : "bg-white shadow-sm rounded-tl-sm"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                        </div>
                        <p
                          className={cn(
                            "text-[10px] text-gray-400 mt-1",
                            msg.direction === "out" ? "text-right" : "text-left"
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t p-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Escreva sua mensagem aqui"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 bg-gray-50 border-gray-200"
                disabled={loading}
              />
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5 text-gray-400" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mic className="h-5 w-5 text-gray-400" />
              </Button>
              <Button
                onClick={sendMessage}
                disabled={loading || !text.trim()}
                className="bg-pink-500 hover:bg-pink-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Enviar
                    <Send className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="detalhes" className="flex-1 p-6 m-0">
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold">Informações do Lead</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Nome</p>
                <p className="font-medium">{lead.name || lead.pushName || "Não informado"}</p>
              </div>
              <div>
                <p className="text-gray-500">Telefone</p>
                <p className="font-medium">{formatPhone(lead.phone)}</p>
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
            </div>
            {lead.summary && (
              <div>
                <p className="text-gray-500 text-sm">Resumo</p>
                <p className="text-sm mt-1">{lead.summary}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="anotacoes" className="flex-1 p-6 m-0">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Anotações</h3>
            <textarea
              placeholder="Adicione notas sobre este lead..."
              className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
              defaultValue={lead.notes || ""}
            />
          </div>
        </TabsContent>

        <TabsContent value="historico" className="flex-1 p-6 m-0">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Histórico de Interações</h3>
            <p className="text-gray-500 text-sm">
              {messages.length} mensagens trocadas
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
