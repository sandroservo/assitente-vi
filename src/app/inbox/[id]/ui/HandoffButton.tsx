/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserCheck, Bot, Loader2 } from "lucide-react";

interface HandoffButtonProps {
  leadId: string;
  isHuman: boolean;
}

export default function HandoffButton({ leadId, isHuman }: HandoffButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleHandoff() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/handoff`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erro ao assumir lead");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Erro ao assumir:", error);
      alert("Erro ao assumir lead");
    } finally {
      setLoading(false);
    }
  }

  async function handleReturnToBot() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/return-to-bot`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erro ao devolver para o bot");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Erro ao devolver:", error);
      alert("Erro ao devolver para o bot");
    } finally {
      setLoading(false);
    }
  }

  if (isHuman) {
    return (
      <div className="space-y-2">
        <Button variant="outline" className="w-full" disabled>
          <UserCheck className="h-4 w-4 mr-2" />
          Você está atendendo
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={handleReturnToBot}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Bot className="h-4 w-4 mr-2" />
          )}
          Devolver para Vi (Bot)
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="default"
      className="w-full"
      onClick={handleHandoff}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <UserCheck className="h-4 w-4 mr-2" />
      )}
      Assumir como humano
    </Button>
  );
}
