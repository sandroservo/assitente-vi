/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * Client component principal da conversa — orquestra header, chat, composer e lead sidebar
 */

"use client";

import { useState } from "react";
import { Bot, UserCheck, PanelRightOpen, PanelRightClose, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function ChatPageClient({
  conversationId,
  lead,
  initialMessages,
}: ChatPageClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const displayName = lead.name || lead.pushName || "Sem nome";

  return (
    <div className="flex h-full overflow-hidden">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            {lead.avatarUrl ? (
              <img
                src={lead.avatarUrl}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {getInitials(lead.name || lead.pushName, lead.phone)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </h3>
                {lead.leadScore > 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0",
                      getScoreColor(lead.leadScore)
                    )}
                    title={`Lead Score: ${lead.leadScore}`}
                  >
                    {lead.leadScore}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
                <span className="text-gray-300">|</span>
                {lead.ownerType === "human" ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <UserCheck className="h-3 w-3" />
                    Humano
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Bot className="h-3 w-3" />
                    Vi
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Toggle sidebar */}
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

        {/* Messages */}
        <InboxConversation
          conversationId={conversationId}
          initialMessages={initialMessages}
        />

        {/* Composer */}
        <ChatComposer conversationId={conversationId} />
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
