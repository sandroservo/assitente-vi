/**
 * Ação "Cliente parou de responder": marca lead como Aguardando resposta
 * e agenda follow-ups (lembretes em 24h, 48h, 72h, 120h).
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircleOff, Loader2 } from "lucide-react";

interface ClienteParouResponderButtonProps {
  leadId: string;
  conversationId: string;
  className?: string;
}

export default function ClienteParouResponderButton({
  leadId,
  conversationId,
  className,
}: ClienteParouResponderButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/followups/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, conversationId }),
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
      window.location.reload();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao marcar cliente parou de responder");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className={className ?? "w-full"}
      onClick={handleClick}
      disabled={loading}
      title="Marcar como cliente parou de responder e agendar lembretes"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <MessageCircleOff className="h-4 w-4 mr-2" />
      )}
      Cliente parou de responder
    </Button>
  );
}
