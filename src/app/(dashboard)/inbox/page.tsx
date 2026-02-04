/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const convos = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: { lead: true },
    take: 50,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-muted-foreground">
          {convos.length} conversa{convos.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {convos.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma conversa ainda</p>
            </CardContent>
          </Card>
        )}

        {convos.map((c) => (
          <Link key={c.id} href={`/inbox/${c.id}`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {c.lead.name ?? c.lead.phone}
                      </CardTitle>
                      {c.lead.name && (
                        <p className="text-xs text-muted-foreground">
                          {c.lead.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {c.unreadCount > 0 && (
                    <Badge variant="default">{c.unreadCount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{c.lead.status}</Badge>
                  {c.lead.ownerType === "human" && (
                    <Badge variant="secondary">Humano</Badge>
                  )}
                </div>
                {c.lastMessageAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(c.lastMessageAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
