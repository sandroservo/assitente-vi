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
} from "lucide-react";
import { cn } from "@/lib/utils";
import EmojiPicker from "@/components/chat/EmojiPicker";

interface ChatComposerProps {
  conversationId: string;
}

export default function ChatComposer({ conversationId }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
        alert(data.error ?? "Erro ao enviar mensagem");
        return;
      }

      setText("");
      triggerRefetch();
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro ao enviar mensagem");
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
      alert("Não foi possível acessar o microfone. Verifique as permissões.");
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
        alert(data.error ?? "Erro ao enviar áudio");
        return;
      }

      triggerRefetch();
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      alert("Erro ao enviar áudio");
    } finally {
      setLoading(false);
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
        alert(data.error ?? "Erro ao enviar arquivo");
        return;
      }

      clearAttachment();
      setText("");
      triggerRefetch();
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      alert("Erro ao enviar arquivo");
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
      <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-t">
        <button
          onClick={cancelRecording}
          className="p-2 rounded-full hover:bg-red-100 transition-colors"
          aria-label="Cancelar gravação"
        >
          <X className="h-5 w-5 text-red-500" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono text-red-600">
            {formatSeconds(recordingTime)}
          </span>
          <span className="text-sm text-red-500">Gravando...</span>
        </div>
        <button
          onClick={stopRecording}
          disabled={loading}
          className="p-2.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors disabled:opacity-50"
          aria-label="Parar e enviar gravação"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t bg-white">
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

      {/* Composer */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Emoji button */}
        <div className="relative flex-shrink-0 mb-0.5">
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            disabled={loading}
            className={cn(
              "p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50",
              showEmojiPicker ? "text-pink-500 bg-pink-50" : "text-gray-500"
            )}
            title="Emojis"
            aria-label="Abrir seletor de emojis"
          >
            <Smile className="h-5 w-5" />
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-50 flex-shrink-0 mb-0.5"
          title="Anexar arquivo ou imagem"
          aria-label="Anexar arquivo ou imagem"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {/* Textarea */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            placeholder={attachedFile ? "Legenda (opcional)..." : "Digite sua mensagem..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-colors disabled:opacity-50"
            style={{ maxHeight: "120px" }}
            aria-label="Campo de mensagem"
          />
        </div>

        {/* Send or Mic */}
        {text.trim() || attachedFile ? (
          <Button
            onClick={attachedFile ? sendFile : sendText}
            disabled={loading || (!text.trim() && !attachedFile)}
            size="icon"
            className="rounded-full h-10 w-10 bg-pink-500 hover:bg-pink-600 flex-shrink-0 mb-0.5"
            aria-label="Enviar mensagem"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <button
            onClick={startRecording}
            disabled={loading}
            className="p-2.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-colors disabled:opacity-50 flex-shrink-0 mb-0.5"
            title="Gravar áudio"
            aria-label="Gravar áudio"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
