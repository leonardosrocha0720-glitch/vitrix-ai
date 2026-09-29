import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const creditsVitalicio = () => parseInt(process.env.CREDITS_VITALICIO ?? "500", 10);
const creditsMensalPro = () => parseInt(process.env.CREDITS_MENSAL_PRO ?? "100", 10);

/**
 * Decide quantos créditos a compra vale.
 *
 * ATENÇÃO: na ApplyFy os planos são OFERTAS de um mesmo produto, então
 * `product.name` chega como "Vitrix AI" nas duas compras — o nome do produto
 * sozinho não distingue Mensal PRO de Vitalício. A ordem abaixo vai do sinal
 * mais confiável para o menos confiável.
 */
function getCreditsByPlan(offerName: string, offerCode: string, amount: number): number {
  // 1) Código da oferta (exato e estável). Definir nas env vars quando conhecido.
  const codeVitalicio = process.env.APLIFAY_OFFER_CODE_VITALICIO?.trim();
  const codeMensal = process.env.APLIFAY_OFFER_CODE_MENSAL?.trim();

  if (codeVitalicio && offerCode && offerCode === codeVitalicio) {
    console.log(`[Aplifay Webhook] Plano por offerCode (${offerCode}): vitalício`);
    return creditsVitalicio();
  }
  if (codeMensal && offerCode && offerCode === codeMensal) {
    console.log(`[Aplifay Webhook] Plano por offerCode (${offerCode}): mensal`);
    return creditsMensalPro();
  }

  // 2) Nome, quando ele de fato descreve o plano
  const lower = offerName.toLowerCase().trim();
  if (/vital[ií]cio|lifetime/.test(lower)) {
    console.log(`[Aplifay Webhook] Plano por nome ("${offerName}"): vitalício`);
    return creditsVitalicio();
  }
  if (/mensal|monthly|\bpro\b/.test(lower)) {
    console.log(`[Aplifay Webhook] Plano por nome ("${offerName}"): mensal`);
    return creditsMensalPro();
  }

  // 3) Valor pago. Acima do limiar tratamos como vitalício.
  const limiar = parseInt(process.env.APLIFAY_VALOR_MIN_VITALICIO ?? "300", 10);
  if (amount > 0) {
    const plano = amount >= limiar ? "vitalício" : "mensal";
    console.warn(
      `[Aplifay Webhook] offerCode "${offerCode}" e nome "${offerName}" não identificaram o plano. ` +
        `Decidido pelo valor R$ ${amount} (limiar ${limiar}): ${plano}.`,
    );
    return amount >= limiar ? creditsVitalicio() : creditsMensalPro();
  }

  console.error(
    `[Aplifay Webhook] Plano indeterminado (offerCode "${offerCode}", nome "${offerName}", valor ${amount}). ` +
      "Concedendo o menor plano. Configure APLIFAY_OFFER_CODE_VITALICIO e APLIFAY_OFFER_CODE_MENSAL.",
  );
  return creditsMensalPro();
}

type ParsedPayload = {
  email: string;
  offerName: string;
  offerCode: string;
  amount: number;
  status: string;
  event: string;
};

/**
 * Formato oficial do webhook ApplyFy — app.applyfy.com.br/docs/v1/webhooks/payment
 *
 * {
 *   "event": "TRANSACTION_PAID",
 *   "token": "<token de validação>",
 *   "offerCode": "ABCK181",
 *   "client":      { "name", "email", "phone", "cpf", ... },
 *   "transaction": { "status", "orderItems": [ { "product": { "name" } } ], ... }
 * }
 */
function parseAplifayPayload(body: Record<string, unknown>): ParsedPayload | null {
  const event = String(body.event ?? "");

  const client = body.client as Record<string, unknown> | undefined;
  const transaction = body.transaction as Record<string, unknown> | undefined;

  // Email do comprador. body.email é só um fallback defensivo.
  const rawEmail = (client?.email ?? body.email) as string | undefined;
  const email = rawEmail ? String(rawEmail).toLowerCase().trim() : "";

  // Nome do produto comprado (primeiro item do pedido)
  let offerName = "";
  const orderItems = transaction?.orderItems as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(orderItems) && orderItems.length > 0) {
    const product = orderItems[0]?.product as Record<string, unknown> | undefined;
    if (product?.name) offerName = String(product.name);
  }
  const offerCode = body.offerCode ? String(body.offerCode) : "";

  // Valor pago, usado para distinguir os planos quando nome/código não bastam
  let amount = Number(transaction?.amount ?? 0);
  if (!amount && Array.isArray(orderItems) && orderItems.length > 0) {
    amount = Number(orderItems[0]?.price ?? 0);
  }
  if (!Number.isFinite(amount)) amount = 0;

  const status = String(transaction?.status ?? event);

  // offerCode sozinho já identifica a compra, mesmo sem nome de produto
  if (email && (offerName || offerCode)) {
    return { email, offerName: offerName || offerCode, offerCode, amount, status, event };
  }

  return null;
}

// Só libera acesso em pagamento confirmado.
// Com "event" presente exigimos TRANSACTION_PAID — TRANSACTION_CREATED também
// pode vir com status COMPLETED, então o evento manda.
function isApproved(event: string, status: string): boolean {
  if (event) return event.toUpperCase() === "TRANSACTION_PAID";
  return ["COMPLETED", "PAID", "APPROVED", "PAGO", "APROVADO"].includes(status.toUpperCase());
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    // Log sem o token, para não vazar credencial nos logs
    const safeBody = { ...body };
    delete safeBody.token;
    console.log("[Aplifay Webhook] Payload:", JSON.stringify(safeBody));

    // A ApplyFy envia o token de validação no CORPO (campo "token").
    // Query string e headers ficam como alternativas aceitas.
    const secret = process.env.APLIFAY_WEBHOOK_SECRET;
    if (secret && secret !== "trocar_depois") {
      const candidates = [
        typeof body.token === "string" ? body.token : null,
        req.nextUrl.searchParams.get("secret"),
        req.nextUrl.searchParams.get("token"),
        req.headers.get("x-aplifay-secret"),
        req.headers.get("x-applyfy-token"),
        req.headers.get("x-webhook-token"),
        req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null,
      ].filter((v): v is string => Boolean(v));

      if (!candidates.includes(secret)) {
        console.warn("[Aplifay Webhook] Token de validação inválido. Requisição recusada.");
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const parsed = parseAplifayPayload(body);

    if (!parsed) {
      console.error("[Aplifay Webhook] Payload sem email ou produto:", JSON.stringify(safeBody));
      return Response.json({ error: "Payload não reconhecido" }, { status: 400 });
    }

    const { email, offerName, offerCode, amount, status, event } = parsed;

    if (!isApproved(event, status)) {
      console.log(`[Aplifay Webhook] Evento "${event}" (status "${status}") ignorado para ${email}.`);
      return Response.json({ ok: true, message: `Evento "${event}" ignorado` });
    }

    const credits = getCreditsByPlan(offerName, offerCode, amount);
    const supabase = createAdminClient();

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`[Aplifay Webhook] Usuário existente: ${email} (${userId})`);

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      const currentCredits = profile?.credits ?? 0;

      await supabase
        .from("profiles")
        .update({ credits: currentCredits + credits })
        .eq("id", userId);

      console.log(`[Aplifay Webhook] +${credits} créditos para ${email}. Total: ${currentCredits + credits}`);
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError || !newUser?.user) {
        console.error("[Aplifay Webhook] Erro ao criar usuário:", createError);
        return Response.json({ error: "Erro ao criar usuário" }, { status: 500 });
      }

      userId = newUser.user.id;
      console.log(`[Aplifay Webhook] Novo usuário criado: ${email} (${userId})`);

      // Aguarda o trigger on_auth_user_created montar o perfil
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      const baseCredits = profile?.credits ?? 0;
      await supabase
        .from("profiles")
        .update({ credits: baseCredits + credits })
        .eq("id", userId);

      console.log(`[Aplifay Webhook] Perfil de ${email} com ${baseCredits + credits} créditos`);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vitrix-ai.vercel.app";
      const { error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: `${appUrl}/dashboard` },
      });

      if (magicLinkError) {
        console.warn("[Aplifay Webhook] Erro ao gerar magic link:", magicLinkError);
      } else {
        console.log(`[Aplifay Webhook] Magic link enviado para ${email}`);
      }
    }

    return Response.json({
      ok: true,
      message: "Conta processada com sucesso",
      email,
      credits_added: credits,
      plan: offerName,
    });
  } catch (err) {
    console.error("[Aplifay Webhook] Erro inesperado:", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Health check — a ApplyFy pode fazer GET para verificar se o endpoint está ativo
export async function GET() {
  return Response.json({ status: "Vitrix AI Webhook OK" });
}
