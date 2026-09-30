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

export const runtime = "nodejs";

// Chave para pausar a geração via IA sem mexer no resto: com true, a rota
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
  nicheId?: string; // id em src/lib/niches.ts — banco de imagens próprio do nicho
  palette: ColorPalette;
}

const IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Lê uma imagem de public/ e devolve data URI. Base64 porque o preview é um
// <iframe srcDoc> sem origem (caminho relativo não carrega) e o HTML baixado
// precisa funcionar sozinho.
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

// O modelo recebe só marcadores; o base64 (dezenas de milhares de tokens por
// imagem) entra no HTML depois da geração.
const NICHE_IMAGE_PLACEHOLDER = /\{\{NICHE_IMAGE_(\d+)\}\}/g;

function injectNicheImages(html: string, dataUris: string[]): string {
  if (dataUris.length === 0) return html;
  return html.replace(NICHE_IMAGE_PLACEHOLDER, (_, n: string) => {
    const index = Math.max(0, Number(n) - 1) % dataUris.length;
    return dataUris[index];
  });
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

// Nichos alimentícios. A ordem importa: os mais específicos vêm antes
// (ex.: "restaurante japonês" deve cair em sushi, não em restaurante).
const FOOD_NICHES: [string, string][] = [
  ["hamburgueria", "burger food restaurant"],
  ["hamburguer", "burger food restaurant"],
  ["burger", "burger food restaurant"],
  ["pizzaria", "pizza food"],
  ["pizza", "pizza food"],
  ["parrilla", "grilled steak parrilla food"],
  ["churrascaria", "barbecue grilled meat food"],
  ["churrasco", "barbecue grilled meat food"],
  ["espetinho", "grilled skewers barbecue food"],
  ["sushi", "sushi japanese food"],
  ["japones", "sushi japanese food"],
  ["temakeria", "sushi temaki japanese food"],
  ["acai", "acai bowl food"],
  ["sorveteria", "ice cream dessert food"],
  ["confeitaria", "cake pastry dessert food"],
  ["doceria", "sweets dessert food"],
  ["padaria", "bakery bread food"],
  ["pastelaria", "pastel fried pastry food"],
  ["cafeteria", "coffee cafe food"],
  ["marmitaria", "brazilian lunch plate food"],
  ["marmita", "brazilian lunch plate food"],
  ["lanchonete", "snack sandwich food"],
  ["restaurante", "restaurant food dish"],
  ["comida", "restaurant food dish"],
  ["gastronomia", "gourmet food dish"],
  ["delivery", "food delivery dish"],
];

const OTHER_NICHES: [string, string][] = [
  ["dentista", "dental clinic interior professional"],
  ["odontologia", "dental clinic modern professional"],
  ["salao", "hair salon beauty interior modern"],
  ["barbearia", "barbershop modern interior"],
  ["academia", "gym fitness modern interior"],
  ["farmacia", "pharmacy modern interior"],
  ["clinica", "medical clinic modern interior"],
  ["advocacia", "law office professional interior"],
  ["contabilidade", "accounting office professional"],
  ["imobiliaria", "real estate office modern"],
  ["pet", "veterinary clinic pet shop interior"],
  ["mecanica", "auto repair shop professional"],
  ["supermercado", "supermarket modern interior"],
  ["escola", "school education modern interior"],
];

// Traduz nicho para termo de busca em inglês para melhores resultados no Unsplash
function nicheToEnglish(niche: string): string {
  // Sem acentos, para "pizzaria"/"açaí"/"salão" baterem com ou sem acento
  const normalized = niche.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [key, value] of FOOD_NICHES) {
    // Nicho alimentício sempre leva "food", senão o Unsplash devolve fotos de escritório
    if (normalized.includes(key)) return value.includes("food") ? value : `${value} food`;
  }
  for (const [key, value] of OTHER_NICHES) {
    if (normalized.includes(key)) return value;
  }
  return `${niche} professional business interior`;
}

export async function POST(req: NextRequest) {
  if (GENERATION_DISABLED) {
    return Response.json({ error: "Geração de sites em manutenção." }, { status: 503 });
  }

  // GENERATION_MODEL (claude | gemini) decide o provedor. A chave é checada
  // antes do débito para não cobrar crédito de uma geração que nem começa.
  const provider = getGenerationProvider();
  const { env: apiKeyEnv, key: apiKey } = getProviderApiKey(provider);
  if (!apiKey) {
    return Response.json({ error: `${apiKeyEnv} não configurada.` }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Debita ANTES de chamar a IA. debitar_credito() verifica e desconta na
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
  const { name, address, rating, reviewCount, niche, city, nicheId, palette } = body;
  const telefone = body.telefone?.trim() || body.phone || "";
  const horario = body.horario?.trim();
  const diferencial = body.diferencial?.trim();
  const servicos = body.servicos?.trim();
  const tipoCTA: TipoCTA = body.tipoCTA ?? "whatsapp";

  const phoneDigits = toBrazilianE164Digits(telefone);
  const ctaHref = buildCtaHref(tipoCTA, phoneDigits);
  const ctaLabel = CTA_LABELS[tipoCTA];
  const whatsappHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null;

  // Cards de serviço: fotos do banco do nicho (até 3, sem repetir) ou só ícones.
  // Sobre nós: 1 foto do Unsplash, quando houver.
  const nicheImagePaths = nicheId ? getRandomImages(nicheId, 3) : [];
  const nicheImageData = (await Promise.all(nicheImagePaths.map(imageToDataUri))).filter(
    (uri): uri is string => uri !== null,
  );
  const [aboutImage] = await fetchUnsplashImages(nicheToEnglish(niche), 1);

  const aboutInstruction = aboutImage
    ? `- Sobre nós: use esta imagem ao lado do texto, com cantos arredondados: ${aboutImage}`
    : `- Sobre nós: sem foto — use um bloco decorativo em gradiente primary→secondary no lugar.`;

  const servicesInstruction = nicheImageData.length > 0
    ? `- Cards de serviço: use estas imagens reais do negócio no topo dos cards, uma por card, na ordem (se houver mais cards que imagens, repita a partir da primeira). Escreva o src EXATAMENTE como abaixo, com as chaves — ele é substituído pela imagem depois:
${nicheImageData.map((_, i) => `  <img src="{{NICHE_IMAGE_${i + 1}}}" alt="..." class="w-full h-48 object-cover">`).join("\n")}`
    : `- Cards de serviço: use ícones SVG inline — NÃO use imagens externas nos cards.`;

  const imageInstructions = `IMAGENS — não invente URLs, use apenas as indicadas:
- Hero: NÃO use imagem (o hero é só gradiente, ver estrutura)
${aboutInstruction}
${servicesInstruction}
- Todas as <img> com alt descritivo, loading="lazy" e object-cover`;

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
- primary: início do gradiente do hero, TODOS os botões de CTA, títulos em destaque, ícones dos diferenciais, fundo da seção CTA final
- secondary: fim do gradiente do hero, detalhes e acentos (sublinhados, badges, hover dos botões, estrelas, bordas de destaque)
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
1. HERO (min-h-screen): SEM imagem de fundo e SEM overlay escuro. Fundo em gradiente CSS da paleta: bg-gradient-to-br from-primary via-primary to-secondary (primária domina, secundária aparece no canto). Pode acrescentar 2-3 formas decorativas sutis (círculos com blur, bg-white/10 ou bg-secondary/30) atrás do conteúdo para dar profundidade. Texto branco sobre a área da cor primária, com contraste garantido. Título impactante e específico para o nicho (não genérico), subtítulo de 1 frase com o benefício principal${city ? ` e a cidade (${city})` : ""}, botão CTA grande. ${rating !== null ? "Mostre um selo com a nota do Google e as estrelas SVG." : ""}
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
    const html = injectNicheImages(await generateSiteHtml(provider, prompt, apiKey), nicheImageData);

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
