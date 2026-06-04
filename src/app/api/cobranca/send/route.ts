/**
 * Dispara a mensagem padrão de cobrança no WhatsApp do cliente (via sistema).
 * POST /api/cobranca/send  { userId?, asaasCustomerId? }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enviarCobranca } from "@/lib/amovidas-api";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { userId, asaasCustomerId } = body;

  if (!userId && !asaasCustomerId) {
    return NextResponse.json(
      { ok: false, error: "Informe userId ou asaasCustomerId" },
      { status: 400 }
    );
  }

  const result = await enviarCobranca({
    userId: userId ?? null,
    asaasCustomerId: asaasCustomerId ?? null,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
