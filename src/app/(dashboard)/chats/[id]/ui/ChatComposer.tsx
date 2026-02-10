/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Composer melhorado: sem reload, gravação de áudio, envio de imagem/arquivo
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Send,
  Loader2,
  Mic,
  Square,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  Smile,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import EmojiPicker from "@/components/chat/EmojiPicker";

interface ChatComposerProps {
  conversationId: string;
  onToast?: (message: string, type: "success" | "error" | "info") => void;
}

export default function ChatComposer({ conversationId, onToast }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCardsGallery, setShowCardsGallery] = useState(false);
  const [sendingCard, setSendingCard] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [text]);

  function handleEmojiSelect(emoji: string) {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart ?? text.length;
      const end = el.selectionEnd ?? text.length;
      const newText = text.slice(0, start) + emoji + text.slice(end);
      setText(newText);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      setText((prev) => prev + emoji);
    }
  }

  function triggerRefetch() {
    if (typeof window !== "undefined" && (window as any).__inboxRefetch) {
      setTimeout(() => (window as any).__inboxRefetch(), 300);
    }
  }

  async function sendText() {
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error ?? "Erro ao enviar mensagem", "error");
        return;
      }

      setText("");
      triggerRefetch();
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (error) {
      console.error("Erro ao enviar:", error);
      onToast?.("Erro ao enviar mensagem", "error");
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
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      onToast?.("Não foi possível acessar o microfone. Verifique as permissões.", "error");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function cancelRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream
          ?.getTracks()
          .forEach((t) => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function sendAudio(blob: Blob) {
    setLoading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
      });
      reader.readAsDataURL(blob);
      const base64 = await base64Promise;

      const res = await fetch("/api/messages/send-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          base64,
          mimeType: "audio/ogg",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error ?? "Erro ao enviar áudio", "error");
        return;
      }

      triggerRefetch();
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      onToast?.("Erro ao enviar áudio", "error");
    } finally {
      setLoading(false);
    }
  }

  // Cards informativos disponíveis em public/cards/
  const availableCards = [
    { file: "planos.jpeg", label: "Planos" },
    { file: "planos_e_seu_dependentes.jpeg", label: "Planos e Dependentes" },
    { file: "checkups.jpeg", label: "Check-ups" },
    { file: "especialidades_dentro_dos_palnos.jpeg", label: "Especialidades" },
    { file: "exame_plano_ cobertura_ total.jpeg", label: "Exames - Cobertura Total" },
    { file: "exame_plano_ especializado.jpeg", label: "Exames - Especializado" },
    { file: "exame_plano_ rotina.jpeg", label: "Exames - Rotina" },
  ];

  async function sendCard(card: { file: string; label: string }) {
    setSendingCard(true);
    setShowCardsGallery(false);
    try {
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
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error || "Erro ao enviar card", "error");
        return;
      }

      triggerRefetch();
    } catch {
      onToast?.("Erro ao enviar card", "error");
    } finally {
      setSendingCard(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setAttachedPreview(url);
    } else {
      setAttachedPreview(null);
    }
    // Reset input
    e.target.value = "";
  }

  function clearAttachment() {
    setAttachedFile(null);
    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
      setAttachedPreview(null);
    }
  }

  async function sendFile() {
    if (!attachedFile || loading) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
      });
      reader.readAsDataURL(attachedFile);
      const base64 = await base64Promise;

      const res = await fetch("/api/messages/send-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          base64,
          mimeType: attachedFile.type,
          fileName: attachedFile.name,
          caption: text.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.(data.error ?? "Erro ao enviar arquivo", "error");
        return;
      }

      clearAttachment();
      setText("");
      triggerRefetch();
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      onToast?.("Erro ao enviar arquivo", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (attachedFile) {
        sendFile();
      } else {
        sendText();
      }
    }
  }

  function formatSeconds(s: number): string {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  // Recording mode
  if (isRecording) {
    return (
      <div className="bg-[#f0f2f5] border-t p-3 md:p-4">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-red-50 text-red-500"
            onClick={cancelRecording}
            aria-label="Cancelar gravação"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-red-600">
              Gravando {formatSeconds(recordingTime)}
            </span>
          </div>
          <Button
            onClick={stopRecording}
            disabled={loading}
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md"
            aria-label="Enviar áudio"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Attachment preview */}
      {attachedFile && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
            {attachedPreview ? (
              <img
                src={attachedPreview}
                alt="Preview"
                className="w-12 h-12 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {attachedFile.name}
              </p>
              <p className="text-xs text-gray-400">
                {(attachedFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              onClick={clearAttachment}
              className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Remover anexo"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Cards Gallery */}
      {showCardsGallery && (
        <div className="px-4 pt-3 pb-1">
          <div className="bg-gray-50 rounded-xl border p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Cards Informativos</h4>
              <button
                onClick={() => setShowCardsGallery(false)}
                className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Fechar galeria de cards"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableCards.map((card) => (
                <button
                  key={card.file}
                  onClick={() => sendCard(card)}
                  disabled={sendingCard}
                  className="group relative rounded-lg overflow-hidden border hover:border-pink-400 transition-all hover:shadow-md disabled:opacity-50"
                >
                  <img
                    src={`/cards/${card.file}`}
                    alt={card.label}
                    className="w-full h-16 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                    <span className="text-white text-[9px] font-medium leading-tight">{card.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      {/* Composer — pill style */}
      <div className="bg-[#f0f2f5] border-t p-3 md:p-4 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
          {/* Emoji */}
          <div className="relative flex items-center gap-1">
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
            {/* Attach */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-gray-100"
              onClick={() => fileInputRef.current?.click()}
              disabled={sendingCard}
              title="Enviar arquivo"
              aria-label="Enviar arquivo"
            >
              <Paperclip className="h-5 w-5 text-gray-500" />
            </Button>
            {/* Cards */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-purple-50"
              onClick={() => setShowCardsGallery((prev) => !prev)}
              disabled={sendingCard}
              title="Cards dos planos"
              aria-label="Cards informativos"
            >
              {sendingCard ? (
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
              ) : (
                <LayoutGrid className="h-5 w-5 text-purple-500" />
              )}
            </Button>
          </div>

          {/* Input */}
          <textarea
            ref={textareaRef}
            placeholder={attachedFile ? "Legenda (opcional)..." : "Digite uma mensagem..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            className="flex-1 border-0 bg-transparent resize-none focus:outline-none focus:ring-0 placeholder:text-gray-400 text-sm py-1.5 disabled:opacity-50"
            style={{ maxHeight: "120px" }}
            aria-label="Campo de mensagem"
          />

          {/* Send / Mic */}
          {sendingCard ? (
            <Button
              disabled
              size="icon"
              className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 shadow-md"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </Button>
          ) : text.trim() || attachedFile ? (
            <Button
              onClick={attachedFile ? sendFile : sendText}
              disabled={loading || (!text.trim() && !attachedFile)}
              size="icon"
              className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md"
              aria-label="Enviar mensagem"
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
              disabled={loading}
              size="icon"
              className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-md"
              title="Gravar áudio"
              aria-label="Gravar áudio"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
