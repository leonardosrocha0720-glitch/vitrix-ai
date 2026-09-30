import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ColorPalette } from "@/lib/palettes";
import type { BusinessExtraData, TipoCTA } from "@/types/business";
import { toBrazilianE164Digits } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Chave para pausar a geração via Claude sem mexer no resto: com true, a rota
// responde 503 antes de debitar crédito (fluxo alternativo: /gerar-prompt).
const GENERATION_DISABLED = false;

export interface GenerateSiteRequest extends BusinessExtraData {
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviewCount: number;
  niche: string;
  city?: string;
  palette: ColorPalette;
}

async function fetchUnsplashImages(query: string, count: number = 5): Promise<string[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&client_id=${accessKey}`
    );
    if (!res.ok) return [];
    const data = await res.json() as { results?: { urls?: { regular?: string } }[] };
    return data.results?.map((p) => p.urls?.regular ?? "").filter(Boolean) ?? [];
  } catch {
    return [];
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

// Traduz nicho para termo de busca em inglês para melhores resultados
function nicheToEnglish(niche: string): string {
  const map: Record<string, string> = {
    dentista: "dental clinic interior professional",
    odontologia: "dental clinic modern professional",
    restaurante: "restaurant interior elegant dining",
    lanchonete: "cafe restaurant food interior",
    pizzaria: "pizza restaurant italian interior",
    salão: "hair salon beauty interior modern",
    barbearia: "barbershop modern interior",
    academia: "gym fitness modern interior",
    farmácia: "pharmacy modern interior",
    clínica: "medical clinic modern interior",
    advocacia: "law office professional interior",
    contabilidade: "accounting office professional",
    imobiliária: "real estate office modern",
    pet: "veterinary clinic pet shop interior",
    mecânica: "auto repair shop professional",
    padaria: "bakery modern interior bread",
    supermercado: "supermarket modern interior",
    escola: "school education modern interior",
  };
  const lower = niche.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  return `${niche} professional business interior`;
}

export async function POST(req: NextRequest) {
  if (GENERATION_DISABLED) {
    return Response.json({ error: "Geração de sites em manutenção." }, { status: 503 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY não configurada." }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Debita ANTES de chamar a Claude. debitar_credito() verifica e desconta na
  // mesma operacao no Postgres, entao cliques simultaneos nao conseguem gerar
  // dois sites com um credito so. Se a geracao falhar, estornamos abaixo.
  const { data: saldo, error: debitoError } = await supabase.rpc("debitar_credito");

  if (debitoError) {
    console.error("[generate-site] Falha ao debitar credito:", debitoError);
    return Response.json({ error: "Erro ao processar créditos" }, { status: 500 });
  }

  if (saldo === null) {
    return Response.json({ error: "Créditos insuficientes" }, { status: 402 });
  }

  const body = (await req.json()) as GenerateSiteRequest;
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

  const client = new Anthropic({ apiKey });

  const searchTerm = nicheToEnglish(niche);
  const images = await fetchUnsplashImages(searchTerm);

  const imageInstructions = images.length > 0
    ? `IMAGENS REAIS — use exatamente estas URLs, não invente outras:
${images.map((url, i) => `Imagem ${i + 1}: ${url}`).join("\n")}
- Hero: Imagem 1 como background-image (bg-cover bg-center) com overlay da cor primary semitransparente por cima
- Sobre nós: Imagem 2 ao lado do texto, com cantos arredondados
- Cards de serviço: Imagens 3, 4 e 5 no topo dos cards (se houver mais cards que imagens, repita na ordem)
- Todas as <img> com alt descritivo, loading="lazy" (exceto o hero) e object-cover`
    : `Sem imagens disponíveis: use gradientes com as cores primary/secondary no hero e ícones SVG inline nos cards de serviço.`;

  const ctaInstructions =
    tipoCTA === "formulario"
      ? `O CTA principal é um FORMULÁRIO DE CONTATO. Todos os botões de CTA do site levam para href="#contato".
A seção CTA final (id="contato") contém um formulário com Nome, Telefone e Mensagem. No submit, um <script> inline curto faz preventDefault e ${whatsappHref ? `abre ${whatsappHref}?text= em nova aba, com os campos preenchidos no texto (encodeURIComponent)` : "mostra uma mensagem de agradecimento no lugar do formulário"}. Nada de backend.`
      : `O CTA principal é "${ctaLabel}". TODOS os botões de CTA (header, hero, CTA final) usam exatamente href="${ctaHref}"${tipoCTA === "whatsapp" ? ' com target="_blank" rel="noopener"' : ""}.`;

  const floatingButton =
    tipoCTA === "ligar"
      ? `BOTÃO FLUTUANTE: fixed bottom-5 right-5 z-50, redondo, bg-primary, ícone SVG de telefone branco, href="${ctaHref}", aria-label="Ligar".`
      : whatsappHref
        ? `BOTÃO FLUTUANTE: fixed bottom-5 right-5 z-50, redondo, fundo #25D366, ícone SVG do WhatsApp branco, href="${whatsappHref}" target="_blank", aria-label="WhatsApp".`
        : "";

  const prompt = `Você é um web designer sênior especializado em sites one-page de alta conversão para pequenos negócios brasileiros.

Crie um site ONE-PAGE moderno e profissional para o negócio abaixo. Use os dados reais — não invente telefone, endereço ou horário.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DADOS DO NEGÓCIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: ${name}
Nicho: ${niche}${city ? `\nCidade: ${city}` : ""}
Endereço: ${address}
Telefone: ${telefone || "Não informado"}
Horário de funcionamento: ${horario || "Não informado (omita o horário do site)"}
Diferencial principal: ${diferencial || "Não informado (deduza diferenciais plausíveis para o nicho)"}
Serviços: ${servicos || `Não informado (use 3 serviços típicos de "${niche}")`}
Avaliação no Google: ${rating !== null ? `${rating.toFixed(1)} estrelas (${reviewCount} avaliações)` : "Não informado"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Uma fonte do Google Fonts (ex.: "Poppins" nos títulos, "Inter" no texto)
- Animações SOMENTE com CSS puro (@keyframes no <style>). PROIBIDO AOS, GSAP, jQuery ou qualquer biblioteca JS externa.
- JavaScript inline só se for estritamente necessário (menu mobile${tipoCTA === "formulario" ? ", submit do formulário" : ""}).

Configure a paleta via tailwind.config ANTES de usar as classes:
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '${palette.primary}',
          secondary: '${palette.secondary}',
          background: '${palette.bg}',
          textMain: '${palette.text}',
        }
      }
    }
  }
</script>

USO DA PALETA (consistente no site inteiro):
- primary: fundo/overlay do hero, TODOS os botões de CTA, títulos em destaque, ícones dos diferenciais, fundo da seção CTA final
- secondary: detalhes e acentos (sublinhados, badges, hover dos botões, estrelas, bordas de destaque)
- background: fundo geral das seções claras; alterne com branco para separar seções
- textMain: cor do texto corrido
Não introduza outras cores de marca além dessas (exceto o verde oficial do WhatsApp no botão flutuante).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ctaInstructions}
${floatingButton}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${imageInstructions}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTRUTURA — gere TODAS as seções, nesta ordem:

0. HEADER fixo e compacto: nome do negócio (logo tipográfico) + links âncora para as seções (escondidos no mobile, com menu hambúrguer) + botão CTA.
1. HERO (min-h-screen): título impactante e específico para o nicho (não genérico), subtítulo de 1 frase com o benefício principal${city ? ` e a cidade (${city})` : ""}, botão CTA grande. ${rating !== null ? "Mostre um selo com a nota do Google e as estrelas SVG." : ""}
2. SOBRE NÓS (id="sobre"): 2-3 frases sobre o negócio, incorporando o diferencial principal.
3. SERVIÇOS (id="servicos"): um card por serviço (grid 1 coluna no mobile, 2-3 no desktop), cada um com título e descrição curta e concreta.
4. POR QUE NOS ESCOLHER (id="diferenciais"): exatamente 3 diferenciais, cada um com ícone SVG inline (stroke, 24x24, cor primary), título curto e 1 frase. O primeiro deve ser o diferencial principal informado.
5. DEPOIMENTOS (id="depoimentos"): exatamente 2 depoimentos fictícios mas realistas para o nicho — nome brasileiro + bairro/cidade, 5 estrelas SVG, texto de 2 frases que cite um serviço específico. ${rating !== null ? `Acima deles, destaque "${rating.toFixed(1)} no Google · ${reviewCount} avaliações".` : ""}
6. CTA FINAL (id="contato"): faixa em bg-primary com chamada forte e o botão CTA${tipoCTA === "formulario" ? " + o formulário" : ""}.
7. FOOTER: nome, endereço, telefone clicável${horario ? ", horário de funcionamento" : ""}, link "Ver no Google Maps" (https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}), copyright com o ano atual.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. CRÍTICO: HTML COMPLETO do <!DOCTYPE html> até </html>. Nunca corte no meio — se precisar, encurte textos e classes, mas gere todas as seções.
2. MOBILE-FIRST: estilos base para celular, depois sm:/md:/lg:. Nada pode estourar a largura da tela; botões com área de toque >= 44px; textos legíveis no celular.
3. Animações: defina no <style> um @keyframes fadeUp (opacity 0 + translateY(24px) → visível) e aplique com delays escalonados nos elementos do hero e nos cards. Respeite @media (prefers-reduced-motion: reduce) desativando as animações. Hover suave (transition) em cards e botões.
4. ZERO emojis. Ícones apenas em SVG inline.
5. Português do Brasil, textos específicos para "${niche}" — nada de lorem ipsum ou frases genéricas.
6. <html lang="pt-BR">, <meta name="viewport">, <title> e <meta name="description"> com nome e nicho${city ? " e cidade" : ""}.
7. Retorne APENAS o HTML, começando em <!DOCTYPE html>. Sem markdown, sem explicações.
`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
    });

    let html = (message.content[0] as { type: string; text: string }).text;
    // Remove markdown code blocks caso o modelo os inclua
    html = html.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/i, "").trim();

    await supabase.from("generated_sites").insert({
      user_id: user.id,
      business_name: name,
      niche,
      city: city ?? null,
      palette: palette.name,
    });

    return Response.json({ html });
  } catch (err) {
    // A geracao falhou depois do debito: devolve o credito.
    // Usa o service role de proposito — expor um "estornar" ao usuario
    // autenticado seria um jeito trivial de gerar creditos do nada.
    try {
      const admin = createAdminClient();
      const { data: p } = await admin
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      if (p) {
        await admin
          .from("profiles")
          .update({ credits: p.credits + 1 })
          .eq("id", user.id);
      }
      console.log(`[generate-site] Credito estornado para ${user.id} apos falha na geracao.`);
    } catch (estornoErr) {
      console.error("[generate-site] FALHA NO ESTORNO — usuario perdeu 1 credito:", user.id, estornoErr);
    }

    const msg = err instanceof Error ? err.message : "Erro ao gerar site.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
