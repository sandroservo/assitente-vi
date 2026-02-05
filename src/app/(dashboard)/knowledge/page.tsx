/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { KnowledgeManager } from "./ui/KnowledgeManager";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const knowledgeItems = await prisma.knowledge.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ category: "asc" }, { priority: "desc" }, { title: "asc" }],
  });

  const categories = [...new Set(knowledgeItems.map((item: (typeof knowledgeItems)[number]) => item.category))] as string[];

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <KnowledgeManager 
        initialItems={knowledgeItems} 
        categories={categories}
      />
    </div>
  );
}
