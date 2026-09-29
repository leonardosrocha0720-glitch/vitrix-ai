import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Mapeia o nome da oferta para a variável de créditos correspondente
function getCreditsByPlan(offerName: string): number {
  const lower = offerName.toLowerCase().trim();

  if (lower.includes("vitalício") || lower.includes("vitalicio") || lower.includes("lifetime")) {
    return parseInt(process.env.CREDITS_VITALICIO ?? "500", 10);
  }

  if (lower.includes("mensal") || lower.includes("pro") || lower.includes("monthly")) {
    return parseInt(process.env.CREDITS_MENSAL_PRO ?? "100", 10);
  }

  // Fallback: plano não reconhecido — loga e usa o menor plano
  console.warn(`[Aplifay Webhook] Plano não reconhecido: "${offerName}". Usando CREDITS_MENSAL_PRO como fallback.`);
  return parseInt(process.env.CREDITS_MENSAL_PRO ?? "100", 10);
}

// Extrai email e nome da oferta do payload da Aplifay
// ATENÇÃO: ajuste aqui quando souber o formato real do webhook
function parseAplifayPayload(body: Record<string, unknown>): { email: string; offerName: string; status: string } | null {
  // Log completo do payload para debug (visível nos logs do Vercel)
  console.log("[Aplifay Webhook] Payload recebido:", JSON.stringify(body, null, 2));

  // Tentativa 1: estrutura aninhada { data: { customer: { email }, product/offer: { name } } }
  const data = body.data as Record<string, unknown> | undefined;
  if (data) {
    const customer = data.customer as Record<string, unknown> | undefined;
    const product = (data.product ?? data.offer ?? data.plan) as Record<string, unknown> | undefined;
    const status = (data.status ?? body.status ?? body.event ?? "") as string;

    if (customer?.email && product?.name) {
      return {
        email: String(customer.email).toLowerCase().trim(),
        offerName: String(product.name),
        status: String(status),
      };
    }
  }

  // Tentativa 2: estrutura plana { email, offer_name / product_name / plan_name, status }
  const email =
    (body.email ?? body.customer_email ?? body.buyer_email) as string | undefined;
  const offerName =
    (body.offer_name ?? body.product_name ?? body.plan_name ?? body.plan ?? body.product) as string | undefined;
  const status = (body.status ?? body.event ?? "") as string;

  if (email && offerName) {
    return {
      email: String(email).toLowerCase().trim(),
      offerName: String(offerName),
      status: String(status),
    };
  }

  // Tentativa 3: estrutura da Aplifay com "compra" ou "transaction"
  const compra = (body.compra ?? body.transaction ?? body.purchase) as Record<string, unknown> | undefined;
  if (compra) {
    const emailVal = (compra.email ?? compra.customer_email) as string | undefined;
    const offerVal = (compra.offer ?? compra.product ?? compra.plan) as string | undefined;
    const statusVal = (compra.status ?? body.status ?? "") as string;
    if (emailVal && offerVal) {
      return {
        email: String(emailVal).toLowerCase().trim(),
        offerName: String(offerVal),
        status: String(statusVal),
      };
    }
  }

  return null;
}

function isApprovedStatus(status: string): boolean {
  const approved = ["approved", "aprovado", "paid", "pago", "completed", "complete", "success", "active", "purchase.approved", "payment.approved"];
  return approved.some((s) => status.toLowerCase().includes(s));
}

export async function POST(req: NextRequest) {
  try {
    // Validação do secret (header ou query param)
    const secret = process.env.APLIFAY_WEBHOOK_SECRET;
    if (secret && secret !== "trocar_depois") {
      const headerSecret =
        req.headers.get("x-aplifay-secret") ??
        req.headers.get("x-webhook-secret") ??
        req.headers.get("authorization")?.replace("Bearer ", "");
      const querySecret = req.nextUrl.searchParams.get("secret");
      const receivedSecret = headerSecret ?? querySecret;

      if (receivedSecret !== secret) {
        console.warn("[Aplifay Webhook] Secret inválido. Recebido:", receivedSecret);
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await req.json()) as Record<string, unknown>;
    const parsed = parseAplifayPayload(body);

    if (!parsed) {
      console.error("[Aplifay Webhook] Não foi possível extrair email/oferta do payload:", JSON.stringify(body));
      return Response.json({ error: "Payload não reconhecido" }, { status: 400 });
    }

    const { email, offerName, status } = parsed;

    // Processa somente pagamentos aprovados
    if (!isApprovedStatus(status)) {
      console.log(`[Aplifay Webhook] Status "${status}" ignorado para ${email}.`);
      return Response.json({ ok: true, message: `Status "${status}" ignorado` });
    }

    const credits = getCreditsByPlan(offerName);
    const supabase = createAdminClient();

    // Verifica se o usuário já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    let userId: string;

    if (existingUser) {
      // Usuário já existe: apenas adiciona créditos
      userId = existingUser.id;
      console.log(`[Aplifay Webhook] Usuário existente encontrado: ${email} (${userId})`);

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

      console.log(`[Aplifay Webhook] Créditos adicionados: +${credits} para ${email}. Total: ${currentCredits + credits}`);
    } else {
      // Usuário novo: cria a conta
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

      // Aguarda o trigger do Supabase criar o perfil (criado via trigger on_auth_user_created)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Atualiza créditos (o trigger cria com 50 free, somamos os do plano)
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

      console.log(`[Aplifay Webhook] Perfil atualizado: ${email} com ${baseCredits + credits} créditos`);

      // Envia magic link para o usuário acessar a conta
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vitrix-ai.vercel.app";
      const { error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${appUrl}/dashboard`,
        },
      });

      if (magicLinkError) {
        console.warn("[Aplifay Webhook] Erro ao gerar magic link:", magicLinkError);
        // Não retorna erro — conta foi criada com sucesso
      } else {
        console.log(`[Aplifay Webhook] Magic link enviado para ${email}`);
      }
    }

    return Response.json({
      ok: true,
      message: `Conta processada com sucesso`,
      email,
      credits_added: credits,
      plan: offerName,
    });
  } catch (err) {
    console.error("[Aplifay Webhook] Erro inesperado:", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

// Permite que a Aplifay faça GET para verificar se o endpoint está ativo
export async function GET() {
  return Response.json({ status: "Vitrix AI Webhook OK" });
}
