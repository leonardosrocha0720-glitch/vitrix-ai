import type { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ColorPalette } from "@/lib/palettes";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export interface GenerateSiteRequest {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credits < 1) {
    return Response.json({ error: "Créditos insuficientes" }, { status: 402 });
  }

  const body = (await req.json()) as GenerateSiteRequest;
  const { name, address, phone, rating, reviewCount, niche, city, palette } = body;

  const client = new Anthropic({ apiKey });

  const searchTerm = nicheToEnglish(niche);
  const images = await fetchUnsplashImages(searchTerm);

  const imageInstructions = images.length > 0
    ? `IMAGENS REAIS DISPONÍVEIS — use estas URLs nas tags <img> e como background-image:
${images.map((url, i) => `Imagem ${i + 1}: ${url}`).join("\n")}
- Hero: use Imagem 1 como fundo (background-image) com overlay escuro semitransparente
- Sobre nós: Imagem 2 ao lado do texto
- Cards de serviços: Imagens 3, 4 e 5 como foto no topo de cada card
Não invente URLs. Use apenas estas.`
    : `Sem imagens disponíveis. Use gradientes CSS elegantes no hero e ícones SVG nos cards.`;

  const prompt = `Você é um web designer sênior especializado em sites de alta conversão para pequenos negócios brasileiros.

Crie um site completo e profissional em HTML para:

Nome: ${name}
Nicho: ${niche}
Endereço: ${address}
Telefone: ${phone ?? "Não informado"}
Avaliação: ${rating !== null ? `${rating} estrelas (${reviewCount} avaliações no Google)` : "Não informado"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STACK OBRIGATÓRIA — use exatamente estas bibliotecas via CDN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
- Animações: Use CSS puro com @keyframes e classes como "animate-fadeIn". NÃO use bibliotecas externas de animação.
- Google Fonts: Importe "Inter" ou "Poppins" via link do Google Fonts


Configure o Tailwind com as cores da paleta via tailwind.config:
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS ABSOLUTAS — LEIA COM ATENÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0. CRÍTICO: O HTML deve ser COMPLETO do <!DOCTYPE> até </html>. Nunca corte o código no meio. Se precisar, simplifique o CSS e o texto para garantir que todas as seções sejam geradas.
1. ZERO emojis. Em nenhum lugar. Proibido.
2. Use classes Tailwind para TODO o estilo. Seja CONCISO — evite classes redundantes. CSS customizado só para o que o Tailwind não cobre.
3. Use CSS @keyframes para animações. Adicione no <style>: @keyframes fadeUp { from { opacity:0; transform:translateY(30px)} to { opacity:1; transform:translateY(0)} } .animate-fadeup { animation: fadeUp 0.7s ease forwards; }
4. Textos realistas e específicos para o nicho "${niche}". Nada genérico.
5. Retorne APENAS o HTML começando com <!DOCTYPE html>. Sem markdown, sem explicações.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${imageInstructions}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEÇÕES OBRIGATÓRIAS (gere TODAS as 8, HTML conciso para não cortar):

1. HEADER fixo: logo bold + nav (Início|Serviços|Sobre|Avaliações|Contato) + botão CTA cor primary
2. HERO 100vh: fundo Imagem 1 com overlay bg-black/60, headline grande, subtítulo, 2 botões
3. SERVIÇOS: grid 3 cards com foto (Imagens 3-5), título e descrição do nicho
4. SOBRE NÓS: 2 colunas, texto à esquerda + Imagem 2 à direita
5. DIFERENCIAIS: 3 itens com ícone SVG pequeno, título e texto curto
6. AVALIAÇÕES: nota estrelas SVG, contagem avaliações, 3 depoimentos com nome e cidade
7. CONTATO: endereço, telefone, botão WhatsApp SVG verde, link Google Maps
8. FOOTER: nome, tagline, links, copyright

BOTÃO FLUTUANTE WhatsApp: fixed bottom-6 right-6, bg-green-500, rounded-full, p-4, shadow-lg, com ícone SVG branco, link https://wa.me/55${(phone ?? "").replace(/\D/g, "")}.

`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    let html = (message.content[0] as { type: string; text: string }).text;
    // Remove markdown code blocks caso o modelo os inclua
    html = html.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/i, "").trim();

    await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id);

    await supabase.from("generated_sites").insert({
      user_id: user.id,
      business_name: name,
      niche,
      city: city ?? null,
      palette: palette.name,
    });

    return Response.json({ html });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar site.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
