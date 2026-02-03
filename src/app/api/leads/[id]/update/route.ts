/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * 
 * Endpoint para atualizar dados do lead (nome, email, telefone, resumo)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { name, email, phone, city, notes, summary } = body;

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;
    if (notes) updateData.notes = notes;
    if (summary) updateData.summary = summary;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: "no fields to update" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    console.error("Update lead error:", error);
    return NextResponse.json(
      { ok: false, error: "internal error" },
      { status: 500 }
    );
  }
}
