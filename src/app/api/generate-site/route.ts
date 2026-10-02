import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ColorPalette } from "@/lib/palettes";
import type { BusinessExtraData, TipoCTA } from "@/types/business";
import { toBrazilianE164Digits } from "@/lib/phone";
import { getRandomImages } from "@/lib/niches";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSiteHtml, getGenerationProvider, getProviderApiKey } from "@/lib/siteGenerators";
import { buildHtmlFromTemplate, type SiteJsonData } from "@/lib/templateEngine";

export const runtime = "nodejs";

const GENERATION_DISABLED = false;

export interface GenerateSiteRequest extends BusinessExtraData {
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviewCount: number;
  niche: string;
  city?: string;
  nicheId?: string;
  palette: ColorPalette;
}

const IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function imageToDataUri(publicPath: string): Promise<string | null> {
  const mime = IMAGE_MIME[path.extname(publicPath).toLowerCase()];
  if (!mime) return null;
  try {
    const buffer = await readFile(path.join(process.cwd(), "public", publicPath));
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Verifica se o nicho tem template próprio em src/templates/<id>.html */
async function hasTemplate(nicheId: string): Promise<boolean> {
  if (!nicheId) return false;
  try {
    await readFile(path.join(process.cwd(), "src", "templates", `${nicheId}.html`));
    return true;
  } catch {
    return false;
  }
}

function buildCtaHref(tipoCTA: TipoCTA, phoneDigits: string): string {
  if (tipoCTA === "ligar") return `tel:+${phoneDigits}`;
  if (tipoCTA === "formulario") return "#contato";
  const text = encodeURIComponent("Olá! Vim pelo site e gostaria de mais informações.");
  return `https://wa.me/${phoneDigits}?text=${text}`;
}

const CTA_LABELS: Record<TipoCTA, string> = {
  whatsapp: "Falar no WhatsApp",
  ligar: "Ligar agora",
  formulario: "Solicitar contato",
};

// ── Prompt JSON (template flow) ───────────────────────────────────────────────
function buildJsonPrompt(body: GenerateSiteRequest): string {
  const { name, address, rating, reviewCount, niche, city } = body;
  const telefone = body.telefone?.trim() || body.phone || "";
  const horario = body.horario?.trim();
  const diferencial = body.diferencial?.trim();
  const servicos = body.servicos?.trim();

  return `Você é um copywriter especializado em sites de pequenos negócios brasileiros.

Gere um JSON com os textos para o site de "${name}", um(a) ${niche}${city ? ` em ${city}` : ""}.

DADOS:
- Endereço: ${address}
- Telefone: ${telefone || "não informado"}
- Horário: ${horario || "não informado"}
- Diferencial: ${diferencial || "não informado"}
- Serviços: ${servicos || `liste 3 serviços típicos de "${niche}"`}
- Avaliação: ${rating !== null ? `${rating?.toFixed(1)} estrelas (${reviewCount} avaliações)` : "não informado"}

REGRAS:
- Português do Brasil, textos específicos e criativos para "${niche}" — nada de genérico
- tituloHero: frase impactante de até 8 palavras, menciona o nicho${city ? ` e ${city}` : ""}
- subtituloHero: benefício principal em 1 frase (máx 15 palavras)
- Exatamente 3 serviços, 3 diferenciais, 2 depoimentos com nomes e bairros brasileiros realistas
- depoimentos: nome completo brasileiro + bairro/cidade (ex: "Carlos Silva — Bairro Novo, SP")
- Retorne APENAS o JSON válido, sem markdown, sem explicações

JSON esperado (preencha todos os campos):
{
  "metaDescricao": "string (máx 155 chars, inclui nome, nicho${city ? `, ${city}` : ""} e diferencial principal)",
  "tituloHero": "string",
  "subtituloHero": "string",
  "tituloSobre": "string (ex: 'A Melhor Hamburgueria do Bairro')",
  "textoSobre1": "string (2-3 frases sobre a história/propósito)",
  "textoSobre2": "string (2-3 frases sobre qualidade/compromisso, menciona o diferencial)",
  "tituloServicos": "string (ex: 'Nosso Cardápio')",
  "servicos": [
    { "nome": "string", "descricao": "string (1-2 frases concretas)", "preco": "string opcional (ex: 'A partir de R$ 35')" },
    { "nome": "string", "descricao": "string", "preco": "string opcional" },
    { "nome": "string", "descricao": "string", "preco": "string opcional" }
  ],
  "tituloDiferenciais": "string (ex: 'Por Que Nos Escolher?')",
  "diferenciais": [
    { "titulo": "string", "descricao": "string (1 frase)" },
    { "titulo": "string", "descricao": "string" },
    { "titulo": "string", "descricao": "string" }
  ],
  "depoimentos": [
    { "nome": "string", "local": "string (bairro + cidade)", "texto": "string (2 frases, cita serviço específico)" },
    { "nome": "string", "local": "string", "texto": "string" }
  ],
  "tituloCta": "string (chamada forte, máx 8 palavras)",
  "subtituloCta": "string (1 frase motivando contato)"
}`;
}

// ── Prompt HTML legado (fallback para nichos sem template) ────────────────────
function buildLegacyHtmlPrompt(
  body: GenerateSiteRequest,
  nicheImageDataUris: string[],
  aboutImage: string | undefined,
): string {
  const { name, address, rating, reviewCount, niche, city, palette } = body;
  const telefone = body.telefone?.trim() || body.phone || "";
  const horario = body.horario?.trim();
  const diferencial = body.diferencial?.trim();
  const servicos = body.servicos?.trim();
  const tipoCTA: TipoCTA = body.tipoCTA ?? "whatsapp";
  const phoneDigits = toBrazilianE164Digits(telefone);
  const ctaHref = buildCtaHref(tipoCTA, phoneDigits);
  const ctaLabel = CTA_LABELS[tipoCTA];
  const whatsappHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null;

  const aboutInstruction = aboutImage
    ? `- Sobre nós: use esta imagem ao lado do texto: ${aboutImage}`
    : `- Sobre nós: use bloco em gradiente primary→secondary no lugar da imagem.`;

  const servicesInstruction = nicheImageDataUris.length > 0
    ? `- Cards de serviço: use estas imagens nos cards (uma por card, na ordem):\n${nicheImageDataUris.map((uri, i) => `  Card ${i + 1}: <img src="${uri}" alt="..." class="w-full h-48 object-cover">`).join("\n")}`
    : `- Cards de serviço: use ícones SVG inline — sem imagens externas.`;

  const ctaInstructions = tipoCTA === "formulario"
    ? `CTA: formulário de contato em #contato. No submit, abre ${whatsappHref ?? "#"} com os dados preenchidos.`
    : `CTA: "${ctaLabel}". Todos os botões usam href="${ctaHref}"${tipoCTA === "whatsapp" ? ' target="_blank"' : ""}.`;

  const floatingButton = tipoCTA === "ligar"
    ? `Botão flutuante: fixed bottom-5 right-5, redondo, bg-primary, ícone telefone branco, href="tel:+${phoneDigits}".`
    : whatsappHref
    ? `Botão flutuante: fixed bottom-5 right-5, redondo, #25D366, ícone WhatsApp branco, href="${whatsappHref}" target="_blank".`
    : "";

  return `Crie um site one-page profissional para "${name}" (${niche}${city ? `, ${city}` : ""}).

DADOS: Endereço: ${address} | Tel: ${telefone || "omitir"} | Horário: ${horario || "omitir"} | Diferencial: ${diferencial || "deduzir"} | Serviços: ${servicos || `3 típicos de ${niche}`} | Avaliação: ${rating !== null ? `${rating?.toFixed(1)}★ (${reviewCount})` : "omitir"}

PALETA — tailwind.config: primary:${palette.primary}, secondary:${palette.secondary}, background:${palette.bg}, textMain:${palette.text}
${ctaInstructions}
${floatingButton}

IMAGENS:
- Hero: gradiente CSS from-primary to-secondary, SEM imagem de fundo
${aboutInstruction}
${servicesInstruction}

SEÇÕES (todas, nesta ordem): Header fixo → Hero (min-h-screen, gradiente) → Sobre → Serviços (3 cards) → Diferenciais (3) → Depoimentos (2 fictícios realistas) → CTA final → Footer.

STACK: Tailwind CDN, Google Fonts (Poppins títulos + Inter texto), animações @keyframes CSS puro, sem AOS/GSAP/jQuery.
REGRAS: HTML completo do DOCTYPE ao /html, mobile-first, PT-BR, sem lorem ipsum.
Retorne SOMENTE o HTML, começando em <!DOCTYPE html>.`;
}

export async function POST(req: NextRequest) {
  if (GENERATION_DISABLED) {
    return Response.json({ error: "Geração de sites em manutenção." }, { status: 503 });
  }

  const provider = getGenerationProvider();
  const { env: apiKeyEnv, key: apiKey } = getProviderApiKey(provider);
  if (!apiKey) {
    return Response.json({ error: `${apiKeyEnv} não configurada.` }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const { data: saldo, error: debitoError } = await supabase.rpc("debitar_credito");
  if (debitoError) {
    console.error("[generate-site] Falha ao debitar credito:", debitoError);
    return Response.json({ error: "Erro ao processar créditos" }, { status: 500 });
  }
  if (saldo === null) {
    return Response.json({ error: "Créditos insuficientes" }, { status: 402 });
  }

  const body = (await req.json()) as GenerateSiteRequest;
  const { name, address, rating, reviewCount, niche, city, nicheId, palette } = body;
  const telefone = body.telefone?.trim() || body.phone || "";
  const tipoCTA: TipoCTA = body.tipoCTA ?? "whatsapp";
  const phoneDigits = toBrazilianE164Digits(telefone);
  const ctaHref = buildCtaHref(tipoCTA, phoneDigits);
  const ctaLabel = CTA_LABELS[tipoCTA];

  // Imagens do nicho (base64)
  const nicheImagePaths = nicheId ? getRandomImages(nicheId, 3) : [];
  const nicheImageDataUris = (
    await Promise.all(nicheImagePaths.map(imageToDataUri))
  ).filter((uri): uri is string => uri !== null);

  try {
    let html: string;
    const useTemplate = nicheId ? await hasTemplate(nicheId) : false;

    if (useTemplate && nicheId) {
      // ── FLUXO RÁPIDO: pede JSON, monta HTML via template ────────────────
      const jsonPrompt = buildJsonPrompt(body);
      const rawJson = await generateSiteHtml(provider, jsonPrompt, apiKey);

      // Limpa possíveis ```json ... ``` do modelo
      const cleaned = rawJson
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      let json: SiteJsonData;
      try {
        json = JSON.parse(cleaned) as SiteJsonData;
      } catch {
        throw new Error(`Modelo não retornou JSON válido: ${cleaned.slice(0, 200)}`);
      }

      html = await buildHtmlFromTemplate(nicheId, {
        json,
        nomeNegocio: name,
        nicho: niche,
        cidade: city,
        endereco: address,
        telefone,
        horario: body.horario?.trim(),
        rating,
        reviewCount,
        palette,
        tipoCTA,
        ctaHref,
        ctaLabel,
        nicheImageDataUris,
        aboutImageSrc: nicheImageDataUris[0],
      });
    } else {
      // ── FLUXO LEGADO: gera HTML completo (nichos sem template) ───────────
      const legacyPrompt = buildLegacyHtmlPrompt(body, nicheImageDataUris, nicheImageDataUris[0]);
      const raw = await generateSiteHtml(provider, legacyPrompt, apiKey);
      html = raw;
    }

    await supabase.from("generated_sites").insert({
      user_id: user.id,
      business_name: name,
      niche,
      city: city ?? null,
      palette: palette.name,
    });

    return Response.json({ html });
  } catch (err) {
    // Estorno de crédito em caso de falha
    try {
      const admin = createAdminClient();
      const { data: p } = await admin.from("profiles").select("credits").eq("id", user.id).single();
      if (p) await admin.from("profiles").update({ credits: p.credits + 1 }).eq("id", user.id);
      console.log(`[generate-site] Credito estornado para ${user.id} apos falha.`);
    } catch (estornoErr) {
      console.error("[generate-site] FALHA NO ESTORNO:", user.id, estornoErr);
    }

    const msg = err instanceof Error ? err.message : "Erro ao gerar site.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
