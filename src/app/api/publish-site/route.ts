import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function generateSlug(businessName: string): string {
  const base = businessName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 40);
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Publicar NAO consome credito: o custo real esta na geracao (API da Claude),
  // e publicar e a acao que gera o link de venda. Tambem nao exigimos saldo,
  // senao quem gerou o site e zerou os creditos ficaria sem conseguir publicar
  // aquilo que ja pagou.

  const body = await req.json();
  const { htmlContent, businessName } = body;

  if (!htmlContent || !businessName) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const slug = generateSlug(businessName);

  const { data: site, error } = await supabase
    .from("published_sites")
    .insert({
      user_id: user.id,
      slug,
      business_name: businessName,
      html_content: htmlContent,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao publicar" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    slug,
    url: `${appUrl}/s/${slug}`,
    siteId: site.id,
  });
}
