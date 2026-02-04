/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

import { prisma } from "@/lib/prisma";
import { KnowledgeManager } from "./ui/KnowledgeManager";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const knowledgeItems = await prisma.knowledge.findMany({
    orderBy: [{ category: "asc" }, { priority: "desc" }, { title: "asc" }],
  });

  const categories = [...new Set(knowledgeItems.map((item: typeof knowledgeItems[number]) => item.category))] as string[];

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      <KnowledgeManager 
        initialItems={knowledgeItems} 
        categories={categories}
      />
    </div>
  );
}
