/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ChatComposer from "./ui/ChatComposer";
import HandoffButton from "./ui/HandoffButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, MapPin, Bot, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      lead: true,
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });

  if (!convo) return notFound();

  return (
    <div className="h-[calc(100vh-4rem)] p-6 grid grid-cols-12 gap-4">
      <Card className="col-span-12 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{convo.lead.name ?? "Sem nome"}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {convo.lead.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{convo.lead.phone}</span>
            </div>
            {convo.lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{convo.lead.email}</span>
              </div>
            )}
            {convo.lead.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{convo.lead.city}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            {convo.lead.ownerType === "bot" ? (
              <>
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Vi (Bot)</span>
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Atendimento Humano</span>
              </>
            )}
          </div>

          <Separator />

          <HandoffButton
            leadId={convo.leadId}
            isHuman={convo.lead.ownerType === "human"}
          />

          {convo.lead.summary && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-1">Resumo</p>
                <p className="text-sm text-muted-foreground">{convo.lead.summary}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-9 flex flex-col">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Conversa</CardTitle>
        </CardHeader>
        <Separator />
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {convo.messages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma mensagem ainda
              </p>
            )}
            {convo.messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.direction === "out" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    m.direction === "out"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      m.direction === "out"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {m.createdAt.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="p-4">
          <ChatComposer conversationId={convo.id} />
        </div>
      </Card>
    </div>
  );
}
