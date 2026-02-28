/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 *
 * CRUD de contatos salvos (clínicas, médicos, etc.)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    const org = await prisma.organization.findFirst({ orderBy: { name: "asc" } });
    if (!org) {
      return NextResponse.json({ ok: true, contacts: [] });
    }

    const contacts = await prisma.savedContact.findMany({
      where: {
        organizationId: org.id,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { organization: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    // Ordena: contatos com nome legível primeiro, depois os sem nome
    const hasLetters = /[a-zA-ZÀ-ÿ]/;
    const sorted = contacts.sort((a, b) => {
      const aHasName = hasLetters.test(a.name);
      const bHasName = hasLetters.test(b.name);
      if (aHasName && !bHasName) return -1;
      if (!aHasName && bHasName) return 1;
      return a.name.localeCompare(b.name, "pt-BR");
    });

    return NextResponse.json({ ok: true, contacts: sorted });
  } catch (error) {
    console.error("[Saved Contacts] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name, phone, organization, category, email } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "Nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findFirst({ orderBy: { name: "asc" } });
    if (!org) {
      return NextResponse.json(
        { ok: false, error: "Organização não encontrada" },
        { status: 404 }
      );
    }

    const contact = await prisma.savedContact.create({
      data: {
        organizationId: org.id,
        name,
        phone: phone.replace(/\D/g, ""),
        organization: organization || null,
        category: category || "clinica",
        email: email || null,
      },
    });

    return NextResponse.json({ ok: true, contact });
  } catch (error) {
    console.error("[Saved Contacts] POST error:", error);
    return NextResponse.json(
      { ok: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
