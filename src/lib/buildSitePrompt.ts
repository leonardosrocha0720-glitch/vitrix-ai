import type { ColorPalette } from "@/lib/palettes";
import type { TipoCTA } from "@/types/business";
import { toBrazilianE164Digits } from "@/lib/phone";

export interface SitePromptInput {
  nome: string;
  nicho: string;
  cidade: string;
  estado?: string;
  telefone: string;
  horario: string;
  servicos: string;
  diferencial: string;
  tipoCTA: TipoCTA;
  palette: ColorPalette;
  rating?: number | null;
  reviewCount?: number;
}

const WHATSAPP_TEXT = "Olá, vim pelo site e gostaria de mais informações";

function ctaInstruction(tipoCTA: TipoCTA, telefone: string): string {
  const digits = toBrazilianE164Digits(telefone);
  if (tipoCTA === "ligar") return `href="tel:+${digits}"`;
  if (tipoCTA === "formulario") {
    return `href="#contato" (âncora para uma seção com id="contato" contendo um formulário simples)`;
  }
  return `href="https://wa.me/${digits}?text=${encodeURIComponent(WHATSAPP_TEXT)}"`;
}

// Mapeia nichos PT-BR para descrição visual em inglês para geração de imagens
function nicheToVisualDescription(nicho: string): {
  heroImage: string;
  serviceImages: string[];
  ambianceImage: string;
  mood: string;
  style: string;
} {
  const n = nicho.toLowerCase();

  if (n.includes("hamburguer") || n.includes("burger") || n.includes("lanche")) {
    return {
      heroImage: "a mouth-watering gourmet burger with melted cheese, fresh lettuce, ripe tomatoes and crispy bacon on a rustic wooden board, professional food photography, dramatic lighting, bokeh background",
      serviceImages: [
        "a juicy smash burger with golden fries on a slate board, restaurant ambiance",
        "an artisan burger being assembled with fresh premium ingredients, close-up shot",
        "a refreshing craft beer beside a gourmet burger, warm restaurant lighting",
      ],
      ambianceImage: "a modern burger restaurant interior with industrial decor, warm Edison bulb lighting, happy customers dining",
      mood: "warm, appetizing, bold and indulgent",
      style: "bold typography, deep amber and charcoal tones, rustic yet modern"
    };
  }

  if (n.includes("pizza") || n.includes("pizzaria")) {
    return {
      heroImage: "a freshly baked wood-fired pizza with bubbling mozzarella cheese, fresh basil and vibrant tomato sauce, professional food photography, restaurant setting",
      serviceImages: [
        "pizza ingredients laid out artistically — flour, fresh tomatoes, basil, mozzarella",
        "a pizza being stretched by skilled hands in a professional kitchen",
        "a steaming pizza slice being pulled away showing perfect cheese pull",
      ],
      ambianceImage: "a cozy Italian-style pizzeria interior with brick walls, warm lighting, wood-fired oven visible",
      mood: "warm, authentic, Italian, inviting",
      style: "warm red and cream tones, rustic texture, authentic feel"
    };
  }

  if (n.includes("barbearia") || n.includes("barber") || n.includes("cabelereiro") || n.includes("salão")) {
    return {
      heroImage: "a professional barber giving a precise fade haircut to a client in a modern barbershop, dramatic side lighting, sharp focus",
      serviceImages: [
        "a detailed close-up of a stylish fade haircut with sharp lines, professional lighting",
        "a classic straight razor shave in progress, traditional barbershop tools",
        "premium grooming products — pomade, scissors, comb — on a marble shelf",
      ],
      ambianceImage: "a sleek modern barbershop interior with leather chairs, vintage mirrors, exposed brick walls, warm amber lighting",
      mood: "masculine, premium, confident, classic meets modern",
      style: "deep charcoal, gold accents, clean lines"
    };
  }

  if (n.includes("restaurante") || n.includes("churrascaria") || n.includes("culinária")) {
    return {
      heroImage: "a stunning gourmet dish beautifully plated on a white ceramic plate, professional restaurant food photography, soft bokeh lighting",
      serviceImages: [
        "an elegant table setting in a fine restaurant with candles and wine glasses",
        "a chef's hands carefully plating a colorful gourmet dish in a professional kitchen",
        "a selection of perfectly grilled meats with seasonal vegetables, appetizing presentation",
      ],
      ambianceImage: "a sophisticated restaurant dining room with warm lighting, elegant decor, happy diners enjoying their meal",
      mood: "upscale, inviting, gastronomic, warm",
      style: "warm neutrals, gold accents, sophisticated typography"
    };
  }

  if (n.includes("academia") || n.includes("gym") || n.includes("fitness") || n.includes("musculação")) {
    return {
      heroImage: "a fit athlete performing a powerful deadlift in a modern gym, dramatic low-angle shot, cinematic lighting with dust particles in background",
      serviceImages: [
        "a row of premium barbells and weight plates in a clean modern gym",
        "a personal trainer motivating a client during an intense workout session",
        "a group fitness class in action — spinning or HIIT, energetic atmosphere",
      ],
      ambianceImage: "a state-of-the-art gym interior with high ceilings, modern equipment, motivational lighting",
      mood: "energetic, powerful, motivating, premium",
      style: "bold blacks and electric colors, strong typography, high contrast"
    };
  }

  if (n.includes("clínica") || n.includes("dentista") || n.includes("odonto") || n.includes("médico") || n.includes("saúde")) {
    return {
      heroImage: "a friendly, professional doctor or dentist in a white coat smiling warmly at the camera in a clean modern clinic, bright natural lighting",
      serviceImages: [
        "a modern, spotlessly clean medical examination room with advanced equipment",
        "a close-up of a perfect, healthy white smile after dental treatment",
        "a caring healthcare professional consulting with a happy patient",
      ],
      ambianceImage: "a welcoming modern clinic reception area with plants, natural light, calm and professional atmosphere",
      mood: "trustworthy, clean, professional, caring",
      style: "clean whites, soft greens or blues, minimal and medical"
    };
  }

  if (n.includes("advocacia") || n.includes("advogado") || n.includes("jurídico")) {
    return {
      heroImage: "a confident professional attorney in a sharp suit in a prestigious law office, dramatic lighting, bookshelves of legal volumes in background",
      serviceImages: [
        "a close-up of a legal contract being signed with an elegant pen on a mahogany desk",
        "a balanced scale of justice on a law office desk, professional atmosphere",
        "two attorneys in discussion over legal documents in a modern meeting room",
      ],
      ambianceImage: "a prestigious law office interior — dark wood furniture, floor-to-ceiling bookshelves, city view through large windows",
      mood: "authoritative, trustworthy, prestigious, serious",
      style: "deep navy and gold, serif typography, classical gravitas"
    };
  }

  if (n.includes("imobiliária") || n.includes("imóveis") || n.includes("corretor")) {
    return {
      heroImage: "a stunning modern luxury home exterior at golden hour, manicured lawn, architectural photography, warm sky",
      serviceImages: [
        "a bright and airy modern living room interior with designer furniture and natural light",
        "a real estate agent handing over keys to happy clients in front of a house",
        "an aerial drone view of a beautiful residential neighborhood at sunset",
      ],
      ambianceImage: "a modern real estate office with large property photos on walls, professional team working",
      mood: "aspirational, premium, trustworthy, inviting",
      style: "warm gold and white, clean modern lines, aspirational photography"
    };
  }

  if (n.includes("pet") || n.includes("veterinário") || n.includes("petshop")) {
    return {
      heroImage: "an adorable golden retriever puppy being gently groomed by a caring professional groomer, bright cheerful setting, natural light",
      serviceImages: [
        "a happy dog receiving professional grooming — fluffy and clean after a bath",
        "a veterinarian smiling while examining a healthy cat, modern clinic",
        "a colorful pet shop display with premium pet food and accessories",
      ],
      ambianceImage: "a bright, cheerful pet shop interior with happy pets and welcoming staff",
      mood: "cheerful, caring, fun, trustworthy",
      style: "bright colors, playful typography, warm and inviting"
    };
  }

  if (n.includes("mecânica") || n.includes("auto") || n.includes("carro") || n.includes("oficina")) {
    return {
      heroImage: "a professional mechanic in clean uniform working confidently on a luxury car engine in a modern auto shop, dramatic industrial lighting",
      serviceImages: [
        "a modern car lift with a vehicle elevated in a spotless professional garage",
        "close-up of skilled hands performing precise engine maintenance work",
        "a row of gleaming repaired cars ready for pickup in a professional auto shop",
      ],
      ambianceImage: "a clean, well-organized modern auto repair shop with professional equipment and lighting",
      mood: "reliable, professional, technical, trustworthy",
      style: "industrial grays and blues, bold typography, technical precision"
    };
  }

  // fallback genérico
  return {
    heroImage: `a professional business scene representing ${nicho}, modern setting, bright natural lighting, people working confidently, high quality photography`,
    serviceImages: [
      `a professional service being delivered for ${nicho}, satisfied customer, bright setting`,
      `high-quality equipment and tools used in ${nicho} services, professional environment`,
      `a team of professionals working on ${nicho} tasks, modern office or workspace`,
    ],
    ambianceImage: `a welcoming, professional ${nicho} business interior, clean modern design, good lighting`,
    mood: "professional, trustworthy, modern, welcoming",
    style: "clean and professional with good contrast"
  };
}

// Prompt para colar no Google AI Studio e gerar o site com imagens de IA
export function buildSitePrompt(input: SitePromptInput): string {
  const { nome, nicho, cidade, estado, telefone, horario, servicos, diferencial, tipoCTA, palette } = input;
  const { rating, reviewCount } = input;
  const visual = nicheToVisualDescription(nicho);
  const whatsappDigits = toBrazilianE164Digits(telefone);

  const optionalLines = [
    estado ? `- Estado: ${estado}` : null,
    rating
      ? `- Avaliação no Google: ${rating.toFixed(1)} estrelas${reviewCount ? ` (${reviewCount} avaliações)` : ""}`
      : null,
  ]
    .filter(Boolean)
    .map((line) => `\n${line}`)
    .join("");

  return `Você é um desenvolvedor web e designer de altíssimo nível, especialista em criar landing pages modernas, bonitas e de alta conversão — com o nível visual de agências premium.

**SUA MISSÃO:** Criar um site one-page HTML completo e visualmente impressionante para o negócio abaixo. O site precisa ter imagens reais geradas por IA, não ícones SVG — use sua capacidade nativa de gerar imagens e incorpore-as como base64 data URIs diretamente nas tags <img>.

---

## DADOS DO NEGÓCIO

- Nome: ${nome}
- Nicho: ${nicho}
- Cidade: ${cidade || "não informada"}${optionalLines}
- Telefone/WhatsApp: ${telefone}
- Horário: ${horario || "não informado"}
- Serviços: ${servicos || "use os serviços mais típicos e lucrativos do nicho"}
- Diferencial: ${diferencial || "use os principais diferenciais competitivos do nicho"}

---

## PALETA DE CORES

- Cor primária: ${palette.primary}
- Cor secundária: ${palette.secondary}
- Fundo claro: ${palette.bg}
- Texto: ${palette.text}
- Tom visual: ${visual.mood}
- Estilo: ${visual.style}

---

## IMAGENS QUE VOCÊ DEVE GERAR (use sua capacidade nativa de geração de imagem)

Gere cada uma das imagens abaixo e incorpore como base64 data URI nas tags <img> correspondentes:

**Imagem 1 — Hero principal** (dimensões: 1200x700px, formato: jpg):
${visual.heroImage}

**Imagem 2 — Serviço/Produto 1** (dimensões: 600x400px, formato: jpg):
${visual.serviceImages[0]}

**Imagem 3 — Serviço/Produto 2** (dimensões: 600x400px, formato: jpg):
${visual.serviceImages[1]}

**Imagem 4 — Serviço/Produto 3** (dimensões: 600x400px, formato: jpg):
${visual.serviceImages[2]}

**Imagem 5 — Ambiente/Equipe** (dimensões: 1200x500px, formato: jpg):
${visual.ambianceImage}

---

## ESTRUTURA DO SITE

### 1. Header fixo
- Logo (nome do negócio em tipografia elegante)
- Menu: Serviços | Sobre | Depoimentos | Contato
- Botão CTA no canto direito

### 2. Hero section — visual de impacto máximo
- **Imagem 1** como background com overlay gradiente sutil
- Título principal impactante (máx. 8 palavras, foco no benefício)
- Subtítulo com proposta de valor clara
- Botão CTA grande e chamativo
${rating ? `- Badge de avaliação Google: ${rating.toFixed(1)} ⭐ (${reviewCount || ""} avaliações)` : ""}

### 3. Seção "Nossos Serviços" — cards com imagens reais
- 3 cards lado a lado (responsivo: 1 coluna mobile)
- Cada card tem: **Imagem 2, 3 ou 4** no topo, título do serviço, breve descrição, preço ou chamada
- Hover effect suave com sombra

### 4. Seção "Por que nos escolher" — diferenciais visuais
- Layout em split: texto à esquerda, **Imagem 5** à direita
- 3 bullets de diferenciais com ícones SVG simples e texto
- Background na cor primária com texto branco

### 5. Depoimentos${rating ? " + Avaliação Google" : ""}
- ${rating ? `Destaque visual: "${rating.toFixed(1)} estrelas no Google" com ícone e badge colorido\n- ` : ""}2 cards de depoimentos com foto de avatar gerada, nome, profissão e texto realista para o nicho

### 6. CTA Final
- Background gradiente usando as cores da paleta
- Título urgente e convincente
- Subtítulo com objeção respondida
- Botão grande

### 7. Footer
- Nome do negócio + tagline
- Horário: ${horario || "consulte-nos"}
- Telefone e cidade
- Frase de fechamento elegante

---

## REQUISITOS TÉCNICOS

- **Tailwind CSS via CDN**: https://cdn.tailwindcss.com
- **IMAGENS**: use base64 data URIs (as que você gerou acima) — NUNCA URLs externas
- **Animações**: CSS puro @keyframes — fadeUp, fadeIn, slideIn — ZERO bibliotecas JS externas
- **Mobile-first**: totalmente responsivo, funciona perfeitamente em celular
- **Botão flutuante WhatsApp**: fixed bottom-5 right-5, circular, fundo #25D366, ícone SVG branco, href="https://wa.me/${whatsappDigits}"
- **Botão CTA principal**: ${ctaInstruction(tipoCTA, telefone)}
- **Tipografia**: Google Fonts via @import (escolha uma fonte elegante adequada ao nicho)
- **Arquivo único**: todo o HTML, CSS e JS em um único arquivo .html
- **Sem marcos d'água ou atribuições**: o site deve parecer feito por uma agência profissional

---

## QUALIDADE ESPERADA

O resultado final deve parecer um site de R$3.000 feito por uma agência premium — não um template genérico. Use o estilo visual descrito (${visual.mood}) e faça as imagens geradas conversarem harmonicamente com as cores da paleta.

**Retorne APENAS o código HTML completo, sem explicações, sem markdown, sem blocos de código — apenas o HTML puro iniciando com <!DOCTYPE html>.**`;
}
