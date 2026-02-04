/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * Componente Kanban de Leads estilo Amo Vidas
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface Lead {
  id: string;
  name: string | null;
  pushName: string | null;
  phone: string;
  status: string;
  ownerType: string;
  createdAt: string;
  conversationId: string | null;
}

interface LeadsKanbanProps {
  initialLeads: Lead[];
}

const COLUMNS = [
  { 
    id: "NOVO", 
    title: "Novo", 
    bgColor: "bg-pink-50", 
    headerBg: "bg-pink-100",
    borderColor: "border-pink-200",
    badgeColor: "bg-pink-500"
  },
  { 
    id: "EM_ATENDIMENTO", 
    title: "Em Atendimento", 
    bgColor: "bg-orange-50", 
    headerBg: "bg-orange-100",
    borderColor: "border-orange-200",
    badgeColor: "bg-orange-500"
  },
  { 
    id: "QUALIFICADO", 
    title: "Qualificado", 
    bgColor: "bg-blue-50", 
    headerBg: "bg-blue-100",
    borderColor: "border-blue-200",
    badgeColor: "bg-blue-500"
  },
  { 
    id: "FECHADO", 
    title: "Fechado", 
    bgColor: "bg-green-50", 
    headerBg: "bg-green-100",
    borderColor: "border-green-200",
    badgeColor: "bg-green-500"
  },
  { 
    id: "PERDIDO", 
    title: "Perdido", 
    bgColor: "bg-red-50", 
    headerBg: "bg-red-100",
    borderColor: "border-red-200",
    badgeColor: "bg-red-500"
  },
  { 
    id: "LEAD_FRIO", 
    title: "Lead Frio", 
    bgColor: "bg-slate-50", 
    headerBg: "bg-slate-100",
    borderColor: "border-slate-200",
    badgeColor: "bg-slate-500"
  },
  { 
    id: "HUMANO_SOLICITADO", 
    title: "Aguardando Humano", 
    bgColor: "bg-yellow-50", 
    headerBg: "bg-yellow-100",
    borderColor: "border-yellow-200",
    badgeColor: "bg-yellow-500"
  },
];

const POLLING_INTERVAL = 5000;

export function LeadsKanban({ initialLeads }: LeadsKanbanProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchLeads, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.status === status);
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        console.error("Erro ao atualizar status do lead");
        fetchLeads();
      }
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
      fetchLeads();
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setLeads((prev) => {
      const newLeads = [...prev];
      
      const sourceLeads = newLeads.filter((l) => l.status === source.droppableId);
      const movedLead = sourceLeads[source.index];
      
      if (!movedLead) return prev;

      const updatedLead = { ...movedLead, status: destination.droppableId };

      const withoutMoved = newLeads.filter((l) => l.id !== draggableId);
      
      const destLeads = withoutMoved.filter((l) => l.status === destination.droppableId);
      const otherLeads = withoutMoved.filter((l) => l.status !== destination.droppableId);

      destLeads.splice(destination.index, 0, updatedLead);

      return [...otherLeads, ...destLeads];
    });

    if (source.droppableId !== destination.droppableId) {
      updateLeadStatus(draggableId, destination.droppableId);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + " às " + date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    
    // Formato brasileiro: (11) 99999-9999 ou (11) 9999-9999
    if (cleaned.startsWith("55") && cleaned.length >= 12) {
      const ddd = cleaned.slice(2, 4);
      const rest = cleaned.slice(4);
      if (rest.length === 9) {
        return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
      }
      return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
    
    // Sem código do país
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-7 gap-2 pb-4 min-h-[calc(100vh-180px)]">
        {COLUMNS.map((column) => {
          const columnLeads = getLeadsByStatus(column.id);
          return (
            <div
              key={column.id}
              className={cn(
                "rounded-xl border min-w-0",
                column.bgColor,
                column.borderColor
              )}
            >
              {/* Header da coluna */}
              <div
                className={cn(
                  "px-4 py-3 rounded-t-xl flex items-center justify-between",
                  column.headerBg
                )}
              >
                <h3 className="font-semibold text-gray-800">{column.title}</h3>
                <span
                  className={cn(
                    "text-white text-sm font-medium px-2.5 py-0.5 rounded-full",
                    column.badgeColor
                  )}
                >
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards com Droppable */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "p-3 space-y-3 min-h-[100px] transition-colors",
                      snapshot.isDraggingOver && "bg-opacity-70"
                    )}
                  >
                    {columnLeads.length === 0 && !snapshot.isDraggingOver ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Nenhum lead
                      </div>
                    ) : (
                      columnLeads.map((lead, index) => (
                        <Draggable
                          key={lead.id}
                          draggableId={lead.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "bg-white rounded-lg p-3 shadow-sm border border-gray-100 transition-shadow cursor-grab active:cursor-grabbing",
                                snapshot.isDragging
                                  ? "shadow-lg ring-2 ring-pink-300"
                                  : "hover:shadow-md"
                              )}
                            >
                              {/* Nome */}
                              <h4 className="font-medium text-gray-800 truncate mb-2">
                                {lead.name || lead.pushName || "Sem nome"}
                              </h4>

                              {/* Telefone */}
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Phone className="w-3 h-3 text-white" />
                                </div>
                                <span>{formatPhone(lead.phone)}</span>
                              </div>

                              {/* Data */}
                              <div className="text-xs text-gray-400 mb-3">
                                {formatDate(lead.createdAt)}
                              </div>

                              {/* Tags */}
                              <div className="flex items-center gap-2 mb-3">
                                <span
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    lead.ownerType === "human"
                                      ? "bg-indigo-100 text-indigo-700"
                                      : "bg-pink-100 text-pink-700"
                                  )}
                                >
                                  {lead.ownerType === "human" ? "Humano" : "Bot"}
                                </span>
                              </div>

                              {/* Ações */}
                              {lead.conversationId && (
                                <Link href={`/inbox/${lead.conversationId}`}>
                                  <button className="w-full bg-[#FE3E6E] hover:bg-[#C24695] text-white text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                    Ver conversa
                                  </button>
                                </Link>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
