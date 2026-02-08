/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPhone } from "@/lib/formatters";
import {
  Send,
  Paperclip,
  Mic,
  Square,
  Phone,
  RefreshCw,
  MoreHorizontal,
  Bot,
  UserCheck,
  Loader2,
  Wifi,
  WifiOff,
  MessageCircleOff,
  Image,
  X,
  FileText,
  Smile,
} from "lucide-react";
import EmojiPicker from "@/components/chat/EmojiPicker";

interface Message {
  id: string;
  body: string;
  direction: "in" | "out";
  createdAt: Date | string;
  sentByUserName?: string | null;
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
  const [parouResponderLoading, setParouResponderLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [lead, setLead] = useState(initialLead);
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState("conversa");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [showCardsGallery, setShowCardsGallery] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
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
            return [...prev, ...newMsgs].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
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
          avatarUrl: data.lead.avatarUrl,
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

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        setRecordingTime(0);

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) return; // áudio muito curto, ignora

        await sendAudio(blob);
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
  }

  async function sendAudio(blob: Blob) {
    setSendingAudio(true);

    const optimisticMsg: Message = {
      id: `temp-audio-${Date.now()}`,
      body: "🎤 Enviando áudio...",
      direction: "out",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/messages/send-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          base64,
          mimeType: blob.type || "audio/webm",
        }),
      });

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        alert("Erro ao enviar áudio");
        return;
      }

      setTimeout(fetchNewMessages, 500);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert("Erro ao enviar áudio");
    } finally {
      setSendingAudio(false);
    }
  }

  // Cards disponíveis em public/cards/
  const availableCards = [
    { file: "planos.jpeg", label: "Planos" },
    { file: "planos_e_seu_dependentes.jpeg", label: "Planos e Dependentes" },
    { file: "checkups.jpeg", label: "Check-ups" },
    { file: "especialidades_dentro_dos_palnos.jpeg", label: "Especialidades" },
    { file: "exame_plano_ cobertura_ total.jpeg", label: "Exames - Cobertura Total" },
    { file: "exame_plano_ especializado.jpeg", label: "Exames - Especializado" },
    { file: "exame_plano_ rotina.jpeg", label: "Exames - Rotina" },
  ];

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input
    e.target.value = "";

    // Limite de 15MB
    if (file.size > 15 * 1024 * 1024) {
      alert("Arquivo muito grande. Limite: 15MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      await sendMedia(base64, file.type, file.name);
    };
    reader.readAsDataURL(file);
  }

  async function sendMedia(base64: string, mimeType: string, fileName?: string, caption?: string) {
    setSendingMedia(true);
    setShowCardsGallery(false);

    const isImage = mimeType.startsWith("image/");
    const optimisticMsg: Message = {
      id: `temp-media-${Date.now()}`,
      body: isImage ? "📷 Enviando imagem..." : `📎 Enviando ${fileName || "arquivo"}...`,
      direction: "out",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages/send-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, base64, mimeType, fileName, caption }),
      });

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao enviar arquivo");
        return;
      }

      setTimeout(fetchNewMessages, 500);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert("Erro ao enviar arquivo");
    } finally {
      setSendingMedia(false);
    }
  }

  async function sendCard(card: { file: string; label: string }) {
    setSendingMedia(true);
    setShowCardsGallery(false);

    const optimisticMsg: Message = {
      id: `temp-card-${Date.now()}`,
      body: `📷 Enviando card: ${card.label}...`,
      direction: "out",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // Busca a imagem do card em public/cards/ e converte para base64
      const response = await fetch(`/cards/${card.file}`);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/messages/send-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          base64,
          mimeType: "image/jpeg",
          fileName: card.file,
          caption: card.label,
        }),
      });

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao enviar card");
        return;
      }

      setTimeout(fetchNewMessages, 500);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert("Erro ao enviar card");
    } finally {
      setSendingMedia(false);
    }
  }

  function handleEmojiSelect(emoji: string) {
    setText((prev) => prev + emoji);
    // Foca no input após selecionar emoji
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function formatRecordingTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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

  async function handleClienteParouResponder() {
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
      fetchNewMessages();
    } catch {
      alert("Erro ao marcar cliente parou de responder");
    } finally {
      setParouResponderLoading(false);
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
          {lead.avatarUrl ? (
            <img 
              src={lead.avatarUrl} 
              alt={lead.name || lead.pushName || "Avatar"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-medium">
              {(lead.name || lead.pushName)?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{lead.name || lead.pushName || "Sem nome"}</h2>
              <Badge className={cn(
                "text-xs",
                lead.ownerType === "human" 
                  ? "bg-purple-100 text-purple-700"
                  : lead.status === "HUMANO_SOLICITADO"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700"
              )}>
                {lead.ownerType === "human" 
                  ? "Atendimento Humano"
                  : lead.status === "HUMANO_SOLICITADO"
                    ? "Aguardando Humano"
                    : lead.status.replace(/_/g, " ")}
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
            variant="outline"
            size="sm"
            onClick={handleClienteParouResponder}
            disabled={parouResponderLoading}
            title="Cliente parou de responder: agenda lembretes"
          >
            {parouResponderLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircleOff className="h-4 w-4 mr-1" />
            )}
            Parou de responder
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

      <div className="flex-1 flex flex-col min-h-0">
        <div className="bg-white flex-shrink-0">
          <div className="flex border-b border-gray-200">
            {["conversa", "detalhes", "anotacoes", "historico"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors relative",
                  activeTab === tab
                    ? "text-pink-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab === "conversa" && "Conversa"}
                {tab === "detalhes" && "Detalhes"}
                {tab === "anotacoes" && "Anotações"}
                {tab === "historico" && "Histórico"}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "conversa" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-[#f0f2f5]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}>
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex justify-center my-4">
                  <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-lg text-xs text-gray-600 shadow-sm font-medium">
                    {isToday(group.date) ? "Hoje" : group.date}
                  </span>
                </div>

                {group.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex mb-3",
                      msg.direction === "out" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] md:max-w-[65%] flex gap-2",
                        msg.direction === "out" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {msg.direction === "in" ? (
                        lead.avatarUrl ? (
                          <img 
                            src={lead.avatarUrl} 
                            alt=""
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold bg-gradient-to-br from-gray-400 to-gray-500 text-white ring-2 ring-white shadow-sm">
                            {(lead.name || lead.pushName)?.[0]?.toUpperCase() || "?"}
                          </div>
                        )
                      ) : (
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ring-2 ring-white shadow-sm",
                          lead.ownerType === "human"
                            ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                            : "bg-gradient-to-br from-pink-500 to-pink-600 text-white"
                        )}>
                          {msg.sentByUserName
                            ? msg.sentByUserName.split(" ")[0][0].toUpperCase()
                            : lead.ownerType === "human" ? "👤" : "Vi"}
                        </div>
                      )}

                      <div className="flex flex-col">
                        <div
                          className={cn(
                            "relative px-4 py-2.5 shadow-sm",
                            msg.direction === "out"
                              ? lead.ownerType === "human"
                                ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl rounded-tr-md"
                                : "bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl rounded-tr-md"
                              : "bg-white text-gray-800 rounded-2xl rounded-tl-md"
                          )}
                        >
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            msg.direction === "out" ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-[10px]",
                              msg.direction === "out" ? "text-white/70" : "text-gray-400"
                            )}>
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {msg.direction === "out" && (
                              <span className="text-white/70 text-[10px]">✓✓</span>
                            )}
                          </div>
                        </div>
                        <p className={cn(
                          "text-[10px] text-gray-500 mt-1 px-1",
                          msg.direction === "out" ? "text-right" : "text-left"
                        )}>
                          {msg.direction === "out"
                            ? msg.sentByUserName || (lead.ownerType === "human" ? "Você" : "Vi")
                            : lead.name || lead.pushName || "Lead"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-[#f0f2f5] border-t p-3 md:p-4 flex-shrink-0">
            {isRecording ? (
              <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-red-50 text-red-500"
                  onClick={cancelRecording}
                  title="Cancelar gravação"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </Button>
                <div className="flex-1 flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-red-600">
                    Gravando {formatRecordingTime(recordingTime)}
                  </span>
                </div>
                <Button
                  onClick={stopRecording}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md"
                  title="Enviar áudio"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Galeria de Cards */}
                {showCardsGallery && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border p-4 max-h-80 overflow-auto z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm text-gray-700">Cards Informativos</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => setShowCardsGallery(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableCards.map((card) => (
                        <button
                          key={card.file}
                          onClick={() => sendCard(card)}
                          disabled={sendingMedia}
                          className="group relative rounded-lg overflow-hidden border hover:border-pink-400 transition-all hover:shadow-md disabled:opacity-50"
                        >
                          <img
                            src={`/cards/${card.file}`}
                            alt={card.label}
                            className="w-full h-20 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                            <span className="text-white text-[10px] font-medium leading-tight">{card.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input file oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div className="flex items-center gap-2 md:gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
                  {/* Botão Anexo */}
                  <div className="relative flex items-center gap-1">
                    {/* Emoji button */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-9 w-9 rounded-full",
                          showEmojiPicker ? "bg-pink-50 text-pink-500" : "hover:bg-gray-100 text-gray-500"
                        )}
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        title="Emojis"
                        aria-label="Abrir seletor de emojis"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                      {showEmojiPicker && (
                        <EmojiPicker
                          onSelect={handleEmojiSelect}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-gray-100"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendingMedia}
                      title="Enviar arquivo"
                    >
                      <Paperclip className="h-5 w-5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-purple-50"
                      onClick={() => setShowCardsGallery((prev) => !prev)}
                      disabled={sendingMedia}
                      title="Cards dos planos"
                    >
                      <Image className="h-5 w-5 text-purple-500" />
                    </Button>
                  </div>
                  <Input
                    ref={inputRef}
                    placeholder="Digite uma mensagem..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
                    disabled={loading || sendingAudio || sendingMedia}
                  />
                  {sendingMedia ? (
                    <Button
                      disabled
                      size="icon"
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 shadow-md"
                    >
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </Button>
                  ) : text.trim() ? (
                    <Button
                      onClick={sendMessage}
                      disabled={loading}
                      size="icon"
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={startRecording}
                      disabled={sendingAudio}
                      size="icon"
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md"
                      title="Gravar áudio"
                    >
                      {sendingAudio ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

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
          </div>
        )}

        {activeTab === "anotacoes" && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Anotações</h3>
              <textarea
                placeholder="Adicione notas sobre este lead..."
                className="w-full h-40 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                defaultValue={lead.notes || ""}
              />
            </div>
          </div>
        )}

        {activeTab === "historico" && (
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Histórico de Interações</h3>
              <p className="text-gray-500 text-sm">
                {messages.length} mensagens trocadas
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
