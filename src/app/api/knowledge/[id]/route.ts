/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * API para gerenciar conhecimento individual
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getKnowledgeById,
  updateKnowledge,
  deleteKnowledge,
} from "@/lib/knowledge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const knowledge = await getKnowledgeById(id);

    if (!knowledge) {
      return NextResponse.json(
        { ok: false, error: "Conhecimento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, knowledge });
  } catch (error) {
    console.error("Erro ao buscar conhecimento:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao buscar conhecimento" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const knowledge = await updateKnowledge(id, {
      category: body.category,
      title: body.title,
      content: body.content,
      keywords: body.keywords,
      priority: body.priority,
      active: body.active,
    });

    return NextResponse.json({ ok: true, knowledge });
  } catch (error) {
    console.error("Erro ao atualizar conhecimento:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao atualizar conhecimento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteKnowledge(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao deletar conhecimento:", error);
    return NextResponse.json(
      { ok: false, error: "Erro ao deletar conhecimento" },
      { status: 500 }
    );
  }
}
